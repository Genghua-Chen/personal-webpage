// Streaming baseline JPEG encoder (4:4:4, no chroma subsampling).
//
// Why not canvas.toBlob? iOS Safari caps a canvas at ~16.7M pixels, so a
// full-resolution photo plus its frame often can't live in one canvas. This
// encoder takes the image as horizontal strips of RGBA rows, so the caller can
// render tile-by-tile and still get one full-size JPEG out.
//
// Usage:
//   const enc = new JpegEncoder(width, height, { quality: 95, segments: [app1, app2] });
//   enc.addRows(rgba, rows);   // rows must be a multiple of 8 except the last call
//   const parts = enc.finish(); // Uint8Array[] -> new Blob(parts, { type: 'image/jpeg' })

const ZIGZAG = [
  0, 1, 5, 6, 14, 15, 27, 28, 2, 4, 7, 13, 16, 26, 29, 42,
  3, 8, 12, 17, 25, 30, 41, 43, 9, 11, 18, 24, 31, 40, 44, 53,
  10, 19, 23, 32, 39, 45, 52, 54, 20, 22, 33, 38, 46, 51, 55, 60,
  21, 34, 37, 47, 50, 56, 59, 61, 35, 36, 48, 49, 57, 58, 62, 63,
];

// ITU T.81 Annex K base tables, natural (row-major) order.
const Y_QT = [
  16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55,
  14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51, 87, 80, 62,
  18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92,
  49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99,
];
const C_QT = [
  17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99,
  24, 26, 56, 99, 99, 99, 99, 99, 47, 66, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
];

const DC_LUM_COUNTS = [0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
const DC_LUM_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const AC_LUM_COUNTS = [0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7d];
const AC_LUM_VALUES = [
  0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07,
  0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0,
  0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
  0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49,
  0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69,
  0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
  0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7,
  0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5,
  0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
  0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8,
  0xf9, 0xfa,
];
const DC_CHR_COUNTS = [0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0];
const DC_CHR_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const AC_CHR_COUNTS = [0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 0x77];
const AC_CHR_VALUES = [
  0x00, 0x01, 0x02, 0x03, 0x11, 0x04, 0x05, 0x21, 0x31, 0x06, 0x12, 0x41, 0x51, 0x07, 0x61, 0x71,
  0x13, 0x22, 0x32, 0x81, 0x08, 0x14, 0x42, 0x91, 0xa1, 0xb1, 0xc1, 0x09, 0x23, 0x33, 0x52, 0xf0,
  0x15, 0x62, 0x72, 0xd1, 0x0a, 0x16, 0x24, 0x34, 0xe1, 0x25, 0xf1, 0x17, 0x18, 0x19, 0x1a, 0x26,
  0x27, 0x28, 0x29, 0x2a, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48,
  0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68,
  0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87,
  0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5,
  0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3,
  0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda,
  0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8,
  0xf9, 0xfa,
];

const AAN = [1.0, 1.387039845, 1.306562965, 1.175875602, 1.0, 0.785694958, 0.5411961, 0.275899379];

function scaledTable(base, quality) {
  const q = Math.min(100, Math.max(1, Math.round(quality)));
  const sf = q < 50 ? 5000 / q : 200 - q * 2;
  return base.map((v) => Math.min(255, Math.max(1, Math.floor((v * sf + 50) / 100))));
}

// Huffman code table: codes[symbol] = [code, length]
function huffmanCodes(counts, values) {
  const codes = [];
  let code = 0;
  let k = 0;
  for (let len = 1; len <= 16; len++) {
    for (let i = 0; i < counts[len - 1]; i++) codes[values[k++]] = [code++, len];
    code <<= 1;
  }
  return codes;
}

const HT = {
  dcY: huffmanCodes(DC_LUM_COUNTS, DC_LUM_VALUES),
  acY: huffmanCodes(AC_LUM_COUNTS, AC_LUM_VALUES),
  dcC: huffmanCodes(DC_CHR_COUNTS, DC_CHR_VALUES),
  acC: huffmanCodes(AC_CHR_COUNTS, AC_CHR_VALUES),
};

const CHUNK = 1 << 20;

export class JpegEncoder {
  constructor(width, height, { quality = 95, segments = [] } = {}) {
    if (!(width > 0 && height > 0 && width <= 65535 && height <= 65535)) {
      throw new RangeError(`JPEG size out of range: ${width}x${height}`);
    }
    this.width = width;
    this.height = height;
    this.rowsDone = 0;
    this.parts = [];
    this.buf = new Uint8Array(CHUNK);
    this.pos = 0;
    this.bitBuf = 0;
    this.bitCnt = 0;
    this.dcY = 0;
    this.dcCb = 0;
    this.dcCr = 0;
    this.du = new Int32Array(64);
    this.blkY = new Float32Array(64);
    this.blkCb = new Float32Array(64);
    this.blkCr = new Float32Array(64);

    const qY = scaledTable(Y_QT, quality);
    const qC = scaledTable(C_QT, quality);
    this.fdY = new Float32Array(64);
    this.fdC = new Float32Array(64);
    for (let r = 0, k = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++, k++) {
        this.fdY[k] = 1 / (qY[k] * AAN[r] * AAN[c] * 8);
        this.fdC[k] = 1 / (qC[k] * AAN[r] * AAN[c] * 8);
      }
    }
    this.writeHeaders(qY, qC, segments);
  }

  // MARK: byte output

  byte(b) {
    if (this.pos === CHUNK) {
      this.parts.push(this.buf);
      this.buf = new Uint8Array(CHUNK);
      this.pos = 0;
    }
    this.buf[this.pos++] = b;
  }

  word(w) {
    this.byte((w >> 8) & 0xff);
    this.byte(w & 0xff);
  }

  bytes(arr) {
    for (let i = 0; i < arr.length; i++) this.byte(arr[i]);
  }

  bits(code, len) {
    this.bitBuf = (this.bitBuf << len) | code;
    this.bitCnt += len;
    while (this.bitCnt >= 8) {
      const b = (this.bitBuf >>> (this.bitCnt - 8)) & 0xff;
      this.byte(b);
      if (b === 0xff) this.byte(0);
      this.bitCnt -= 8;
    }
    this.bitBuf &= (1 << this.bitCnt) - 1;
  }

  writeHeaders(qY, qC, segments) {
    this.word(0xffd8); // SOI
    for (const seg of segments) this.bytes(seg); // APPn, already framed with marker + length

    this.word(0xffdb); // DQT
    this.word(2 + 2 * 65);
    this.byte(0);
    for (let i = 0; i < 64; i++) this.byte(qY[ZIGZAG.indexOf(i)]);
    this.byte(1);
    for (let i = 0; i < 64; i++) this.byte(qC[ZIGZAG.indexOf(i)]);

    this.word(0xffc0); // SOF0
    this.word(17);
    this.byte(8);
    this.word(this.height);
    this.word(this.width);
    this.byte(3);
    this.bytes([1, 0x11, 0, 2, 0x11, 1, 3, 0x11, 1]);

    this.word(0xffc4); // DHT
    const tables = [
      [0x00, DC_LUM_COUNTS, DC_LUM_VALUES], [0x10, AC_LUM_COUNTS, AC_LUM_VALUES],
      [0x01, DC_CHR_COUNTS, DC_CHR_VALUES], [0x11, AC_CHR_COUNTS, AC_CHR_VALUES],
    ];
    this.word(2 + tables.reduce((n, t) => n + 17 + t[2].length, 0));
    for (const [id, counts, values] of tables) {
      this.byte(id);
      this.bytes(counts);
      this.bytes(values);
    }

    this.word(0xffda); // SOS
    this.word(12);
    this.bytes([3, 1, 0x00, 2, 0x11, 3, 0x11, 0x00, 0x3f, 0x00]);
  }

  // MARK: pixel data

  /** rgba: Uint8ClampedArray/Uint8Array of width*rows*4. */
  addRows(rgba, rows) {
    const W = this.width;
    if (rows <= 0) return;
    if (this.rowsDone + rows > this.height) throw new RangeError('too many rows');
    if (rows % 8 !== 0 && this.rowsDone + rows !== this.height) {
      throw new RangeError('strip height must be a multiple of 8 (except the last strip)');
    }
    const { blkY, blkCb, blkCr } = this;
    const lastRow = rows - 1;
    const lastCol = W - 1;
    for (let by = 0; by < rows; by += 8) {
      for (let bx = 0; bx < W; bx += 8) {
        // Edge blocks replicate the last row/column so padding doesn't ring.
        for (let r = 0, k = 0; r < 8; r++) {
          const rowOff = Math.min(by + r, lastRow) * W;
          for (let c = 0; c < 8; c++, k++) {
            const p = (rowOff + Math.min(bx + c, lastCol)) * 4;
            const R = rgba[p], G = rgba[p + 1], B = rgba[p + 2];
            blkY[k] = 0.299 * R + 0.587 * G + 0.114 * B - 128;
            blkCb[k] = -0.168735892 * R - 0.331264108 * G + 0.5 * B;
            blkCr[k] = 0.5 * R - 0.418687589 * G - 0.081312411 * B;
          }
        }
        this.dcY = this.block(blkY, this.fdY, this.dcY, HT.dcY, HT.acY);
        this.dcCb = this.block(blkCb, this.fdC, this.dcCb, HT.dcC, HT.acC);
        this.dcCr = this.block(blkCr, this.fdC, this.dcCr, HT.dcC, HT.acC);
      }
    }
    this.rowsDone += rows;
  }

  block(d, fdtbl, prevDC, dcTable, acTable) {
    fdct(d);
    const du = this.du;
    for (let i = 0; i < 64; i++) {
      const v = d[i] * fdtbl[i];
      du[ZIGZAG[i]] = v > 0 ? (v + 0.5) | 0 : (v - 0.5) | 0;
    }

    const diff = du[0] - prevDC;
    if (diff === 0) {
      this.bits(dcTable[0][0], dcTable[0][1]);
    } else {
      const [cat, bits] = magnitude(diff);
      this.bits(dcTable[cat][0], dcTable[cat][1]);
      this.bits(bits, cat);
    }

    let end = 63;
    while (end > 0 && du[end] === 0) end--;
    if (end === 0) {
      this.bits(acTable[0x00][0], acTable[0x00][1]);
      return du[0];
    }
    let i = 1;
    while (i <= end) {
      const start = i;
      while (du[i] === 0 && i <= end) i++;
      let zeros = i - start;
      while (zeros >= 16) {
        this.bits(acTable[0xf0][0], acTable[0xf0][1]);
        zeros -= 16;
      }
      const [cat, bits] = magnitude(du[i]);
      const sym = (zeros << 4) + cat;
      this.bits(acTable[sym][0], acTable[sym][1]);
      this.bits(bits, cat);
      i++;
    }
    if (end !== 63) this.bits(acTable[0x00][0], acTable[0x00][1]);
    return du[0];
  }

  finish() {
    if (this.rowsDone !== this.height) throw new Error(`only ${this.rowsDone}/${this.height} rows written`);
    if (this.bitCnt > 0) this.bits((1 << (8 - this.bitCnt)) - 1, 8 - this.bitCnt);
    this.word(0xffd9); // EOI
    this.parts.push(this.buf.subarray(0, this.pos));
    const parts = this.parts;
    this.parts = [];
    return parts;
  }
}

function magnitude(v) {
  const a = v < 0 ? -v : v;
  const cat = 32 - Math.clz32(a);
  return [cat, v < 0 ? v + (1 << cat) - 1 : v];
}

// AAN forward DCT, in place (scaling is folded into the quant table).
function fdct(d) {
  for (let off = 0; off < 64; off += 8) {
    const t0 = d[off] + d[off + 7], t7 = d[off] - d[off + 7];
    const t1 = d[off + 1] + d[off + 6], t6 = d[off + 1] - d[off + 6];
    const t2 = d[off + 2] + d[off + 5], t5 = d[off + 2] - d[off + 5];
    const t3 = d[off + 3] + d[off + 4], t4 = d[off + 3] - d[off + 4];
    let t10 = t0 + t3, t13 = t0 - t3, t11 = t1 + t2, t12 = t1 - t2;
    d[off] = t10 + t11;
    d[off + 4] = t10 - t11;
    const z1 = (t12 + t13) * 0.707106781;
    d[off + 2] = t13 + z1;
    d[off + 6] = t13 - z1;
    t10 = t4 + t5; t11 = t5 + t6; t12 = t6 + t7;
    const z5 = (t10 - t12) * 0.382683433;
    const z2 = 0.5411961 * t10 + z5;
    const z4 = 1.306562965 * t12 + z5;
    const z3 = t11 * 0.707106781;
    const z11 = t7 + z3, z13 = t7 - z3;
    d[off + 5] = z13 + z2;
    d[off + 3] = z13 - z2;
    d[off + 1] = z11 + z4;
    d[off + 7] = z11 - z4;
  }
  for (let off = 0; off < 8; off++) {
    const t0 = d[off] + d[off + 56], t7 = d[off] - d[off + 56];
    const t1 = d[off + 8] + d[off + 48], t6 = d[off + 8] - d[off + 48];
    const t2 = d[off + 16] + d[off + 40], t5 = d[off + 16] - d[off + 40];
    const t3 = d[off + 24] + d[off + 32], t4 = d[off + 24] - d[off + 32];
    let t10 = t0 + t3, t13 = t0 - t3, t11 = t1 + t2, t12 = t1 - t2;
    d[off] = t10 + t11;
    d[off + 32] = t10 - t11;
    const z1 = (t12 + t13) * 0.707106781;
    d[off + 16] = t13 + z1;
    d[off + 48] = t13 - z1;
    t10 = t4 + t5; t11 = t5 + t6; t12 = t6 + t7;
    const z5 = (t10 - t12) * 0.382683433;
    const z2 = 0.5411961 * t10 + z5;
    const z4 = 1.306562965 * t12 + z5;
    const z3 = t11 * 0.707106781;
    const z11 = t7 + z3, z13 = t7 - z3;
    d[off + 40] = z13 + z2;
    d[off + 24] = z13 - z2;
    d[off + 8] = z11 + z4;
    d[off + 56] = z11 - z4;
  }
}
