import { readMetadata, iccDescription } from './metadata.js';
import { FIELDS, EXPOSURE_FIELDS, detectFields, focalText, xmpAdjustments } from './format.js';
import { computeLayout, drawFrame } from './layout.js';
import { buildExifSegment, buildIccSegments } from './exif-writer.js';
import { JpegEncoder } from './jpeg-encoder.js';
import { makeZip } from './zip.js';
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
const THUMB_MAX = 240;
const TILE_MAX_W = 4096;
const TILE_MAX_PIXELS = 4_000_000; // well under iOS Safari's ~16.7M canvas limit

// One entry per chosen photo. Only the selected photo is kept decoded
// (state.cur), so a batch of 48MP photos doesn't exhaust memory on iPhone.
//   item = { id, file, meta, detected, values, adjustments, srcW, srcH,
//            colorSpace, embedIcc, thumb, sourceNote }
const state = {
  items: [],
  current: -1,
  cur: null, // { item, img, previewSrc }
  // Shared across the batch:
  fieldOn: Object.fromEntries(FIELDS.map((f) => [f, f !== 'ev'])),
  equivalentFocal: true,
  showAdjust: true,
  layout: 'bar',
  framed: true,
  size: 'original',
  quality: 95,
  keepExif: true,
  result: null, // { files: [{ name, blob, w, h }], url, zipUrl }
  exporting: false,
  busy: false,
};

const measureCtx = document.createElement('canvas').getContext('2d');
let nextId = 1;

const currentItem = () => state.items[state.current] ?? null;
const isBatch = () => state.items.length > 1;

// MARK: color

const P3_SUPPORTED = (() => {
  try {
    const ctx = document.createElement('canvas').getContext('2d', { colorSpace: 'display-p3' });
    return ctx?.getContextAttributes?.().colorSpace === 'display-p3';
  } catch { return false; }
})();

function context2d(canvas, colorSpace, opts = {}) {
  return canvas.getContext('2d', { colorSpace, ...opts }) || canvas.getContext('2d', opts);
}

function colorFor(meta) {
  const desc = iccDescription(meta.icc);
  if (/p3/i.test(desc) && P3_SUPPORTED) return { colorSpace: 'display-p3', embedIcc: meta.icc };
  // Anything else is converted to sRGB by the browser when drawn.
  return { colorSpace: 'srgb', embedIcc: /srgb/i.test(desc) ? meta.icc : null };
}

// MARK: loading

/** Reads the chosen files. replace=false appends to the current batch. */
async function addFiles(fileList, { replace }) {
  const files = [...fileList].filter((f) => f.type.startsWith('image/') || /\.(heic|heif|avif|jpe?g|png|webp|tiff?)$/i.test(f.name));
  if (!files.length || state.exporting || state.busy) return;
  state.busy = true;
  clearResult();
  const hadItems = state.items.length > 0 && !replace;
  if (!hadItems) showStage('loading');

  const added = [];
  let firstImg = null;
  let failed = 0;
  for (let i = 0; i < files.length; i++) {
    setLoading(t('loadingN', { i: i + 1, n: files.length }));
    try {
      const { item, img } = await loadItem(files[i]);
      added.push(item);
      if (!firstImg) firstImg = img; else releaseImage(img);
    } catch (err) {
      console.warn('could not open', files[i].name, err);
      failed++;
    }
  }
  setLoading('');
  state.busy = false;

  if (!added.length) {
    showStage(state.items.length ? 'editor' : 'empty');
    toast(t('decodeFailed'));
    return;
  }
  if (replace || !state.items.length) {
    releaseCurrent();
    state.items = added;
    state.fieldOn = Object.fromEntries(FIELDS.map((f) => [f, f !== 'ev']));
    // Show exposure compensation if any photo actually used it.
    if (added.some((it) => it.values.ev)) state.fieldOn.ev = true;
  } else {
    state.items.push(...added);
  }
  if (failed) toast(t('skipped', { n: failed }));
  showStage('editor');
  await select(state.items.indexOf(added[0]), firstImg);
}

async function loadItem(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const meta = readMetadata(buf);
  const img = await decodeImage(file);
  const detected = detectFields(meta, { equivalentFocal: state.equivalentFocal });
  const item = {
    id: nextId++,
    file,
    meta,
    detected,
    values: Object.fromEntries(FIELDS.map((f) => [f, detected.values[f] || ''])),
    adjustments: xmpAdjustments(meta.xmp).map((a) => ({ key: a.key, label: t(a.key), value: a.value, labelEdited: false })),
    srcW: img.naturalWidth,
    srcH: img.naturalHeight,
    ...colorFor(meta),
    thumb: makeThumb(img),
    sourceNote: '',
  };
  item.sourceNote = decodedSmallerNote(meta, img);
  return { item, img };
}

function decodeImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = 'async';
    // No img.decode(): it can stall indefinitely while the page is in the
    // background (e.g. the user switches apps mid-load); onload is enough.
    img.onload = () => (img.naturalWidth ? resolve(img) : reject(new Error('decode')));
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
    img.src = url;
  });
}

function releaseImage(img) {
  if (!img) return;
  if (img.src.startsWith('blob:')) URL.revokeObjectURL(img.src);
  img.removeAttribute('src');
}

function releaseCurrent() {
  if (!state.cur) return;
  releaseImage(state.cur.img);
  state.cur.previewSrc.width = state.cur.previewSrc.height = 0;
  state.cur = null;
}

function makeThumb(img) {
  const k = Math.min(1, THUMB_MAX / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.naturalWidth * k));
  c.height = Math.max(1, Math.round(img.naturalHeight * k));
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.8);
}

function makePreviewSource(img, colorSpace) {
  const long = Math.max(img.naturalWidth, img.naturalHeight);
  const k = Math.min(1, PREVIEW_SOURCE_MAX / long);
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.naturalWidth * k));
  c.height = Math.max(1, Math.round(img.naturalHeight * k));
  const ctx = context2d(c, colorSpace);
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

/** Makes items[index] the selected photo, decoding it if needed. */
async function select(index, img = null) {
  const item = state.items[index];
  if (!item) return;
  state.current = index;
  if (state.cur?.item !== item) {
    releaseCurrent();
    const decoded = img ?? await decodeImage(item.file);
    if (state.items[state.current] !== item) { releaseImage(decoded); return; } // selection moved on
    state.cur = { item, img: decoded, previewSrc: makePreviewSource(decoded, item.colorSpace) };
  } else if (img && img !== state.cur.img) {
    releaseImage(img);
  }
  renderStrip();
  renderFields();
  renderAdjustments();
  renderSourceInfo();
  updateExportButton();
  scheduleRender();
}

function removeItem(index) {
  if (state.exporting || state.busy) return;
  const [removed] = state.items.splice(index, 1);
  clearResult();
  if (state.cur?.item === removed) releaseCurrent();
  if (!state.items.length) {
    state.current = -1;
    showStage('empty');
    updateExportButton();
    return;
  }
  select(Math.min(index, state.items.length - 1));
}

// MARK: content

function content(item) {
  const v = (f) => (state.fieldOn[f] ? (item.values[f] || '').trim() : '');
  return {
    title: v('camera'),
    subtitle: v('lens'),
    params: EXPOSURE_FIELDS.map(v).filter(Boolean),
    caption: v('date'),
    adjustments: state.showAdjust
      ? item.adjustments.map((a) => [a.label.trim(), a.value.trim()].filter(Boolean).join(' ')).filter(Boolean)
      : [],
  };
}

function layoutFor(item) {
  return computeLayout(
    { width: item.srcW, height: item.srcH },
    content(item),
    { layout: state.layout, framed: state.framed, maxLong: state.size === 'original' ? 0 : Number(state.size) },
    measureCtx,
  );
}

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
  const cur = state.cur;
  if (!cur) return;
  const { item, previewSrc: ps } = cur;
  const L = layoutFor(item);
  const s = Math.min(1, Math.sqrt(PREVIEW_MAX_PIXELS / (L.outW * L.outH)));
  const canvas = $('#preview');
  const w = Math.max(1, Math.round(L.outW * s)), h = Math.max(1, Math.round(L.outH * s));
  if (canvas.width !== w || canvas.height !== h || canvas.dataset.cs !== item.colorSpace) {
    canvas.width = w;
    canvas.height = h;
    canvas.dataset.cs = item.colorSpace;
  }
  const ctx = context2d(canvas, item.colorSpace);
  drawFrame(ctx, L, ps, { width: ps.width, height: ps.height }, { x: 0, y: 0, w: L.outW, h: L.outH }, w / L.outW);

  const notes = [t('outputSize', { w: L.outW, h: L.outH })];
  if (L.upscaled) notes.push(t('upscaled'));
  if (item.sourceNote) notes.push(item.sourceNote);
  $('#outputInfo').textContent = notes.join(' ');
}

// MARK: export

async function exportAll() {
  if (!state.items.length || state.exporting || state.busy) return;
  state.exporting = true;
  const items = [...state.items];
  const n = items.length;
  const files = [];
  const usedNames = new Set();
  let failed = 0;
  updateExportButton({ i: 0, n, p: 0 });
  try {
    for (let i = 0; i < n; i++) {
      const item = items[i];
      const reuse = state.cur?.item === item;
      let img = null;
      try {
        img = reuse ? state.cur.img : await decodeImage(item.file);
        const L = layoutFor(item);
        const blob = await encodeFullSize(item, img, L, (p) => updateExportButton({ i, n, p }));
        files.push({ name: uniqueName(item.file.name, usedNames), blob, w: L.outW, h: L.outH });
      } catch (err) {
        console.error(err);
        failed++;
        if (n === 1) throw err;
      } finally {
        if (!reuse) releaseImage(img);
      }
    }
    if (!files.length) throw new Error(t('partialFail', { n: failed }));
    state.result = { files, url: URL.createObjectURL(files[0].blob), zipUrl: null };
    if (files.length > 1) state.result.zipUrl = URL.createObjectURL(await makeZip(files));
    showResult();
    if (failed) toast(t('partialFail', { n: failed }));
  } catch (err) {
    console.error(err);
    toast(t('exportFailed', { msg: err.message || String(err) }));
  } finally {
    state.exporting = false;
    updateExportButton();
  }
}

function uniqueName(original, used) {
  const base = (original || 'photo').replace(/\.[^.]+$/, '');
  let name = `${base}-frame.jpg`;
  for (let k = 2; used.has(name); k++) name = `${base}-frame-${k}.jpg`;
  used.add(name);
  return name;
}

async function encodeFullSize(item, img, L, onProgress) {
  if (L.outW > 65535 || L.outH > 65535) throw new Error('image is larger than JPEG allows (65535 px)');

  const segments = [];
  if (state.keepExif) {
    const exif = buildExifSegment(item.meta.tiff, L.outW, L.outH);
    if (exif) segments.push(exif);
  }
  segments.push(...buildIccSegments(item.embedIcc));

  const encoder = await createEncoder(L.outW, L.outH, state.quality, segments);
  const tileW = Math.min(L.outW, TILE_MAX_W);
  const stripH = Math.max(8, Math.floor(Math.min(2048, TILE_MAX_PIXELS / tileW) / 8) * 8);
  const canvas = document.createElement('canvas');
  const ctx = context2d(canvas, item.colorSpace, { willReadFrequently: true });
  const srcSize = { width: item.srcW, height: item.srcH };

  let pending = null;
  try {
    for (let y = 0; y < L.outH; y += stripH) {
      const rows = Math.min(stripH, L.outH - y);
      let strip;
      for (let x = 0; x < L.outW; x += tileW) {
        const w = Math.min(tileW, L.outW - x);
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== rows) canvas.height = rows;
        drawFrame(ctx, L, img, srcSize, { x, y, w, h: rows }, 1);
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
  const files = r.files;
  const batch = files.length > 1;
  const mb = (files.reduce((s, f) => s + f.blob.size, 0) / 1048576).toFixed(1);
  $('#result').hidden = false;
  $('#exportBtn').hidden = true;
  $('#resultInfo').textContent = batch
    ? t('doneBatch', { n: files.length, mb })
    : t('done', { w: files[0].w, h: files[0].h, mb });
  $('#shareBtn').textContent = batch ? t('saveAll', { n: files.length }) : t('save');
  $('#resultHint').textContent = batch ? t('saveHintBatch', { n: files.length }) : t('saveHint');
  const a = $('#downloadBtn');
  a.textContent = batch ? t('downloadZip') : t('download');
  a.href = batch ? r.zipUrl : r.url;
  a.download = batch ? `photo-frame-${files.length}.zip` : files[0].name;
  $('#result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearResult() {
  if (!state.result) return;
  URL.revokeObjectURL(state.result.url);
  if (state.result.zipUrl) URL.revokeObjectURL(state.result.zipUrl);
  state.result = null;
  $('#result').hidden = true;
  $('#exportBtn').hidden = false;
}

async function shareResult() {
  const r = state.result;
  if (!r) return;
  const files = r.files.map((f) => new File([f.blob], f.name, { type: 'image/jpeg' }));
  if (navigator.canShare?.({ files })) {
    try {
      await navigator.share({ files });
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

function setLoading(text) {
  $('#loadingText').textContent = text || t('loading');
}

function renderStrip() {
  const strip = $('#strip');
  strip.hidden = !isBatch();
  $('#batchHint').hidden = !isBatch();
  $('#batchHint').textContent = t('batchHint', { n: state.items.length });
  $('#photoCount').textContent = isBatch() ? `${state.current + 1} / ${state.items.length}` : '';
  strip.textContent = '';
  if (!isBatch()) return;
  state.items.forEach((item, i) => {
    const cell = document.createElement('div');
    cell.className = 'thumb' + (i === state.current ? ' on' : '');
    cell.innerHTML = `<button type="button" class="thumb-pick"><img alt=""></button><button type="button" class="thumb-remove">×</button>`;
    const pick = cell.querySelector('.thumb-pick');
    pick.querySelector('img').src = item.thumb;
    pick.setAttribute('aria-label', item.file.name);
    pick.addEventListener('click', () => { if (!state.exporting) select(i); });
    const rm = cell.querySelector('.thumb-remove');
    rm.setAttribute('aria-label', `${t('remove')} ${item.file.name}`);
    rm.addEventListener('click', () => removeItem(i));
    strip.append(cell);
  });
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'thumb-add';
  add.textContent = '+';
  add.setAttribute('aria-label', t('addPhotos'));
  add.addEventListener('click', () => pickFiles(true));
  strip.append(add);
  strip.querySelector('.thumb.on')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function renderSourceInfo() {
  const item = currentItem();
  if (!item) return;
  const fmt = (item.meta.format || '').toUpperCase();
  $('#sourceInfo').textContent = t('sourceInfo', { w: item.srcW, h: item.srcH, fmt });
  $('#noExif').hidden = Object.values(item.detected.values).some(Boolean);
  const differs = (it) => it.detected.raw.focal35 > 0 && it.detected.raw.focal > 0
    && Math.round(it.detected.raw.focal35) !== Math.round(it.detected.raw.focal);
  $('#equivRow').hidden = !state.items.some(differs);
  $('#pickAnother').textContent = isBatch() ? t('pickAgain') : t('pickAnother');
}

function renderFields() {
  const item = currentItem();
  if (!item) return;
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
    on.checked = state.fieldOn[f];
    input.value = item.values[f];
    input.placeholder = FIELD_PLACEHOLDER[f];
    row.classList.toggle('off', !on.checked);
    on.addEventListener('change', () => {
      state.fieldOn[f] = on.checked; // shared: hides/shows this field on every photo
      row.classList.toggle('off', !on.checked);
      scheduleRender();
    });
    input.addEventListener('input', () => {
      const wasEmpty = !item.values[f];
      item.values[f] = input.value; // per photo
      if (wasEmpty && input.value) { state.fieldOn[f] = on.checked = true; row.classList.remove('off'); }
      scheduleRender();
    });
    list.append(row);
  }
}

function renderAdjustments() {
  const item = currentItem();
  if (!item) return;
  const list = $('#adjustList');
  list.textContent = '';
  item.adjustments.forEach((a, i) => {
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
    remove.addEventListener('click', () => { item.adjustments.splice(i, 1); renderAdjustments(); scheduleRender(); });
    list.append(row);
  });
  $('#adjustEmpty').hidden = item.adjustments.length > 0;

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
  setLoading('');
  if (state.items.length) {
    for (const item of state.items) {
      for (const a of item.adjustments) if (a.key && !a.labelEdited) a.label = t(a.key);
    }
    if (state.cur) state.cur.item.sourceNote = decodedSmallerNote(state.cur.item.meta, state.cur.img);
    renderStrip();
    renderFields();
    renderAdjustments();
    renderSourceInfo();
    scheduleRender();
  }
  updateExportButton();
  if (state.result) showResult();
}

/** progress: { i, n, p } while exporting. */
function updateExportButton(progress) {
  const btn = $('#exportBtn');
  const n = state.items.length;
  btn.disabled = state.exporting;
  if (state.exporting && progress) {
    const overall = Math.round(((progress.i + progress.p / 100) / progress.n) * 100);
    btn.textContent = progress.n > 1
      ? t('exportingBatch', { i: progress.i + 1, n: progress.n, p: progress.p })
      : t('exporting', { p: progress.p });
    btn.style.setProperty('--progress', `${overall}%`);
  } else {
    btn.textContent = n > 1 ? t('exportAll', { n }) : t('export');
    btn.style.setProperty('--progress', '0%');
  }
  document.body.classList.toggle('exporting', state.exporting);
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

let appendMode = false;
function pickFiles(append) {
  if (state.exporting || state.busy) return;
  appendMode = append;
  $('#fileInput').click();
}

function init() {
  applyI18n();
  syncSegments();

  const input = $('#fileInput');
  input.addEventListener('change', () => {
    const files = [...input.files];
    const append = appendMode;
    appendMode = false;
    input.value = '';
    addFiles(files, { replace: !append });
  });
  for (const b of document.querySelectorAll('[data-pick]')) b.addEventListener('click', () => pickFiles(false));
  $('#addPhotos').addEventListener('click', () => pickFiles(true));

  const drop = document.body;
  drop.addEventListener('dragover', (e) => { e.preventDefault(); document.body.classList.add('dragging'); });
  drop.addEventListener('dragleave', (e) => { if (!e.relatedTarget) document.body.classList.remove('dragging'); });
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    document.body.classList.remove('dragging');
    const files = [...(e.dataTransfer?.files || [])];
    // Dropping onto the editor adds to the batch; onto the start page starts a new one.
    if (files.length) addFiles(files, { replace: !state.items.length });
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
    for (const item of state.items) item.values.focal = focalText(item.detected.raw, state.equivalentFocal);
    renderFields();
    scheduleRender();
  });
  $('#resetInfo').addEventListener('click', () => {
    const item = currentItem();
    if (!item) return;
    item.detected = detectFields(item.meta, { equivalentFocal: state.equivalentFocal });
    item.values = Object.fromEntries(FIELDS.map((f) => [f, item.detected.values[f] || '']));
    renderFields();
    scheduleRender();
  });
  $('#framed').addEventListener('change', (e) => { state.framed = e.target.checked; scheduleRender(); });
  $('#showAdjust').addEventListener('change', (e) => { state.showAdjust = e.target.checked; scheduleRender(); });
  $('#keepExif').addEventListener('change', (e) => { state.keepExif = e.target.checked; clearResult(); });
  $('#addAdjust').addEventListener('change', (e) => {
    const item = currentItem();
    const key = e.target.value;
    if (!key || !item) return;
    const custom = key === '__custom';
    item.adjustments.push({ key: custom ? null : key, label: custom ? '' : t(key), value: '', labelEdited: custom });
    state.showAdjust = $('#showAdjust').checked = true;
    renderAdjustments();
    const rows = $('#adjustList').querySelectorAll('.adj');
    rows[rows.length - 1]?.querySelector(custom ? '.adj-name' : '.adj-value')?.focus();
    scheduleRender();
  });

  $('#exportBtn').addEventListener('click', exportAll);
  $('#shareBtn').addEventListener('click', shareResult);
  $('#langBtn').addEventListener('click', () => { setLang(getLang() === 'zh' ? 'en' : 'zh'); applyI18n(); });
}

init();
