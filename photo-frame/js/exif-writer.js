// Builds the APP1 (EXIF) and APP2 (ICC) segments for the exported JPEG.
//
// Shooting info is copied tag-for-tag from the source (same byte order, raw
// value bytes), from a whitelist. Deliberately dropped: GPS, serial numbers,
// maker notes and thumbnails. Orientation is forced to 1 (the pixels are
// already upright) and the pixel dimensions are set to the new size.

const IFD0_TAGS = [
  0x010f, // Make
  0x0110, // Model
  0x0131, // Software
  0x0132, // DateTime
  0x013b, // Artist
  0x8298, // Copyright
];

const EXIF_TAGS = [
  0x829a, 0x829d, // ExposureTime, FNumber
  0x8822, 0x8827, 0x8830, 0x8832, // ExposureProgram, ISO, SensitivityType, RecommendedExposureIndex
  0x9000, 0x9003, 0x9004, 0x9010, 0x9011, 0x9012, // ExifVersion, dates, offsets
  0x9201, 0x9202, 0x9204, 0x9205, 0x9207, 0x9208, 0x9209, 0x920a, // APEX, bias, metering, flash, focal
  0x9290, 0x9291, 0x9292, // SubSecTime*
  0xa001, // ColorSpace
  0xa402, 0xa403, 0xa405, 0xa406, // ExposureMode, WhiteBalance, FocalLengthIn35mm, SceneCaptureType
  0xa432, 0xa433, 0xa434, // LensSpecification, LensMake, LensModel
];

const TYPE_SIZE = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8];

/** Returns a framed APP1 segment (FFE1 + length + "Exif\0\0" + TIFF), or null. */
export function buildExifSegment(tiff, width, height) {
  if (!tiff) return null;
  const le = tiff.le;

  const ifd0 = [];
  for (const tag of IFD0_TAGS) if (tiff.ifd0.has(tag)) ifd0.push({ tag, ...tiff.ifd0.get(tag) });
  ifd0.push({ tag: 0x0112, type: 3, count: 1, bytes: num(3, 1, le) }); // Orientation = 1

  const exif = [];
  for (const tag of EXIF_TAGS) if (tiff.exif.has(tag)) exif.push({ tag, ...tiff.exif.get(tag) });
  exif.push({ tag: 0xa002, type: 4, count: 1, bytes: num(4, width, le) });
  exif.push({ tag: 0xa003, type: 4, count: 1, bytes: num(4, height, le) });
  if (!tiff.exif.has(0x9000)) exif.push({ tag: 0x9000, type: 7, count: 4, bytes: new TextEncoder().encode('0232') });

  // Only keep entries whose byte length matches their declared type/count.
  const valid = (e) => e.bytes.length === (TYPE_SIZE[e.type] || 0) * e.count && e.count > 0;
  const ifd0Entries = ifd0.filter(valid);
  const exifEntries = exif.filter(valid);
  ifd0Entries.push({ tag: 0x8769, type: 4, count: 1, bytes: null }); // ExifIFD pointer, patched below
  ifd0Entries.sort((a, b) => a.tag - b.tag);
  exifEntries.sort((a, b) => a.tag - b.tag);

  const ifdSize = (entries) => 2 + entries.length * 12 + 4;
  const dataSize = (entries) => entries.reduce((n, e) => n + (e.bytes && e.bytes.length > 4 ? (e.bytes.length + 1) & ~1 : 0), 0);

  const ifd0Off = 8;
  const exifOff = ifd0Off + ifdSize(ifd0Entries) + dataSize(ifd0Entries);
  const total = exifOff + ifdSize(exifEntries) + dataSize(exifEntries);

  const tiffBytes = new Uint8Array(total);
  const dv = new DataView(tiffBytes.buffer);
  tiffBytes.set(le ? [0x49, 0x49, 42, 0] : [0x4d, 0x4d, 0, 42]);
  dv.setUint32(4, ifd0Off, le);

  const writeIFD = (entries, off) => {
    dv.setUint16(off, entries.length, le);
    let dataOff = off + ifdSize(entries);
    entries.forEach((e, i) => {
      const p = off + 2 + i * 12;
      dv.setUint16(p, e.tag, le);
      dv.setUint16(p + 2, e.type, le);
      dv.setUint32(p + 4, e.count, le);
      if (e.tag === 0x8769 && e.bytes === null) {
        dv.setUint32(p + 8, exifOff, le);
      } else if (e.bytes.length <= 4) {
        tiffBytes.set(e.bytes, p + 8);
      } else {
        dv.setUint32(p + 8, dataOff, le);
        tiffBytes.set(e.bytes, dataOff);
        dataOff += (e.bytes.length + 1) & ~1;
      }
    });
    dv.setUint32(off + 2 + entries.length * 12, 0, le); // no next IFD (drops thumbnail IFD1)
  };
  writeIFD(ifd0Entries, ifd0Off);
  writeIFD(exifEntries, exifOff);

  const payload = new Uint8Array(6 + total);
  payload.set([0x45, 0x78, 0x69, 0x66, 0, 0]); // "Exif\0\0"
  payload.set(tiffBytes, 6);
  return frame(0xe1, payload);
}

/** Splits an ICC profile into APP2 segments. */
export function buildIccSegments(icc) {
  if (!icc || !icc.length) return [];
  const MAX = 65519 - 16;
  const count = Math.ceil(icc.length / MAX);
  const header = new TextEncoder().encode('ICC_PROFILE\0');
  const segs = [];
  for (let i = 0; i < count; i++) {
    const chunk = icc.subarray(i * MAX, (i + 1) * MAX);
    const payload = new Uint8Array(14 + chunk.length);
    payload.set(header);
    payload[12] = i + 1;
    payload[13] = count;
    payload.set(chunk, 14);
    segs.push(frame(0xe2, payload));
  }
  return segs;
}

function frame(marker, payload) {
  if (payload.length + 2 > 0xffff) return null;
  const seg = new Uint8Array(4 + payload.length);
  seg[0] = 0xff;
  seg[1] = marker;
  seg[2] = (payload.length + 2) >> 8;
  seg[3] = (payload.length + 2) & 0xff;
  seg.set(payload, 4);
  return seg;
}

function num(type, v, le) {
  const b = new Uint8Array(TYPE_SIZE[type]);
  const dv = new DataView(b.buffer);
  if (type === 3) dv.setUint16(0, v, le);
  else dv.setUint32(0, v, le);
  return b;
}
