// Trang quản lý: danh mục bộ ảnh (bản cập nhật / tier list / build) → xem trước từng ảnh, xem lớn.
// Ảnh PNG do scripts/render.mjs xuất vào thư mục out/ của bộ ảnh (nút "Mở thư mục ảnh") — trang này không có nút tải:
// người dùng yêu cầu bỏ "Tải PNG", "Tải tất cả (.zip)" và "Mở tab mới" (02/10/2026).
import { canvasOf, isSquare } from './lib/output.js';

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Tab lọc ảnh theo loại bộ ảnh
const TYPES = {
  patch: [
    { key: 'all', label: 'Tất cả' },
    { key: 'overview', label: 'Tổng quan' },
    { key: 'champion', label: 'Tướng' },
    { key: 'item', label: 'Trang bị' },
    { key: 'system', label: 'Khác' },
  ],
  tierlist: [
    { key: 'all', label: 'Tất cả' },
    { key: 'tier-overview', label: 'Tổng quan' },
    { key: 'tier-lane', label: 'Theo đường' },
  ],
  build: [
    { key: 'all', label: 'Tất cả' },
    { key: 'build-overview', label: 'Tổng quan' },
    { key: 'build', label: 'Tướng' },
    { key: 'build-cover', label: 'Thumbnail' },
  ],
};
const TYPE_LABEL = { ...Object.fromEntries(Object.values(TYPES).flat().map((t) => [t.key, t.label])), build: 'Build' };
// Danh mục bên trái: mỗi loại bộ ảnh là một mục cha, các bộ ảnh là mục con.
const KIND = {
  patch: { title: 'BẢN CẬP NHẬT', empty: 'Chưa có bản cập nhật nào.' },
  tierlist: { title: 'TIER LIST', empty: 'Chưa có tier list nào.' },
  build: { title: 'BUILD', empty: 'Chưa có build nào.' },
};
const STATUS_LABEL = { buff: 'BUFF', nerf: 'NERF', adjust: 'ĐIỀU CHỈNH', mixed: 'ĐIỀU CHỈNH', rework: 'LÀM LẠI', new: 'MỚI' };

const ICON = {
  expand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
  doc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5"/></svg>',
  folder: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
};

const state = { patches: [], live: false, current: null, filter: 'all', lbIndex: -1 };
try {
  state.filter = localStorage.getItem('gallery.filter') ?? 'all';
} catch { /* trình duyệt chặn storage */ }

const slideUrl = (patchId, slide) => `/slide.html?${new URLSearchParams({ patch: patchId, slide: slide.id })}`;
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

// ---------- sidebar ----------
const ofKind = (kind) => state.patches.filter((p) => (p.kind ?? 'patch') === kind);

function sideItem(p) {
  const tier = p.kind === 'tierlist';
  const build = p.kind === 'build';
  const dots = tier
    ? `<i class="dot is-t0"></i>${p.counts.t0}<i class="dot is-t1"></i>${p.counts.t1}`
    : build
      ? `<span>${p.counts.champions} tướng</span>`
      : `${p.counts.buff ? `<i class="dot is-buff"></i>${p.counts.buff}` : ''}${p.counts.nerf ? `<i class="dot is-nerf"></i>${p.counts.nerf}` : ''}`;
  const badge = `<span class="patch-ver ${tier || build ? 'patch-ver--date' : ''}">${esc(tier || build ? p.date.slice(0, 5) : p.id)}</span>`;
  return `<a class="patch ${p.id === state.current?.id ? 'is-active' : ''}" href="#${encodeURIComponent(p.id)}">
      ${badge}
      <span class="patch-info">
        <b>${esc(p.title ?? `Bản ${p.id}`)}</b>
        <span class="patch-meta">${dots}<span>· ${p.slides.length} ảnh</span></span>
      </span>
    </a>`;
}

function renderSidebar() {
  $('#patchList').innerHTML = Object.entries(KIND)
    .map(([kind, k]) => {
      const list = ofKind(kind);
      return `<section class="side-group">
        <div class="side-title"><span>${k.title}</span><span class="side-count">${list.length}</span></div>
        ${list.map(sideItem).join('') || `<p class="empty-side">${k.empty}</p>`}
      </section>`;
    })
    .join('');
}

// ---------- đầu trang ----------
function headChips(p) {
  const c = p.counts;
  if (p.kind === 'build') {
    return `<span class="chip">${c.champions} TƯỚNG</span>
      <span class="chip">3 BUILD / TƯỚNG</span>
      ${p.patch ? `<span class="chip">BẢN ${esc(p.patch)}</span>` : ''}`;
  }
  if (p.kind === 'tierlist') {
    return `<span class="chip is-t0">${c.t0} TƯỚNG T0</span>
      <span class="chip is-t1">${c.t1} TƯỚNG T1</span>
      ${p.filter ? `<span class="chip">${esc(p.filter.toUpperCase())}</span>` : ''}
      ${p.patch ? `<span class="chip">SAU BẢN ${esc(p.patch)}</span>` : ''}`;
  }
  return `${c.buff ? `<span class="chip is-buff">${c.buff} BUFF</span>` : ''}
    ${c.nerf ? `<span class="chip is-nerf">${c.nerf} NERF</span>` : ''}
    ${c.mixed ? `<span class="chip is-mixed">${c.mixed} ĐIỀU CHỈNH</span>` : ''}
    ${c.items ? `<span class="chip">${c.items} TRANG BỊ</span>` : ''}
    ${c.systems ? `<span class="chip">${c.systems} HỆ THỐNG</span>` : ''}`;
}

function renderHead() {
  const p = state.current;
  const kicker = p.kind === 'tierlist' ? `TIER LIST · ${esc(p.date ?? '')}`
    : p.kind === 'build' ? `BUILD CAO THỦ · ${esc(p.date ?? '')}`
      : `BẢN CẬP NHẬT ${p.date ? `· ${esc(p.date)}` : ''}`;
  $('#head').innerHTML = `
    <div class="head-text">
      <span class="head-kicker">${kicker}</span>
      <h1>${esc(p.title ?? p.id)}</h1>
      ${p.headline ? `<p>${esc(p.headline)}</p>` : ''}
      <div class="chips">${headChips(p)}</div>
    </div>
    <div class="head-actions">
      ${state.live ? `<button class="btn btn-ghost" id="btnFolder" type="button">${ICON.folder}Mở thư mục ảnh</button>` : ''}
      ${p.sourceFile ? `<a class="btn btn-ghost" href="/${esc(p.sourceFile)}" target="_blank" rel="noopener">${ICON.doc}Bản dịch (.md)</a>` : ''}
    </div>`;
  if (!state.live) return;
  $('#btnFolder').onclick = async () => {
    const res = await fetch(`/api/open-folder?${new URLSearchParams({ patch: p.id })}`).catch(() => null);
    if (!res?.ok) toast('Không mở được thư mục.', 'err');
  };
}

// ---------- tab lọc ----------
function renderTabs() {
  const slides = state.current.slides;
  $('#tabs').innerHTML = TYPES[state.current.kind ?? 'patch'].map((t) => {
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

// ---------- lưới ảnh ----------
// Thu ảnh cho vừa ô xem trước (16:9, bộ build: ô vuông); ảnh khác khổ với ô (vd ảnh bìa dọc) thu theo chiều cao và đặt giữa ô.
function fitPreview(preview) {
  const frame = preview.querySelector('iframe');
  const w = parseFloat(frame.style.width), h = parseFloat(frame.style.height);
  const s = Math.min(preview.clientWidth / w, preview.clientHeight / h);
  preview.style.setProperty('--s', s);
  frame.style.left = `${(preview.clientWidth - w * s) / 2}px`;
}
const scaleObserver = new ResizeObserver((entries) => entries.forEach((e) => fitPreview(e.target)));

function renderGrid() {
  const p = state.current;
  const slides = visibleSlides();
  scaleObserver.disconnect();
  $('#grid').classList.toggle('is-square', p.slides.some(isSquare));
  $('#grid').innerHTML = slides
    .map((s) => `<article class="card" data-id="${esc(s.id)}">
      <button class="card-preview" type="button" aria-label="Xem lớn ${esc(s.label)}">
        <iframe src="${slideUrl(p.id, s)}" loading="lazy" tabindex="-1" title="${esc(s.label)}" style="width:${canvasOf(s).width}px;height:${canvasOf(s).height}px"></iframe>
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
      </div>
    </article>`)
    .join('') || '<p class="empty">Không có ảnh nào trong mục này.</p>';

  $('#grid').querySelectorAll('.card').forEach((card) => {
    const slide = p.slides.find((s) => s.id === card.dataset.id);
    fitPreview(card.querySelector('.card-preview'));
    scaleObserver.observe(card.querySelector('.card-preview'));
    card.querySelector('.card-preview').onclick = () => openLightbox(visibleSlides().indexOf(slide));
  });
}

// ---------- xem lớn ----------
function fitLightbox() {
  const stage = $('#lbStage');
  const { width, height } = canvasOf(visibleSlides()[state.lbIndex]);
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
  $('#lbFrame').src = slideUrl(state.current.id, s);
  $('#lbTitle').innerHTML = `<span>${String(s.index + 1).padStart(2, '0')} / ${String(state.current.slides.length).padStart(2, '0')}</span><b>${esc(s.label)}</b>`;
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

// Chạy local: lấy từ server (có nút mở thư mục ảnh). Bản web tĩnh (npm run build): đọc patches/index.json, chỉ xem.
async function load() {
  const live = await fetchJSON('/api/patches');
  const patches = live ?? (await fetchJSON('/patches/index.json'));
  $('#offline').hidden = !!patches;
  if (!patches) return;
  state.patches = patches;
  state.live = !!live;
  selectFromHash();
}

function selectFromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  state.current = state.patches.find((p) => p.id === id) ?? state.patches[0] ?? null;
  renderSidebar();
  if (!state.current) {
    $('#head').innerHTML = '<div class="head-text"><h1>Chưa có bộ ảnh nào</h1></div>';
    $('#tabs').innerHTML = '';
    $('#grid').innerHTML = '';
    return;
  }
  if (!state.current.slides.some((s) => state.filter === 'all' || s.type === state.filter)) state.filter = 'all';
  document.title = `${state.current.id} · Meta Studio`;
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
