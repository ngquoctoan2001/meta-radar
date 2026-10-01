// Ảnh BUILD: bên trái tướng + đối đầu (mạnh / yếu / hỗ trợ hợp, mỗi nhóm 3 avatar), bên phải 3 build
// (6 trang bị theo thứ tự + ngọc chính + 4 ngọc).
// Dữ liệu: builds/<id>/build.json · ngọc: data/runes.json · trang bị: data/items/<slug>.json
// renderBuildItems (giải thích trang bị, đọc "summary" trong data/items) để dành — hiện không đưa vào bộ ảnh.
import { esc, topBar, footBar, background, ICON } from '../lib/ui.js';
import { LANES } from './tier.js';

const BUILD_CLASS = ['is-b1', 'is-b2', 'is-b3'];
const num = (n) => Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
const runeName = (r) => r?.vi ?? r?.en ?? r?.cn ?? '?';
const itemName = (it) => it?.nameVi || it?.name || '?';
const tag = (ctx) => ({ small: 'BẢN', value: ctx.build.patch ?? ctx.build.date });
const sourceNote = (b) => `Nguồn: ${b.source} · ${b.date}`;

// Giày luôn đứng cuối hàng (vị trí 6), dù ảnh chụp ghi ở vị trí nào — người dùng chốt quy ước này.
export const isBoots = (it) => !!it && (it.tags?.includes('Giày') || /greaves|boots|treads|shoes/i.test(it.name ?? ''));
export const orderItems = (slugs, items) => [...slugs.filter((s) => !isBoots(items[s])), ...slugs.filter((s) => isBoots(items[s]))];

// Splash cắt quanh khuôn mặt cho khung w×h (giống thẻ tier list), mặt đặt tại (ax, ay) của khung.
function art(champ, w, h, { zoom = 1, ax = 0.5, ay = 0.3 } = {}) {
  const { width: sw = 1280, height: sh = 720 } = champ.splashDims ?? {};
  const face = champ.layout?.face ?? { x: champ.layout?.focusX ?? 0.5, y: 0.25 };
  let H = h * zoom;
  let W = (H * sw) / sh;
  if (W < w) [W, H] = [w, (w * sh) / sw];
  const clamp = (v, min) => Math.min(0, Math.max(min, v));
  const x = clamp(w * ax - face.x * W, w - W);
  const y = clamp(h * ay - face.y * H, h - H);
  return `background-image:url('/${champ.splash}');background-size:${W.toFixed(0)}px ${H.toFixed(0)}px;background-position:${x.toFixed(0)}px ${y.toFixed(0)}px`;
}

// Bậc + tỉ lệ thắng của tướng ở đường này trong tier list gắn kèm (nếu có).
function tierInfo(ctx) {
  const lane = ctx.tierlist?.lanes.find((l) => l.lane === ctx.build.lane);
  return lane?.champions.find((c) => c.slug === ctx.build.champion) ?? null;
}

// ---------------- ảnh 1: 3 build ----------------
const MATCHUP_ROWS = [
  { key: 'strong', cls: 'is-buff', icon: ICON.up, label: 'MẠNH', sub: 'KHI GẶP' },
  { key: 'weak', cls: 'is-nerf', icon: ICON.down, label: 'YẾU', sub: 'KHI GẶP' },
  { key: 'synergy', cls: 'is-ally', icon: ICON.shield, label: 'HỢP', sub: 'VỚI HỖ TRỢ' },
];

function matchups(ctx) {
  const m = ctx.build.matchups;
  if (!m) return '';
  const rows = MATCHUP_ROWS.filter((r) => m[r.key]?.length).map((r) => `<div class="mu-row ${r.cls}">
      <div class="mu-label"><i>${r.icon}</i><span><b>${r.label}</b><small>${r.sub}</small></span></div>
      <div class="mu-avatars">${m[r.key].map((slug) => {
        const c = ctx.champions[slug];
        return `<img class="mu-avatar" src="/${esc(c.portrait)}" alt="${esc(c.name)}">`;
      }).join('')}</div>
    </div>`).join('');
  return `<div class="mu">${rows}</div>`;
}

function buildCard(ctx, b, i, base) {
  const keystone = ctx.runes[b.runes[0]];
  const minors = b.runes.slice(1);
  return `<article class="bd-card ${BUILD_CLASS[i]}">
    <div class="bd-rank"><small>BUILD</small><b>${i + 1}</b></div>
    <div class="bd-body">
      <header class="bd-head">
        <h3 class="bd-title" data-fit>${esc(b.title)}</h3>
        <div class="bd-fit">
          <p><i>${ICON.up}</i><em>HỢP</em><span data-fit>${esc(b.team)}</span></p>
          <p><i>${ICON.bolt}</i><em>KHẮC CHẾ</em><span data-fit>${esc(b.enemy)}</span></p>
        </div>
      </header>
      <div class="bd-gear">
        <div class="bd-items">${orderItems(b.items, ctx.items).map((s, k) => `<div class="bd-item">
            <img src="/${esc(ctx.items[s].icon)}" alt="${esc(itemName(ctx.items[s]))}">
            <span class="bd-item-no">${k + 1}</span>
          </div>`).join('')}</div>
        <div class="bd-sep"></div>
        <div class="bd-runes">
          <img class="bd-keystone" src="/${esc(keystone.icon)}" alt="${esc(runeName(keystone))}">
          ${minors.map((id) => `<img class="bd-rune ${base.runes.includes(id) ? '' : 'is-diff'}" src="/${esc(ctx.runes[id].icon)}" alt="${esc(runeName(ctx.runes[id]))}">`).join('')}
        </div>
      </div>
    </div>
  </article>`;
}

export function renderBuild(ctx) {
  const { build, champion } = ctx;
  const lane = LANES[build.lane];
  const tier = tierInfo(ctx);
  const base = build.builds[0];

  return `<div class="slide slide--build">
    ${background(`<div class="bd-splash" style="${art(champion, 1000, 1080, { zoom: 1.05, ax: 0.36, ay: 0.26 })}"></div><div class="bd-shade"></div><div class="watermark bd-watermark">BUILD</div>`)}
    ${topBar(ctx, 'BUILD CAO THỦ', tag(ctx))}
    <section class="bd-hero">
      <div class="bd-chips">
        ${lane ? `<span class="bd-chip"><i>${lane.icon}</i>${esc(lane.name)}</span>` : ''}
        ${tier ? `<span class="bd-chip is-${tier.tier.toLowerCase()}"><b>${esc(tier.tier)}</b>${num(tier.win)}% thắng</span>` : ''}
      </div>
      <h1 class="bd-name" data-fit>${esc(champion.name)}</h1>
      ${matchups(ctx)}
    </section>
    <section class="bd-cards">${build.builds.map((b, i) => buildCard(ctx, b, i, base)).join('')}</section>
    ${footBar(ctx, sourceNote(build))}
  </div>`;
}

// ---------------- (để dành) giải thích trang bị ----------------
// Đọc "summary" { flag, stats, text } trong data/items/<slug>.json của các món có trong build.
export function renderBuildItems(ctx) {
  const { build, champion } = ctx;
  const slugs = [...new Set(build.builds.flatMap((b) => b.items))].filter((s) => ctx.items[s]?.summary).slice(0, 9);
  const usedBy = (slug) => build.builds.map((b, i) => (b.items.includes(slug) ? i : -1)).filter((i) => i >= 0);
  const nNew = slugs.filter((s) => ctx.items[s].summary.flag === 'new').length;
  const cards = slugs.map((s) => {
    const it = ctx.items[s];
    const n = it.summary;
    return `<article class="bi-card ${n.flag === 'new' ? 'is-new' : ''}">
      <div class="bi-top">
        <div class="bi-icon"><img src="/${esc(it.icon)}" alt=""></div>
        <div class="bi-titles">
          <h3 data-fit>${esc(itemName(it))}${n.flag === 'new' ? '<span class="bi-new">MỚI</span>' : ''}</h3>
          <div class="bi-used">${usedBy(s).map((i) => `<span class="${BUILD_CLASS[i]}">BUILD ${i + 1}</span>`).join('')}</div>
          <div class="bi-stats">${n.stats.map((x) => `<span>${esc(x)}</span>`).join('')}</div>
        </div>
      </div>
      <p class="bi-text" data-fit-block data-fit-lines="3">${esc(n.text)}</p>
    </article>`;
  }).join('');

  return `<div class="slide slide--build slide--build-items">
    ${background('<div class="watermark bd-watermark">ITEM</div>')}
    ${topBar(ctx, 'TRANG BỊ', tag(ctx))}
    <section class="ov-hero">
      <div class="ov-title"><h1>${esc(champion.name)}</h1></div>
      <div class="ov-headline">
        <p><span>Trang bị trong ${build.builds.length} build</span><i></i><span>Chỉ số bản mới nhất</span></p>
        <div class="ov-counts">
          <span class="ov-count is-neutral"><b>${slugs.length}</b> TRANG BỊ</span>
          ${nNew ? `<span class="ov-count bi-count-new"><b>${nNew}</b> MÓN MỚI</span>` : ''}
        </div>
      </div>
    </section>
    <section class="bi-grid">${cards}</section>
    ${footBar(ctx, sourceNote(build))}
  </div>`;
}
