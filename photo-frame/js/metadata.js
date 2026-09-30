// Pulls EXIF (TIFF IFDs), XMP and the ICC profile out of an image file, with
// no dependencies. Supports JPEG, HEIC/HEIF/AVIF, PNG, WebP and TIFF/DNG.
//
// Everything is best effort: a file with no metadata returns empty fields,
// never throws.

const TYPE_SIZE = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8];
const td = new TextDecoder('utf-8');
const latin1 = new TextDecoder('latin1');

export function readMetadata(buf) {
  // frame: pixel size stored in the codec stream (JPEG SOF), before orientation.
  const out = { format: 'unknown', tiff: null, xmp: null, icc: null, frame: null };
  try {
    if (buf[0] === 0xff && buf[1] === 0xd8) parseJPEG(buf, out);
    else if (str4(buf, 4) === 'ftyp') parseISOBMFF(buf, out);
    else if (buf[0] === 0x89 && str4(buf, 1).startsWith('PNG')) parsePNG(buf, out);
    else if (str4(buf, 0) === 'RIFF' && str4(buf, 8) === 'WEBP') parseWebP(buf, out);
    else if (isTIFFHeader(buf, 0)) { out.format = 'tiff'; out.tiff = parseTIFF(buf, 0); }
  } catch (e) {
    console.warn('metadata parse failed', e);
  }
  if (!out.xmp) out.xmp = findXMP(buf);
  return out;
}

// MARK: containers

function parseJPEG(buf, out) {
  out.format = 'jpeg';
  const iccChunks = [];
  let i = 2;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff) break;
    const marker = buf[i + 1];
    if (marker === 0xff) { i++; continue; }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    if (marker === 0xda || marker === 0xd9) break; // image data starts: no more metadata
    const len = u16be(buf, i + 2);
    const seg = buf.subarray(i + 4, i + 2 + len);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      out.frame = { width: u16be(seg, 3), height: u16be(seg, 1) };
    } else if (marker === 0xe1) {
      if (str4(seg, 0) === 'Exif' && !out.tiff) out.tiff = parseTIFF(seg, 6);
      else if (latin1.decode(seg.subarray(0, 29)) === 'http://ns.adobe.com/xap/1.0/\0') {
        out.xmp = td.decode(seg.subarray(29));
      }
    } else if (marker === 0xe2 && latin1.decode(seg.subarray(0, 12)) === 'ICC_PROFILE\0') {
      iccChunks.push({ seq: seg[12], data: seg.subarray(14) });
    }
    i += 2 + len;
  }
  if (iccChunks.length) {
    iccChunks.sort((a, b) => a.seq - b.seq);
    out.icc = concat(iccChunks.map((c) => c.data));
  }
}

function parseISOBMFF(buf, out) {
  out.format = 'heif';
  const brand = str4(buf, 8);
  if (brand === 'avif' || brand === 'avis') out.format = 'avif';
  const meta = findBox(buf, 0, buf.length, 'meta');
  if (!meta) return;
  const start = meta.data + 4; // full box
  const iinf = findBox(buf, start, meta.end, 'iinf');
  const iloc = findBox(buf, start, meta.end, 'iloc');
  const idat = findBox(buf, start, meta.end, 'idat');
  const iprp = findBox(buf, start, meta.end, 'iprp');

  if (iprp) {
    const ipco = findBox(buf, iprp.data, iprp.end, 'ipco');
    if (ipco) {
      for (const box of boxes(buf, ipco.data, ipco.end)) {
        if (box.type !== 'colr') continue;
        const kind = str4(buf, box.data);
        if (kind === 'prof' || kind === 'rICC') { out.icc = buf.slice(box.data + 4, box.end); break; }
      }
    }
  }

  if (!iinf || !iloc) return;
  let exifId = null;
  const iinfVersion = buf[iinf.data];
  const infeStart = iinf.data + 4 + (iinfVersion === 0 ? 2 : 4);
  for (const box of boxes(buf, infeStart, iinf.end)) {
    if (box.type !== 'infe') continue;
    const v = buf[box.data];
    if (v < 2) continue;
    const id = v === 2 ? u16be(buf, box.data + 4) : u32be(buf, box.data + 4);
    const typeOff = box.data + 4 + (v === 2 ? 2 : 4) + 2;
    if (str4(buf, typeOff) === 'Exif') { exifId = id; break; }
  }
  if (exifId == null) return;

  const loc = parseIloc(buf, iloc).get(exifId);
  if (!loc) return;
  const base = loc.method === 1 && idat ? idat.data : 0;
  const parts = loc.extents.map(([off, len]) => buf.subarray(base + loc.baseOffset + off, base + loc.baseOffset + off + len));
  const exif = parts.length === 1 ? parts[0] : concat(parts);
  const tiffStart = 4 + u32be(exif, 0);
  if (isTIFFHeader(exif, tiffStart)) out.tiff = parseTIFF(exif, tiffStart);
}

function parseIloc(buf, box) {
  let p = box.data;
  const version = buf[p];
  p += 4;
  const offSize = buf[p] >> 4, lenSize = buf[p] & 15;
  const baseSize = buf[p + 1] >> 4, idxSize = version >= 1 ? buf[p + 1] & 15 : 0;
  p += 2;
  const readN = (n) => {
    let v = 0;
    for (let k = 0; k < n; k++) v = v * 256 + buf[p + k];
    p += n;
    return v;
  };
  const count = version < 2 ? readN(2) : readN(4);
  const items = new Map();
  for (let i = 0; i < count; i++) {
    const id = version < 2 ? readN(2) : readN(4);
    const method = version >= 1 ? readN(2) & 15 : 0;
    readN(2); // data_reference_index
    const baseOffset = readN(baseSize);
    const extentCount = readN(2);
    const extents = [];
    for (let e = 0; e < extentCount; e++) {
      if (idxSize) readN(idxSize);
      extents.push([readN(offSize), readN(lenSize)]);
    }
    items.set(id, { method, baseOffset, extents });
  }
  return items;
}

function parsePNG(buf, out) {
  out.format = 'png';
  let p = 8;
  while (p + 12 <= buf.length) {
    const len = u32be(buf, p);
    const type = str4(buf, p + 4);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'eXIf' && isTIFFHeader(data, 0)) out.tiff = parseTIFF(data, 0);
    if (type === 'iTXt' && latin1.decode(data.subarray(0, 17)) === 'XML:com.adobe.xmp') out.xmp = td.decode(data);
    if (type === 'IEND') break;
    p += 12 + len;
  }
}

function parseWebP(buf, out) {
  out.format = 'webp';
  let p = 12;
  while (p + 8 <= buf.length) {
    const type = str4(buf, p);
    const len = u32le(buf, p + 4);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'EXIF') {
      const off = str4(data, 0) === 'Exif' ? 6 : 0;
      if (isTIFFHeader(data, off)) out.tiff = parseTIFF(data, off);
    } else if (type === 'XMP ') out.xmp = td.decode(data);
    else if (type === 'ICCP') out.icc = data.slice();
    p += 8 + len + (len & 1);
  }
}

function findXMP(buf) {
  const open = indexOf(buf, '<x:xmpmeta');
  if (open < 0) return null;
  const close = indexOf(buf, '</x:xmpmeta>', open);
  return close < 0 ? null : td.decode(buf.subarray(open, close + 12));
}

// MARK: TIFF / EXIF

function isTIFFHeader(b, o) {
  return (b[o] === 0x49 && b[o + 1] === 0x49 && b[o + 2] === 42 && b[o + 3] === 0)
      || (b[o] === 0x4d && b[o + 1] === 0x4d && b[o + 2] === 0 && b[o + 3] === 42);
}

/**
 * Returns { le, ifd0, exif, gps } where each IFD is a Map(tag -> entry) and
 * entry = { type, count, bytes, value }. `bytes` are the raw value bytes in the
 * file's byte order so the writer can copy tags verbatim.
 */
export function parseTIFF(b, base) {
  if (!isTIFFHeader(b, base)) return null;
  const le = b[base] === 0x49;
  const dv = new DataView(b.buffer, b.byteOffset + base, b.length - base);
  const u16 = (o) => dv.getUint16(o, le);
  const u32 = (o) => dv.getUint32(o, le);

  const readIFD = (off) => {
    const map = new Map();
    if (!off || off + 2 > dv.byteLength) return map;
    const n = u16(off);
    for (let i = 0; i < n; i++) {
      const e = off + 2 + i * 12;
      if (e + 12 > dv.byteLength) break;
      const tag = u16(e), type = u16(e + 2), count = u32(e + 4);
      const size = (TYPE_SIZE[type] || 0) * count;
      if (!size) continue;
      const valOff = size <= 4 ? e + 8 : u32(e + 8);
      if (valOff + size > dv.byteLength) continue;
      const bytes = new Uint8Array(dv.buffer, dv.byteOffset + valOff, size).slice();
      map.set(tag, { type, count, bytes, value: decodeValue(dv, valOff, type, count, le) });
    }
    return map;
  };

  const ifd0 = readIFD(u32(4));
  const exifPtr = ifd0.get(0x8769)?.value;
  const gpsPtr = ifd0.get(0x8825)?.value;
  return {
    le,
    ifd0,
    exif: readIFD(typeof exifPtr === 'number' ? exifPtr : 0),
    gps: readIFD(typeof gpsPtr === 'number' ? gpsPtr : 0),
  };
}

function decodeValue(dv, o, type, count, le) {
  const one = (k) => {
    switch (type) {
      case 1: case 7: return dv.getUint8(o + k);
      case 3: return dv.getUint16(o + k * 2, le);
      case 4: return dv.getUint32(o + k * 4, le);
      case 5: { const d = dv.getUint32(o + k * 8 + 4, le); return d ? dv.getUint32(o + k * 8, le) / d : NaN; }
      case 6: return dv.getInt8(o + k);
      case 8: return dv.getInt16(o + k * 2, le);
      case 9: return dv.getInt32(o + k * 4, le);
      case 10: { const d = dv.getInt32(o + k * 8 + 4, le); return d ? dv.getInt32(o + k * 8, le) / d : NaN; }
      case 11: return dv.getFloat32(o + k * 4, le);
      case 12: return dv.getFloat64(o + k * 8, le);
      default: return null;
    }
  };
  if (type === 2) {
    const raw = new Uint8Array(dv.buffer, dv.byteOffset + o, count);
    return td.decode(raw).replace(/\0[\s\S]*$/, '').trim();
  }
  if (type === 7) return new Uint8Array(dv.buffer, dv.byteOffset + o, count).slice();
  if (count === 1) return one(0);
  const arr = [];
  for (let k = 0; k < Math.min(count, 64); k++) arr.push(one(k));
  return arr;
}

// MARK: ICC

/** Profile description, e.g. "Display P3" or "sRGB IEC61966-2.1". */
export function iccDescription(icc) {
  if (!icc || icc.length < 132) return '';
  try {
    const n = u32be(icc, 128);
    for (let i = 0; i < n; i++) {
      const e = 132 + i * 12;
      if (str4(icc, e) !== 'desc') continue;
      const off = u32be(icc, e + 4);
      const type = str4(icc, off);
      if (type === 'desc') {
        const len = u32be(icc, off + 8);
        return latin1.decode(icc.subarray(off + 12, off + 12 + len)).replace(/\0.*$/, '');
      }
      if (type === 'mluc') {
        const recLen = u32be(icc, off + 20);
        const recOff = u32be(icc, off + 24);
        return new TextDecoder('utf-16be').decode(icc.subarray(off + recOff, off + recOff + recLen));
      }
    }
  } catch { /* fall through */ }
  return '';
}

// MARK: helpers

function* boxes(buf, start, end) {
  let p = start;
  while (p + 8 <= end) {
    let size = u32be(buf, p);
    const type = str4(buf, p + 4);
    let data = p + 8;
    if (size === 1) { size = u32be(buf, p + 8) * 2 ** 32 + u32be(buf, p + 12); data = p + 16; }
    else if (size === 0) size = end - p;
    if (size < 8 || p + size > end) return;
    yield { type, data, end: p + size };
    p += size;
  }
}

function findBox(buf, start, end, type) {
  for (const b of boxes(buf, start, end)) if (b.type === type) return b;
  return null;
}

function indexOf(buf, text, from = 0) {
  const needle = Array.from(text, (c) => c.charCodeAt(0));
  const first = needle[0];
  outer: for (let i = buf.indexOf(first, from); i >= 0 && i + needle.length <= buf.length; i = buf.indexOf(first, i + 1)) {
    for (let k = 1; k < needle.length; k++) if (buf[i + k] !== needle[k]) continue outer;
    return i;
  }
  return -1;
}

function concat(parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

const str4 = (b, o) => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
const u16be = (b, o) => (b[o] << 8) | b[o + 1];
const u32be = (b, o) => ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];
const u32le = (b, o) => b[o] + (b[o + 1] << 8) + (b[o + 2] << 16) + ((b[o + 3] << 24) >>> 0);
