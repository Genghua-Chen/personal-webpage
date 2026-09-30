import { readMetadata, iccDescription } from './metadata.js';
import { FIELDS, EXPOSURE_FIELDS, detectFields, focalText, xmpAdjustments } from './format.js';
import { computeLayout, drawFrame } from './layout.js';
import { buildExifSegment, buildIccSegments } from './exif-writer.js';
import { JpegEncoder } from './jpeg-encoder.js';
import { t, getLang, setLang, ADJUSTMENT_KEYS } from './i18n.js';

const $ = (sel) => document.querySelector(sel);
const FIELD_LABEL = {
  camera: 'fieldCamera', lens: 'fieldLens', focal: 'fieldFocal', aperture: 'fieldAperture',
  shutter: 'fieldShutter', iso: 'fieldIso', ev: 'fieldEv', date: 'fieldDate',
};
const FIELD_PLACEHOLDER = {
  camera: 'Sony α7 V', lens: 'FE 24-70mm F2.8 GM II', focal: '35mm', aperture: 'f/2.8',
  shutter: '1/250s', iso: 'ISO 100', ev: '+0.3EV', date: '2026.09.29',
};
const PREVIEW_SOURCE_MAX = 2400; // px, long side of the cached downscaled photo
const PREVIEW_MAX_PIXELS = 3_500_000;
const TILE_MAX_W = 4096;
const TILE_MAX_PIXELS = 4_000_000; // well under iOS Safari's ~16.7M canvas limit

const state = {
  file: null,
  meta: null,
  img: null,
  srcW: 0,
  srcH: 0,
  previewSrc: null,
  colorSpace: 'srgb',
  embedIcc: null,
  detected: null,
  fields: {},
  equivalentFocal: true,
  adjustments: [],
  showAdjust: true,
  layout: 'bar',
  framed: false,
  size: 'original',
  quality: 95,
  keepExif: true,
  result: null,
  exporting: false,
  sourceNote: '',
};

const measureCtx = document.createElement('canvas').getContext('2d');

// MARK: color

const P3_SUPPORTED = (() => {
  try {
    const ctx = document.createElement('canvas').getContext('2d', { colorSpace: 'display-p3' });
    return ctx?.getContextAttributes?.().colorSpace === 'display-p3';
  } catch { return false; }
})();

function context2d(canvas, opts = {}) {
  return canvas.getContext('2d', { colorSpace: state.colorSpace, ...opts }) || canvas.getContext('2d', opts);
}

// MARK: loading

async function loadFile(file) {
  if (!file) return;
  clearResult();
  showStage('loading');
  try {
    const buf = new Uint8Array(await file.arrayBuffer());
    const meta = readMetadata(buf);
    const img = await decodeImage(file);

    const desc = iccDescription(meta.icc);
    if (/p3/i.test(desc) && P3_SUPPORTED) {
      state.colorSpace = 'display-p3';
      state.embedIcc = meta.icc;
    } else {
      // Anything else is converted to sRGB by the browser when drawn.
      state.colorSpace = 'srgb';
      state.embedIcc = /srgb/i.test(desc) ? meta.icc : null;
    }

    Object.assign(state, { file, meta, img, srcW: img.naturalWidth, srcH: img.naturalHeight });
    state.detected = detectFields(meta, { equivalentFocal: state.equivalentFocal });
    resetFields();
    state.adjustments = xmpAdjustments(meta.xmp).map((a) => ({ key: a.key, label: t(a.key), value: a.value, labelEdited: false }));
    state.previewSrc = makePreviewSource(img);
    state.sourceNote = decodedSmallerNote(meta, img);

    renderFields();
    renderAdjustments();
    renderSourceInfo();
    showStage('editor');
    scheduleRender();
  } catch (err) {
    console.error(err);
    showStage(state.img ? 'editor' : 'empty');
    toast(err.message === 'decode' ? t('decodeFailed') : t('exportFailed', { msg: err.message }));
  }
}

function decodeImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = 'async';
    // No img.decode(): it can stall indefinitely while the page is in the
    // background (e.g. the user switches apps mid-load); onload is enough.
    img.onload = () => {
      if (!img.naturalWidth) return reject(new Error('decode'));
      if (state.img?.src?.startsWith('blob:')) URL.revokeObjectURL(state.img.src);
      resolve(img);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
    img.src = url;
  });
}

function makePreviewSource(img) {
  const long = Math.max(img.naturalWidth, img.naturalHeight);
  const k = Math.min(1, PREVIEW_SOURCE_MAX / long);
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.naturalWidth * k));
  c.height = Math.max(1, Math.round(img.naturalHeight * k));
  const ctx = context2d(c);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

// Some browsers decode very large images at reduced size; say so. Compares
// against the JPEG frame size (EXIF PixelXDimension goes stale after crops).
function decodedSmallerNote(meta, img) {
  if (!meta.frame) return '';
  const fileLong = Math.max(meta.frame.width, meta.frame.height);
  const decLong = Math.max(img.naturalWidth, img.naturalHeight);
  return decLong < fileLong * 0.98 ? t('downscaledSource', { w: img.naturalWidth, h: img.naturalHeight }) : '';
}

// MARK: content

function resetFields() {
  const { values } = state.detected;
  for (const f of FIELDS) state.fields[f] = { value: values[f] || '', on: !!values[f] && f !== 'ev' };
  if (values.ev) state.fields.ev.on = true;
}

function content() {
  const v = (f) => (state.fields[f]?.on ? state.fields[f].value.trim() : '');
  return {
    title: v('camera'),
    subtitle: v('lens'),
    params: EXPOSURE_FIELDS.map(v).filter(Boolean),
    caption: v('date'),
    adjustments: state.showAdjust
      ? state.adjustments.map((a) => [a.label.trim(), a.value.trim()].filter(Boolean).join(' ')).filter(Boolean)
      : [],
  };
}

function layoutFor(maxLong) {
  return computeLayout(
    { width: state.srcW, height: state.srcH },
    content(),
    { layout: state.layout, framed: state.framed, maxLong },
    measureCtx,
  );
}

const maxLong = () => (state.size === 'original' ? 0 : Number(state.size));

// MARK: preview

let renderQueued = false;
function scheduleRender() {
  clearResult();
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderPreview();
  });
}

function renderPreview() {
  if (!state.img) return;
  const L = layoutFor(maxLong());
  const s = Math.min(1, Math.sqrt(PREVIEW_MAX_PIXELS / (L.outW * L.outH)));
  const canvas = $('#preview');
  const w = Math.max(1, Math.round(L.outW * s)), h = Math.max(1, Math.round(L.outH * s));
  if (canvas.width !== w || canvas.height !== h || canvas.dataset.cs !== state.colorSpace) {
    canvas.width = w;
    canvas.height = h;
    canvas.dataset.cs = state.colorSpace;
  }
  const ctx = context2d(canvas);
  const ps = state.previewSrc;
  drawFrame(ctx, L, ps, { width: ps.width, height: ps.height }, { x: 0, y: 0, w: L.outW, h: L.outH }, w / L.outW);

  const notes = [t('outputSize', { w: L.outW, h: L.outH })];
  if (L.upscaled) notes.push(t('upscaled'));
  if (state.sourceNote) notes.push(state.sourceNote);
  $('#outputInfo').textContent = notes.join(' ');
}

// MARK: export

async function exportImage() {
  if (!state.img || state.exporting) return;
  state.exporting = true;
  updateExportButton(0);
  try {
    const blob = await encodeFullSize((p) => updateExportButton(p));
    const L = layoutFor(maxLong());
    const base = (state.file.name || 'photo').replace(/\.[^.]+$/, '');
    const name = `${base}-frame.jpg`;
    state.result = { blob, url: URL.createObjectURL(blob), name, w: L.outW, h: L.outH };
    showResult();
  } catch (err) {
    console.error(err);
    toast(t('exportFailed', { msg: err.message || String(err) }));
  } finally {
    state.exporting = false;
    updateExportButton();
  }
}

async function encodeFullSize(onProgress) {
  const L = layoutFor(maxLong());
  if (L.outW > 65535 || L.outH > 65535) throw new Error('image is larger than JPEG allows (65535 px)');

  const segments = [];
  if (state.keepExif) {
    const exif = buildExifSegment(state.meta.tiff, L.outW, L.outH);
    if (exif) segments.push(exif);
  }
  segments.push(...buildIccSegments(state.embedIcc));

  const encoder = await createEncoder(L.outW, L.outH, state.quality, segments);
  const tileW = Math.min(L.outW, TILE_MAX_W);
  const stripH = Math.max(8, Math.floor(Math.min(2048, TILE_MAX_PIXELS / tileW) / 8) * 8);
  const canvas = document.createElement('canvas');
  const ctx = context2d(canvas, { willReadFrequently: true });
  const srcSize = { width: state.srcW, height: state.srcH };

  let pending = null;
  try {
    for (let y = 0; y < L.outH; y += stripH) {
      const rows = Math.min(stripH, L.outH - y);
      let strip;
      for (let x = 0; x < L.outW; x += tileW) {
        const w = Math.min(tileW, L.outW - x);
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== rows) canvas.height = rows;
        drawFrame(ctx, L, state.img, srcSize, { x, y, w, h: rows }, 1);
        const data = ctx.getImageData(0, 0, w, rows).data;
        if (w === L.outW) { strip = data; break; }
        strip ??= new Uint8ClampedArray(L.outW * rows * 4);
        for (let r = 0; r < rows; r++) strip.set(data.subarray(r * w * 4, (r + 1) * w * 4), (r * L.outW + x) * 4);
      }
      if (pending) await pending; // encode strip N while strip N+1 renders
      pending = encoder.addRows(strip, rows);
      onProgress(Math.round(((y + rows) / L.outH) * 100));
    }
    if (pending) await pending;
    const parts = await encoder.finish();
    return new Blob(parts, { type: 'image/jpeg' });
  } finally {
    canvas.width = canvas.height = 0; // release canvas memory right away (matters on iOS)
    encoder.dispose();
  }
}

/** Worker-backed encoder, falling back to the main thread if workers are unavailable. */
async function createEncoder(width, height, quality, segments) {
  try {
    const enc = workerEncoder();
    await enc.init(width, height, quality, segments);
    return enc;
  } catch (err) {
    console.warn('worker encoder unavailable, encoding on main thread', err);
    const enc = new JpegEncoder(width, height, { quality, segments });
    return {
      addRows: async (rgba, rows) => {
        enc.addRows(rgba, rows);
        await new Promise((r) => setTimeout(r)); // let the progress bar paint
      },
      finish: async () => enc.finish(),
      dispose() {},
    };
  }
}

function workerEncoder() {
  const worker = new Worker(new URL('./encoder-worker.js', import.meta.url), { type: 'module' });
  const queue = [];
  const failAll = (err) => { while (queue.length) queue.shift().reject(err); };
  worker.onmessage = ({ data }) => {
    const p = queue.shift();
    if (!p) return;
    if (data.type === 'error') p.reject(new Error(data.message));
    else p.resolve(data);
  };
  worker.onerror = (e) => { e.preventDefault?.(); failAll(new Error(e.message || 'worker failed')); };
  const call = (msg, transfer = []) => new Promise((resolve, reject) => {
    queue.push({ resolve, reject });
    worker.postMessage(msg, transfer);
  });
  return {
    init: (width, height, quality, segments) => call({ type: 'init', width, height, quality, segments }),
    addRows: (rgba, rows) => call({ type: 'rows', rgba, rows }, [rgba.buffer]),
    finish: async () => (await call({ type: 'finish' })).parts,
    dispose: () => worker.terminate(),
  };
}

// MARK: result

function showResult() {
  const r = state.result;
  $('#result').hidden = false;
  $('#exportBtn').hidden = true;
  $('#resultInfo').textContent = t('done', { w: r.w, h: r.h, mb: (r.blob.size / 1048576).toFixed(1) });
  const a = $('#downloadBtn');
  a.href = r.url;
  a.download = r.name;
  $('#result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearResult() {
  if (!state.result) return;
  URL.revokeObjectURL(state.result.url);
  state.result = null;
  $('#result').hidden = true;
  $('#exportBtn').hidden = false;
}

async function shareResult() {
  const r = state.result;
  if (!r) return;
  const file = new File([r.blob], r.name, { type: 'image/jpeg' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
    } catch (err) {
      if (err.name !== 'AbortError') toast(t('shareFailed'));
    }
  } else {
    $('#downloadBtn').click();
  }
}

// MARK: UI rendering

function showStage(stage) {
  document.body.dataset.stage = stage;
}

function renderSourceInfo() {
  const fmt = (state.meta.format || '').toUpperCase();
  $('#sourceInfo').textContent = t('sourceInfo', { w: state.srcW, h: state.srcH, fmt });
  const hasInfo = Object.values(state.detected.values).some(Boolean);
  $('#noExif').hidden = hasInfo;
  const { raw } = state.detected;
  $('#equivRow').hidden = !(raw.focal35 > 0 && raw.focal > 0 && Math.round(raw.focal35) !== Math.round(raw.focal));
}

function renderFields() {
  const list = $('#fields');
  list.textContent = '';
  for (const f of FIELDS) {
    const row = document.createElement('div');
    row.className = 'field';
    const id = `field-${f}`;
    row.innerHTML = `
      <input type="checkbox" class="check" id="${id}-on" aria-label="">
      <label class="field-name" for="${id}"></label>
      <input type="text" class="field-input" id="${id}" autocomplete="off" autocapitalize="off" spellcheck="false">`;
    const on = row.querySelector('.check');
    const input = row.querySelector('.field-input');
    row.querySelector('.field-name').textContent = t(FIELD_LABEL[f]);
    on.setAttribute('aria-label', t(FIELD_LABEL[f]));
    on.checked = state.fields[f].on;
    input.value = state.fields[f].value;
    input.placeholder = FIELD_PLACEHOLDER[f];
    row.classList.toggle('off', !on.checked);
    on.addEventListener('change', () => {
      state.fields[f].on = on.checked;
      row.classList.toggle('off', !on.checked);
      scheduleRender();
    });
    input.addEventListener('input', () => {
      const wasEmpty = !state.fields[f].value;
      state.fields[f].value = input.value;
      if (wasEmpty && input.value) { state.fields[f].on = on.checked = true; row.classList.remove('off'); }
      scheduleRender();
    });
    list.append(row);
  }
}

function renderAdjustments() {
  const list = $('#adjustList');
  list.textContent = '';
  state.adjustments.forEach((a, i) => {
    const row = document.createElement('div');
    row.className = 'adj';
    row.innerHTML = `
      <input type="text" class="adj-name" autocomplete="off">
      <input type="text" class="adj-value" autocomplete="off" inputmode="text">
      <button type="button" class="adj-remove">×</button>`;
    const name = row.querySelector('.adj-name');
    const value = row.querySelector('.adj-value');
    const remove = row.querySelector('.adj-remove');
    name.value = a.label;
    value.value = a.value;
    name.placeholder = t('adjName');
    value.placeholder = t('adjValue');
    remove.setAttribute('aria-label', t('remove'));
    name.addEventListener('input', () => { a.label = name.value; a.labelEdited = true; scheduleRender(); });
    value.addEventListener('input', () => { a.value = value.value; scheduleRender(); });
    remove.addEventListener('click', () => { state.adjustments.splice(i, 1); renderAdjustments(); scheduleRender(); });
    list.append(row);
  });
  $('#adjustEmpty').hidden = state.adjustments.length > 0;

  const sel = $('#addAdjust');
  sel.textContent = '';
  sel.append(new Option(t('addAdjust'), ''));
  for (const key of ADJUSTMENT_KEYS) sel.append(new Option(t(key), key));
  sel.append(new Option(t('customAdjust'), '__custom'));
}

function applyI18n() {
  document.documentElement.lang = getLang() === 'zh' ? 'zh-CN' : 'en';
  document.title = t('pageTitle');
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  if (state.img) {
    for (const a of state.adjustments) if (a.key && !a.labelEdited) a.label = t(a.key);
    renderFields();
    renderAdjustments();
    renderSourceInfo();
    state.sourceNote = decodedSmallerNote(state.meta, state.img);
    scheduleRender();
  }
  updateExportButton();
  if (state.result) showResult();
}

function updateExportButton(progress) {
  const btn = $('#exportBtn');
  btn.disabled = state.exporting;
  btn.textContent = state.exporting ? t('exporting', { p: progress ?? 0 }) : t('export');
  btn.style.setProperty('--progress', state.exporting ? `${progress ?? 0}%` : '0%');
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 5000);
}

function syncSegments() {
  for (const seg of document.querySelectorAll('.seg')) {
    const key = seg.dataset.bind;
    for (const b of seg.querySelectorAll('button')) {
      const on = String(state[key]) === b.dataset.value;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
    }
  }
}

// MARK: wiring

function init() {
  applyI18n();
  syncSegments();

  const input = $('#fileInput');
  input.addEventListener('change', () => { loadFile(input.files[0]); input.value = ''; });
  for (const b of document.querySelectorAll('[data-pick]')) b.addEventListener('click', () => input.click());

  const drop = document.body;
  drop.addEventListener('dragover', (e) => { e.preventDefault(); document.body.classList.add('dragging'); });
  drop.addEventListener('dragleave', (e) => { if (!e.relatedTarget) document.body.classList.remove('dragging'); });
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    document.body.classList.remove('dragging');
    const file = [...(e.dataTransfer?.files || [])].find((f) => f.type.startsWith('image/') || /\.(heic|heif|avif)$/i.test(f.name));
    if (file) loadFile(file);
  });

  for (const seg of document.querySelectorAll('.seg')) {
    seg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const key = seg.dataset.bind;
      state[key] = key === 'quality' ? Number(b.dataset.value) : b.dataset.value;
      syncSegments();
      scheduleRender();
    });
  }

  $('#equivalentFocal').addEventListener('change', (e) => {
    state.equivalentFocal = e.target.checked;
    state.fields.focal.value = focalText(state.detected.raw, state.equivalentFocal);
    renderFields();
    scheduleRender();
  });
  $('#resetInfo').addEventListener('click', () => {
    state.detected = detectFields(state.meta, { equivalentFocal: state.equivalentFocal });
    resetFields();
    renderFields();
    scheduleRender();
  });
  $('#framed').addEventListener('change', (e) => { state.framed = e.target.checked; scheduleRender(); });
  $('#showAdjust').addEventListener('change', (e) => { state.showAdjust = e.target.checked; scheduleRender(); });
  $('#keepExif').addEventListener('change', (e) => { state.keepExif = e.target.checked; clearResult(); });
  $('#addAdjust').addEventListener('change', (e) => {
    const key = e.target.value;
    if (!key) return;
    const custom = key === '__custom';
    state.adjustments.push({ key: custom ? null : key, label: custom ? '' : t(key), value: '', labelEdited: custom });
    state.showAdjust = $('#showAdjust').checked = true;
    renderAdjustments();
    const rows = $('#adjustList').querySelectorAll('.adj');
    rows[rows.length - 1]?.querySelector(custom ? '.adj-name' : '.adj-value')?.focus();
    scheduleRender();
  });

  $('#exportBtn').addEventListener('click', exportImage);
  $('#shareBtn').addEventListener('click', shareResult);
  $('#langBtn').addEventListener('click', () => { setLang(getLang() === 'zh' ? 'en' : 'zh'); applyI18n(); });
}

init();
