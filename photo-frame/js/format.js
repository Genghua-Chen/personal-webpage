// Turns parsed metadata into the short strings printed on the frame.

export const FIELDS = ['camera', 'lens', 'focal', 'aperture', 'shutter', 'iso', 'ev', 'date'];
export const EXPOSURE_FIELDS = ['focal', 'aperture', 'shutter', 'iso', 'ev'];

export function decimal(v, digits) {
  let s = v.toFixed(digits);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s;
}

export const aperture = (f) => `f/${decimal(f, 1)}`;
export const focalLength = (mm) => `${decimal(mm, mm < 10 ? 1 : 0)}mm`;
export const iso = (v) => `ISO ${Math.round(v)}`;

/** 1/250s, 1/2s, 0.4s, 2s, 30s */
export function shutter(t) {
  if (!(t > 0)) return '';
  if (t >= 1) return `${decimal(t, 1)}s`;
  const n = Math.round(1 / t);
  if (n >= 2 && Math.abs(1 / n - t) / t < 0.06) return `1/${n}s`;
  return `${decimal(t, 1)}s`;
}

export function exposureBias(ev) {
  if (!(Math.abs(ev) >= 0.05)) return '';
  return `${ev > 0 ? '+' : '-'}${decimal(Math.abs(ev), 1)}EV`;
}

/** "2026:09:29 13:12:05" -> "2026.09.29" (date only; users can type a time in by hand) */
export function date(raw) {
  if (!raw) return '';
  const m = /^(\d{4})[:-](\d{2})[:-](\d{2})/.exec(raw);
  if (!m || m[1] === '0000') return '';
  return `${m[1]}.${m[2]}.${m[3]}`;
}

const MAKES = [
  ['om digital', 'OM System'], ['nikon', 'Nikon'], ['canon', 'Canon'], ['sony', 'Sony'],
  ['fujifilm', 'Fujifilm'], ['olympus', 'Olympus'], ['panasonic', 'Panasonic'], ['leica', 'Leica'],
  ['hasselblad', 'Hasselblad'], ['ricoh', 'Ricoh'], ['pentax', 'Pentax'], ['apple', 'Apple'],
  ['google', 'Google'], ['samsung', 'Samsung'], ['xiaomi', 'Xiaomi'], ['huawei', 'Huawei'],
  ['honor', 'Honor'], ['oneplus', 'OnePlus'], ['oppo', 'OPPO'], ['vivo', 'vivo'], ['dji', 'DJI'],
  ['gopro', 'GoPro'], ['sigma', 'Sigma'], ['insta360', 'Insta360'], ['phase one', 'Phase One'],
];

export function cleanMake(raw) {
  const lower = raw.toLowerCase();
  return MAKES.find(([m]) => lower.includes(m))?.[1] ?? raw;
}

/** "ILCE-7RM5" -> "α7R V", "ILCE-6400" -> "α6400" */
export function sonyAlpha(model) {
  const m = /^ILCE-(\d+)([A-Z]*?)(?:M(\d))?$/.exec(model);
  if (!m) return null;
  const roman = ['', '', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  return `α${m[1]}${m[2]}${m[3] ? ` ${roman[+m[3]] ?? `M${m[3]}`}` : ''}`;
}

export function cameraName(rawMake, model) {
  const make = rawMake ? cleanMake(rawMake) : '';
  if (!model) return make;
  if (!make) return model;
  if (make === 'Apple' || make === 'Google') return model; // "iPhone 15 Pro", "Pixel 8"
  let body = model;
  const lower = model.toLowerCase();
  const prefix = [make.toLowerCase(), rawMake.split(' ')[0].toLowerCase()].find((p) => p && lower.startsWith(p));
  if (prefix) body = model.slice(prefix.length).trim();
  if (make === 'Sony') body = sonyAlpha(body) ?? body;
  if (make === 'Nikon') body = body.replace('_2', 'II').replace('_3', 'III');
  return body ? `${make} ${body}` : make;
}

/** "iPhone 15 Pro back triple camera 6.765mm f/1.78" -> "Back triple camera 6.765mm f/1.78" */
export function lensName(lens, model) {
  if (!lens) return '';
  lens = lens.trim();
  if (model && lens.toLowerCase().startsWith(model.toLowerCase()) && lens.length > model.length) {
    lens = lens.slice(model.length).trim();
    lens = lens.charAt(0).toUpperCase() + lens.slice(1);
  }
  return lens;
}

/** Fills every field from metadata. Returns { values, raw } where raw keeps numbers for the focal toggle. */
export function detectFields(meta, { equivalentFocal = true } = {}) {
  const ifd0 = meta.tiff?.ifd0 ?? new Map();
  const exif = meta.tiff?.exif ?? new Map();
  const v = (map, tag) => map.get(tag)?.value;
  const num = (x) => (Array.isArray(x) ? x[0] : x);
  const xmpLens = meta.xmp && /aux:Lens="([^"]+)"/.exec(meta.xmp)?.[1];

  const make = v(ifd0, 0x010f);
  const model = v(ifd0, 0x0110);
  const raw = {
    focal: num(v(exif, 0x920a)),
    focal35: num(v(exif, 0xa405)),
  };
  const f = num(v(exif, 0x829d)) ?? (v(exif, 0x9202) != null ? 2 ** (num(v(exif, 0x9202)) / 2) : undefined);
  const t = num(v(exif, 0x829a));
  const isoV = num(v(exif, 0x8827));
  const bias = num(v(exif, 0x9204));

  const values = {
    camera: cameraName(typeof make === 'string' ? make : '', typeof model === 'string' ? model : ''),
    lens: lensName(v(exif, 0xa434) || xmpLens || '', typeof model === 'string' ? model : ''),
    focal: focalText(raw, equivalentFocal),
    aperture: f > 0 ? aperture(f) : '',
    shutter: t > 0 ? shutter(t) : '',
    iso: isoV > 0 ? iso(isoV) : '',
    ev: bias != null && Number.isFinite(bias) ? exposureBias(bias) : '',
    date: date(v(exif, 0x9003) || v(exif, 0x9004) || v(ifd0, 0x0132)),
  };
  return { values, raw };
}

export function focalText(raw, equivalent) {
  const mm = equivalent && raw.focal35 > 0 ? raw.focal35 : raw.focal;
  return mm > 0 ? focalLength(mm) : '';
}

// MARK: Lightroom / Camera Raw edits from XMP

const CRS = [
  ['Exposure2012', 'Exposure', 'ev'], ['Contrast2012', 'Contrast', 'signed'],
  ['Highlights2012', 'Highlights', 'signed'], ['Shadows2012', 'Shadows', 'signed'],
  ['Whites2012', 'Whites', 'signed'], ['Blacks2012', 'Blacks', 'signed'],
  ['Temperature', 'Temperature', 'kelvin'], ['Tint', 'Tint', 'signed'],
  ['Texture', 'Texture', 'signed'], ['Clarity2012', 'Clarity', 'signed'], ['Dehaze', 'Dehaze', 'signed'],
  ['Vibrance', 'Vibrance', 'signed'], ['Saturation', 'Saturation', 'signed'],
  ['Sharpness', 'Sharpening', 'plain'], ['LuminanceSmoothing', 'NoiseReduction', 'plain'],
  ['PostCropVignetteAmount', 'Vignette', 'signed'], ['GrainAmount', 'Grain', 'plain'],
];

/** Returns [{ key, value }] where key is an i18n label key. */
export function xmpAdjustments(xmp) {
  if (!xmp || !xmp.includes('crs:')) return [];
  const vals = {};
  for (const m of xmp.matchAll(/crs:([A-Za-z0-9]+)\s*=\s*"([^"]*)"/g)) vals[m[1]] = m[2];
  for (const m of xmp.matchAll(/<crs:([A-Za-z0-9]+)>([^<]*)<\/crs:[A-Za-z0-9]+>/g)) vals[m[1]] = m[2];
  // Temperature/Tint are always present for raw files; only show them when changed.
  const customWB = vals.WhiteBalance != null && vals.WhiteBalance !== 'As Shot';
  const out = [];
  for (const [tag, key, kind] of CRS) {
    if (vals[tag] == null) continue;
    const n = parseFloat(vals[tag]);
    if (!Number.isFinite(n)) continue;
    if ((tag === 'Temperature' || tag === 'Tint') && !customWB) continue;
    if (kind !== 'kelvin' && n === 0) continue;
    const sign = n > 0 ? '+' : '';
    const value = kind === 'ev' ? `${sign}${n.toFixed(2)}`
      : kind === 'signed' ? `${sign}${Math.round(n)}`
      : kind === 'kelvin' ? `${Math.round(n)}K`
      : `${Math.round(n)}`;
    out.push({ key, value });
  }
  return out;
}
