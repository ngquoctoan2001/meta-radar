// Trang quản lý: danh mục bản cập nhật → chọn khổ ảnh → xem trước → tải PNG / ZIP.
import { FORMATS, DEFAULT_FORMAT, isFormat, outputSize, fileName } from './lib/formats.js';

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const TYPES = [
  { key: 'all', label: 'Tất cả' },
  { key: 'overview', label: 'Tổng quan' },
  { key: 'champion', label: 'Tướng' },
  { key: 'item', label: 'Trang bị' },
  { key: 'system', label: 'Khác' },
];
const TYPE_LABEL = Object.fromEntries(TYPES.map((t) => [t.key, t.label]));
const STATUS_LABEL = { buff: 'BUFF', nerf: 'NERF', adjust: 'ĐIỀU CHỈNH', mixed: 'ĐIỀU CHỈNH', rework: 'LÀM LẠI', new: 'MỚI' };

const ICON = {
  download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-5-5m5 5 5-5M5 21h14"/></svg>',
  zip: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7V5a2 2 0 0 1 2-2h8l6 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2M10 3v2m0 2v2m0 2v2m-2 2h4v3H8z"/></svg>',
  expand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
  external: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  doc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5"/></svg>',
  folder: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
};

const state = { patches: [], live: false, current: null, filter: 'all', format: DEFAULT_FORMAT, lbIndex: -1 };
try {
  state.filter = localStorage.getItem('gallery.filter') ?? 'all';
  const f = localStorage.getItem('gallery.format');
  if (isFormat(f)) state.format = f;
} catch { /* trình duyệt chặn storage */ }

const fmt = () => FORMATS[state.format];
const slideUrl = (patchId, slideId) =>
  `/slide.html?${new URLSearchParams({ patch: patchId, slide: slideId, format: state.format })}`;
const apiQuery = (extra) => new URLSearchParams({ patch: state.current.id, format: state.format, ...extra });
const visibleSlides = () => state.current.slides.filter((s) => state.filter === 'all' || s.type === state.filter);

// ---------- thông báo ----------
function toast(msg, type = 'ok', ms = 3800) {
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = msg;
  $('#toasts').append(el);
  setTimeout(() => el.classList.add('is-out'), ms);
  setTimeout(() => el.remove(), ms + 400);
}

// ---------- tải file từ API ----------
async function downloadFrom(url, fallbackName, button) {
  const label = button?.innerHTML;
  if (button) {
    button.disabled = true;
    button.classList.add('is-loading');
    button.innerHTML = '<span class="spinner"></span>Đang xuất…';
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Lỗi ${res.status}`);
    const name = decodeURIComponent(res.headers.get('Content-Disposition')?.match(/filename\*=UTF-8''([^;]+)/)?.[1] ?? fallbackName);
    const warnings = decodeURIComponent(res.headers.get('X-Warnings') ?? '');
    const blob = await res.blob();
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast(`Đã tải <b>${esc(name)}</b><small>Bản sao lưu ở patches/${esc(state.current.id)}/out/${state.format}/</small>`);
    if (warnings) toast(`Cảnh báo khi vẽ ảnh: ${esc(warnings)}`, 'warn', 7000);
  } catch (err) {
    toast(`Không xuất được ảnh: ${esc(err.message)}`, 'err', 7000);
  } finally {
    if (button) {
      button.disabled = false;
      button.classList.remove('is-loading');
      button.innerHTML = label;
    }
  }
}

const downloadSlide = (slide, button) =>
  downloadFrom(`/api/render?${apiQuery({ slide: slide.id, download: 1 })}`, fileName(state.current.id, slide.index, slide.id, state.format), button);

// ---------- sidebar ----------
function renderSidebar() {
  $('#patchCount').textContent = state.patches.length;
  $('#patchList').innerHTML = state.patches
    .map((p) => `<a class="patch ${p.id === state.current?.id ? 'is-active' : ''}" href="#${encodeURIComponent(p.id)}">
      <span class="patch-ver">${esc(p.id)}</span>
      <span class="patch-info">
        <b>${esc(p.title ?? `Bản ${p.id}`)}</b>
        <span class="patch-meta">
          ${p.counts.buff ? `<i class="dot is-buff"></i>${p.counts.buff}` : ''}
          ${p.counts.nerf ? `<i class="dot is-nerf"></i>${p.counts.nerf}` : ''}
          <span>· ${p.slides.length} ảnh</span>
        </span>
      </span>
    </a>`)
    .join('') || '<p class="empty-side">Chưa có bản cập nhật nào.</p>';
}

// ---------- đầu trang ----------
function renderHead() {
  const p = state.current;
  const c = p.counts;
  $('#head').innerHTML = `
    <div class="head-text">
      <span class="head-kicker">BẢN CẬP NHẬT ${p.date ? `· ${esc(p.date)}` : ''}</span>
      <h1>${esc(p.title ?? p.id)}</h1>
      ${p.headline ? `<p>${esc(p.headline)}</p>` : ''}
      <div class="chips">
        ${c.buff ? `<span class="chip is-buff">${c.buff} BUFF</span>` : ''}
        ${c.nerf ? `<span class="chip is-nerf">${c.nerf} NERF</span>` : ''}
        ${c.mixed ? `<span class="chip is-mixed">${c.mixed} ĐIỀU CHỈNH</span>` : ''}
        ${c.items ? `<span class="chip">${c.items} TRANG BỊ</span>` : ''}
        ${c.systems ? `<span class="chip">${c.systems} HỆ THỐNG</span>` : ''}
      </div>
    </div>
    <div class="head-actions">
      ${state.live ? `<button class="btn btn-primary" id="btnZip" type="button">${ICON.zip}Tải tất cả ${fmt().label} (.zip)</button>
      <button class="btn btn-ghost" id="btnFolder" type="button">${ICON.folder}Mở thư mục ảnh</button>` : ''}
      ${p.sourceFile ? `<a class="btn btn-ghost" href="/${esc(p.sourceFile)}" target="_blank" rel="noopener">${ICON.doc}Bản dịch (.md)</a>` : ''}
    </div>`;
  if (!state.live) return;
  $('#btnZip').onclick = (e) => downloadFrom(`/api/render-all?${apiQuery()}`, `toc-chien-${p.id}-${state.format}.zip`, e.currentTarget);
  $('#btnFolder').onclick = async () => {
    const res = await fetch(`/api/open-folder?${apiQuery()}`).catch(() => null);
    if (!res?.ok) toast('Không mở được thư mục.', 'err');
  };
}

// ---------- tab lọc ----------
function renderTabs() {
  const slides = state.current.slides;
  $('#tabs').innerHTML = TYPES.map((t) => {
    const n = t.key === 'all' ? slides.length : slides.filter((s) => s.type === t.key).length;
    return `<button class="tab ${state.filter === t.key ? 'is-active' : ''}" role="tab" aria-selected="${state.filter === t.key}" data-filter="${t.key}" ${n ? '' : 'disabled'}>
      ${t.label}<span>${n}</span>
    </button>`;
  }).join('');
  $('#tabs').querySelectorAll('.tab').forEach((b) => {
    b.onclick = () => {
      state.filter = b.dataset.filter;
      try { localStorage.setItem('gallery.filter', state.filter); } catch { /* bỏ qua */ }
      renderTabs();
      renderGrid();
    };
  });
}

// ---------- chọn khổ ảnh ----------
function renderFormats() {
  $('#formats').innerHTML = Object.entries(FORMATS)
    .map(([key, f]) => {
      const out = outputSize(key);
      return `<button class="fmt ${key === state.format ? 'is-active' : ''}" type="button" data-format="${key}"
        aria-pressed="${key === state.format}" title="${f.hint} · xuất ${out.width}×${out.height}">
        <i class="fmt-shape" style="aspect-ratio:${f.width} / ${f.height}"></i>
        <span><b>${f.label}</b><small>${f.hint}</small></span>
      </button>`;
    })
    .join('');
  $('#formats').querySelectorAll('.fmt').forEach((b) => {
    b.onclick = () => {
      if (b.dataset.format === state.format) return;
      state.format = b.dataset.format;
      try { localStorage.setItem('gallery.format', state.format); } catch { /* bỏ qua */ }
      renderFormats();
      renderHead();
      renderGrid();
    };
  });
}

// ---------- lưới ảnh ----------
const scaleObserver = new ResizeObserver((entries) => {
  for (const e of entries) e.target.style.setProperty('--s', e.contentRect.width / fmt().width);
});

function renderGrid() {
  const p = state.current;
  const slides = visibleSlides();
  const grid = $('#grid');
  grid.dataset.format = state.format;
  grid.style.setProperty('--fw', fmt().width);
  grid.style.setProperty('--fh', fmt().height);
  scaleObserver.disconnect();
  grid.innerHTML = slides
    .map((s) => `<article class="card" data-id="${esc(s.id)}">
      <button class="card-preview" type="button" aria-label="Xem lớn ${esc(s.label)}">
        <iframe src="${slideUrl(p.id, s.id)}" loading="lazy" tabindex="-1" title="${esc(s.label)}"></iframe>
        <span class="card-zoom">${ICON.expand}Xem lớn</span>
      </button>
      <div class="card-body">
        <div class="card-info">
          <span class="card-num">${String(s.index + 1).padStart(2, '0')}</span>
          <div>
            <b>${esc(s.label)}</b>
            <span class="card-tags">
              <span class="tag">${TYPE_LABEL[s.type] ?? s.type}</span>
              ${s.status ? `<span class="tag is-${s.status === 'adjust' ? 'mixed' : s.status}">${STATUS_LABEL[s.status] ?? s.status}</span>` : ''}
            </span>
          </div>
        </div>
        <div class="card-actions">
          <a class="btn btn-icon" href="${slideUrl(p.id, s.id)}" target="_blank" rel="noopener" aria-label="Mở ${esc(s.label)} ở tab mới" title="Mở tab mới">${ICON.external}</a>
          ${state.live ? `<button class="btn btn-primary btn-sm" type="button" data-download>${ICON.download}Tải PNG</button>` : ''}
        </div>
      </div>
    </article>`)
    .join('') || '<p class="empty">Không có ảnh nào trong mục này.</p>';

  $('#grid').querySelectorAll('.card').forEach((card) => {
    const slide = p.slides.find((s) => s.id === card.dataset.id);
    scaleObserver.observe(card.querySelector('.card-preview'));
    card.querySelector('.card-preview').onclick = () => openLightbox(visibleSlides().indexOf(slide));
    const download = card.querySelector('[data-download]');
    if (download) download.onclick = (e) => downloadSlide(slide, e.currentTarget);
  });
}

// ---------- xem lớn ----------
function fitLightbox() {
  const stage = $('#lbStage');
  const { width, height } = fmt();
  const s = Math.min(stage.clientWidth / width, stage.clientHeight / height);
  const frame = $('#lbFrame');
  frame.style.width = `${width}px`;
  frame.style.height = `${height}px`;
  frame.style.transform = `scale(${s})`;
  frame.style.left = `${(stage.clientWidth - width * s) / 2}px`;
  frame.style.top = `${(stage.clientHeight - height * s) / 2}px`;
}

function openLightbox(i) {
  const slides = visibleSlides();
  if (i < 0 || i >= slides.length) return;
  state.lbIndex = i;
  const s = slides[i];
  $('#lbFrame').src = slideUrl(state.current.id, s.id);
  $('#lbTitle').innerHTML = `<span>${String(s.index + 1).padStart(2, '0')} / ${String(state.current.slides.length).padStart(2, '0')}</span><b>${esc(s.label)}</b><em>${fmt().label}</em>`;
  $('#lbPrev').disabled = i === 0;
  $('#lbNext').disabled = i === slides.length - 1;
  $('#lightbox').hidden = false;
  document.body.classList.add('no-scroll');
  fitLightbox();
  $('#lbClose').focus();
}

function closeLightbox() {
  $('#lightbox').hidden = true;
  $('#lbFrame').src = 'about:blank';
  document.body.classList.remove('no-scroll');
  state.lbIndex = -1;
}

$('#lbClose').onclick = closeLightbox;
$('#lbPrev').onclick = () => openLightbox(state.lbIndex - 1);
$('#lbNext').onclick = () => openLightbox(state.lbIndex + 1);
$('#lbDownload').onclick = (e) => downloadSlide(visibleSlides()[state.lbIndex], e.currentTarget);
$('#lightbox').addEventListener('click', (e) => { if (e.target.id === 'lightbox') closeLightbox(); });
window.addEventListener('resize', () => { if (!$('#lightbox').hidden) fitLightbox(); });
document.addEventListener('keydown', (e) => {
  if ($('#lightbox').hidden) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') openLightbox(state.lbIndex - 1);
  if (e.key === 'ArrowRight') openLightbox(state.lbIndex + 1);
});

// ---------- tải dữ liệu ----------
// Host tĩnh (Cloudflare Pages) trả index.html cho đường dẫn lạ nên phải kiểm tra đúng là JSON.
async function fetchJSON(url) {
  const res = await fetch(url, { cache: 'no-store' }).catch(() => null);
  return res?.ok && res.headers.get('Content-Type')?.includes('json') ? res.json() : null;
}

// Chạy local: lấy từ server, xuất được ảnh. Bản web tĩnh (npm run build): đọc patches/index.json, chỉ xem.
async function load() {
  const live = await fetchJSON('/api/patches');
  const patches = live ?? (await fetchJSON('/patches/index.json'));
  $('#offline').hidden = !!patches;
  if (!patches) return;
  state.patches = patches;
  state.live = !!live;
  $('#lbDownload').hidden = !state.live;
  selectFromHash();
}

function selectFromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  state.current = state.patches.find((p) => p.id === id) ?? state.patches[0] ?? null;
  renderSidebar();
  if (!state.current) {
    $('#head').innerHTML = '<div class="head-text"><h1>Chưa có bản cập nhật</h1></div>';
    $('#grid').innerHTML = '';
    return;
  }
  if (!state.current.slides.some((s) => state.filter === 'all' || s.type === state.filter)) state.filter = 'all';
  document.title = `${state.current.id} · Meta Studio`;
  renderFormats();
  renderHead();
  renderTabs();
  renderGrid();
}

window.addEventListener('hashchange', selectFromHash);
$('#btnReload').onclick = async () => {
  await load();
  toast('Đã làm mới dữ liệu và ảnh xem trước.');
};
load();
