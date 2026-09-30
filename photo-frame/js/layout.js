// Frame layout + drawing.
//
// Every size is a fraction of u = sqrt(imageWidth * imageHeight). Using the
// geometric mean (rather than width) keeps the border sensible for portrait,
// landscape, square, panoramas and tall screenshots alike, and because the
// layout is purely proportional the small preview is an exact scaled copy of
// the full-resolution export.

export const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Microsoft YaHei", system-ui, sans-serif';

/** Images smaller than this (geometric mean, px) are enlarged so text stays legible. */
export const MIN_UNIT = 1000;

const M = {
  title: 0.026, // camera / params
  body: 0.0195, // params on centered layouts
  caption: 0.0175, // lens, date
  adjust: 0.016,
  lineGap: 0.009,
  padV: 0.027, // bar top/bottom padding
  side: 0.035, // text inset from the photo edges
  colGap: 0.04, // min gap between left and right columns
  frame: 0.035, // border around the photo when options.framed
  section: 0.017, // gap before the edits block
  emptyBar: 0.05, // bar height when there's no text
};
const ADJ_SEP = '   ·   ';
const ASCENT = 0.93;
const DESCENT = 0.25;

// The border is always white.
const PALETTE = { bg: '#ffffff', primary: '#1a1a1a', secondary: '#8a8a8a' };

/**
 * @param src      { width, height } of the decoded, upright image
 * @param content  { title, subtitle, params: string[], caption, adjustments: string[] }
 * @param options  { layout: 'bar'|'center', framed: boolean, maxLong?: number }
 * @param measure  a CanvasRenderingContext2D used only for measureText
 */
export function computeLayout(src, content, options, measure) {
  let scale = 1;
  const long = Math.max(src.width, src.height);
  if (options.maxLong && long > options.maxLong) scale = options.maxLong / long;
  const unit0 = Math.sqrt(src.width * src.height) * scale;
  if (unit0 < MIN_UNIT) scale *= MIN_UNIT / unit0;
  const imgW = Math.max(1, Math.round(src.width * scale));
  const imgH = Math.max(1, Math.round(src.height * scale));
  const u = Math.sqrt(imgW * imgH);
  const pal = PALETTE;

  const texter = makeTexter(measure);
  const texts = [];
  const lineH = (size) => size * (ASCENT + DESCENT);
  const place = (line, x, top, align, color) => {
    texts.push({ ...line, x, baseline: top + line.size * ASCENT, align, color });
    return top + lineH(line.size);
  };

  const framed = !!options.framed;
  const framePad = framed ? Math.round(M.frame * u) : 0;
  const imgRect = { x: framePad, y: framePad, w: imgW, h: imgH };
  const outW = imgW + framePad * 2;
  // Framed: text lines up with the photo's edges. Unframed: inset from the image edge.
  const left = framed ? framePad : Math.round(M.side * u);
  const avail = outW - left * 2;
  const zoneTop = framePad + imgH + (framed ? M.frame * 0.85 * u : M.padV * u);
  const bottomPad = framed ? M.frame * 1.15 * u : M.padV * u;
  const adjustItems = content.adjustments.filter(Boolean);
  const params = content.params.filter(Boolean);
  const hasText = [content.title, content.subtitle, content.caption].some(Boolean) || params.length > 0 || adjustItems.length > 0;

  let bottom;
  let placed = false;

  if (options.layout === 'bar') {
    const size = M.title * u;
    const cap = M.caption * u;
    const leftCol = [content.title && texter.line(content.title, size, 600), content.subtitle && texter.line(content.subtitle, cap, 400)].filter(Boolean);
    const rightCol = [params.length && texter.line(params.join('  '), size, 600), content.caption && texter.line(content.caption, cap, 400)].filter(Boolean);
    const lw = Math.max(0, ...leftCol.map((l) => l.width));
    const rw = Math.max(0, ...rightCol.map((l) => l.width));
    const need = lw + rw + (lw && rw ? M.colGap * u : 0);
    if (need <= avail) {
      placed = true;
      const colH = (col) => col.reduce((h, l, i) => h + lineH(l.size) + (i ? M.lineGap * u : 0), 0);
      const zoneH = Math.max(colH(leftCol), colH(rightCol));
      let y = zoneTop + (zoneH - colH(leftCol)) / 2;
      leftCol.forEach((l, i) => { y = place(l, left, y + (i ? M.lineGap * u : 0), 'left', i ? pal.secondary : pal.primary); });
      y = zoneTop + (zoneH - colH(rightCol)) / 2;
      rightCol.forEach((l, i) => { y = place(l, outW - left, y + (i ? M.lineGap * u : 0), 'right', i ? pal.secondary : pal.primary); });
      let end = zoneTop + zoneH;
      if (adjustItems.length) {
        end += zoneH ? M.section * u : 0;
        for (const l of texter.wrap(adjustItems, M.adjust * u, 400, avail, ADJ_SEP)) {
          end = place(l, left, end, 'left', pal.secondary) + M.lineGap * u * 0.6;
        }
        end -= M.lineGap * u * 0.6;
      }
      bottom = end + bottomPad;
    }
    // Otherwise (narrow photo, long names) fall through to the stacked layout.
  }

  if (!placed) {
    const cx = outW / 2;
    // Params and lens/date wrap instead of truncating, so no number is ever cut off.
    const lines = [];
    if (content.title) lines.push([texter.fit(content.title, M.title * u, 600, avail), pal.primary]);
    for (const l of texter.wrap(params, M.body * u, 500, avail, '  ')) lines.push([l, pal.primary]);
    const meta = [content.subtitle, content.caption].filter(Boolean);
    for (const l of texter.wrap(meta, M.caption * u, 400, avail, '  ·  ')) lines.push([l, pal.secondary]);
    let y = zoneTop;
    lines.forEach(([l, color], i) => { y = place(l, cx, y + (i ? M.lineGap * u : 0), 'center', color); });
    if (adjustItems.length) {
      if (lines.length) y += M.section * u;
      texter.wrap(adjustItems, M.adjust * u, 400, avail, ADJ_SEP).forEach((l, i) => {
        y = place(l, cx, y + (i ? M.lineGap * u * 0.6 : 0), 'center', pal.secondary);
      });
    }
    bottom = y + bottomPad;
  }

  if (!hasText) bottom = framePad + imgH + (framed ? framePad : M.emptyBar * u);

  return {
    outW,
    outH: Math.round(bottom),
    imgRect,
    texts,
    bg: pal.bg,
    scale,
    upscaled: scale > 1.0001,
  };
}

function makeTexter(ctx) {
  const width = (text, size, weight) => {
    ctx.font = `${weight} ${size}px ${FONT}`;
    return ctx.measureText(text).width;
  };
  const line = (text, size, weight) => ({ text, size, weight, width: width(text, size, weight) });

  // Shrinks (down to 70%) and then truncates a line so it fits maxW.
  const fit = (text, size, weight, maxW) => {
    let l = line(text, size, weight);
    if (l.width <= maxW) return l;
    l = line(text, Math.max(size * 0.7, (size * maxW) / l.width * 0.995), weight);
    if (l.width <= maxW) return l;
    let lo = 0, hi = text.length;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (width(`${text.slice(0, mid).trimEnd()}…`, l.size, weight) <= maxW) lo = mid; else hi = mid - 1;
    }
    return line(`${text.slice(0, lo).trimEnd()}…`, l.size, weight);
  };

  // Greedy wrap of items joined by a separator.
  // An item wider than a whole line (a long lens name) is broken at spaces.
  const wrap = (items, size, weight, maxW, sep) => {
    const out = [];
    let cur = '';
    const add = (piece, joiner) => {
      const next = cur ? cur + joiner + piece : piece;
      if (!cur || width(next, size, weight) <= maxW) cur = next;
      else { out.push(cur); cur = piece; }
    };
    for (const item of items) {
      if (width(item, size, weight) <= maxW) add(item, sep);
      else item.split(/\s+/).forEach((word, i) => add(word, i ? ' ' : sep));
    }
    if (cur) out.push(cur);
    return out.map((s) => fit(s, size, weight, maxW));
  };

  return { line, fit, wrap };
}

/**
 * Draws the part of the framed image that falls inside `tile` (output
 * coordinates) into ctx, scaled by `scale`. The canvas is expected to be
 * tile.w*scale × tile.h*scale.
 *
 * At scale 1 with integer tiles the photo is copied 1:1 — no resampling, so
 * the export keeps the original's sharpness.
 */
export function drawFrame(ctx, L, source, srcSize, tile, scale = 1) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = L.bg;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const r = L.imgRect;
  const x0 = Math.max(r.x, tile.x), y0 = Math.max(r.y, tile.y);
  const x1 = Math.min(r.x + r.w, tile.x + tile.w), y1 = Math.min(r.y + r.h, tile.y + tile.h);
  if (x1 > x0 && y1 > y0) {
    const kx = srcSize.width / r.w, ky = srcSize.height / r.h;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      source,
      (x0 - r.x) * kx, (y0 - r.y) * ky, (x1 - x0) * kx, (y1 - y0) * ky,
      (x0 - tile.x) * scale, (y0 - tile.y) * scale, (x1 - x0) * scale, (y1 - y0) * scale,
    );
  }

  ctx.setTransform(scale, 0, 0, scale, -tile.x * scale, -tile.y * scale);
  ctx.textBaseline = 'alphabetic';
  for (const t of L.texts) {
    // Drawn on every tile (the canvas clips); glyph overhang can cross tile edges.
    ctx.font = `${t.weight} ${t.size}px ${FONT}`;
    ctx.fillStyle = t.color;
    ctx.textAlign = t.align;
    ctx.fillText(t.text, t.x, t.baseline);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
