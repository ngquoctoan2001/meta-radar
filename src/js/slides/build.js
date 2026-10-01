// Ảnh BUILD: bên trái tướng + đối đầu (mạnh / yếu / hỗ trợ hợp, mỗi nhóm 3 avatar), bên phải 3 build
// (6 trang bị theo thứ tự + ngọc chính + 4 ngọc). Mỗi tướng trong bộ build = 1 ảnh.
// Dữ liệu: builds/<id>/build.json (1 ngày + 1 vai trò, "champions": [...]) · ngọc: data/runes.json · trang bị: data/items/<slug>.json
// renderBuildItems (giải thích trang bị, đọc "summary" trong data/items) để dành — hiện không đưa vào bộ ảnh.
import { esc, topBar, footBar, background, ICON, STATUS, statusKey } from '../lib/ui.js';
import { LANES } from './tier.js';
import { ROLES, titleCase } from '../lib/roles.js';

const BUILD_CLASS = ['is-b1', 'is-b2', 'is-b3'];
const num = (n) => Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
const runeName = (r) => r?.vi ?? r?.en ?? r?.cn ?? '?';
const itemName = (it) => it?.nameVi || it?.name || '?';
const tag = (ctx) => ({ small: 'BẢN', value: ctx.build.patch ?? ctx.build.date });
const sourceNote = (b, name) => `Nguồn: Build của cao thủ ${name} · ${b.source} · ${b.date}`;
const laneOf = (ctx, e) => e.lane ?? ROLES[ctx.build.role]?.lane;

// Tướng của ảnh này trong bộ build
function entryOf(ctx, slide) {
  const e = ctx.build.champions?.find((c) => c.champion === slide.champion);
  if (!e) throw new Error(`Bộ build không có tướng "${slide.champion}"`);
  const champ = ctx.champions[e.champion];
  return { e, champ, name: slide.title ?? titleCase(champ.name) };
}

// Giày luôn đứng cuối hàng (vị trí 6), dù ảnh chụp ghi ở vị trí nào — người dùng chốt quy ước này.
export const isBoots = (it) => !!it && (it.tags?.includes('Giày') || /greaves|boots|treads|steelcaps|shoes/i.test(it.name ?? '') || /靴|胫甲|鞋/.test(it.cnName ?? ''));
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

// Avatar tướng (mạnh / yếu / hợp): cắt quanh khuôn mặt từ ảnh splash lớn (1280–2436px) cho nét — ảnh chân dung
// trên web chỉ 285×323 nên bị mờ. Tướng chưa đo khuôn mặt (layout.face) thì dùng tạm ảnh chân dung.
function avatar(champ, w, h, cls) {
  if (!champ.layout?.face) return `<img class="${cls}" src="/${esc(champ.portrait)}" alt="${esc(champ.name)}">`;
  return `<span class="${cls} is-crop" role="img" aria-label="${esc(champ.name)}" style="${art(champ, w, h, { zoom: 2.6, ay: 0.42 })}"></span>`;
}

// Bậc + tỉ lệ thắng của tướng ở đường này trong tier list gắn kèm (nếu có).
function tierInfo(ctx, e) {
  const lane = ctx.tierlist?.lanes.find((l) => l.lane === laneOf(ctx, e));
  return lane?.champions.find((c) => c.slug === e.champion) ?? null;
}

// ---------------- ảnh 1: 3 build ----------------
const MATCHUP_ROWS = [
  { key: 'strong', cls: 'is-buff', icon: ICON.up, label: 'MẠNH', sub: 'KHI GẶP' },
  { key: 'weak', cls: 'is-nerf', icon: ICON.down, label: 'YẾU', sub: 'KHI GẶP' },
  { key: 'synergy', cls: 'is-ally', icon: ICON.shield, label: 'HỢP', sub: null },
];
// "Hợp với …": vai trò hay đi cùng nhất theo đường (ghi đè bằng matchups.synergyLabel)
const SYNERGY_SUB = { dragon: 'VỚI HỖ TRỢ', support: 'VỚI XẠ THỦ', jungle: 'VỚI ĐƯỜNG GIỮA', mid: 'VỚI ĐI RỪNG', baron: 'VỚI ĐI RỪNG' };

function matchups(ctx, e) {
  const m = e.matchups;
  if (!m) return '';
  const rows = MATCHUP_ROWS.filter((r) => m[r.key]?.length).map((r) => `<div class="mu-row ${r.cls}">
      <div class="mu-label"><i>${r.icon}</i><span><b>${r.label}</b><small>${esc(r.sub ?? m.synergyLabel ?? SYNERGY_SUB[laneOf(ctx, e)] ?? 'VỚI ĐỒNG ĐỘI')}</small></span></div>
      <div class="mu-avatars">${m[r.key].map((slug) => avatar(ctx.champions[slug], 104, 104, 'mu-avatar')).join('')}</div>
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

// Tướng có thay đổi ở bản cập nhật gắn kèm → nhãn "▲ BUFF 7.3a" / "▼ NERF 7.3a" (như thẻ tier list).
function patchChip(ctx, e) {
  const st = ctx.patch?.champions?.find((c) => c.slug === e.champion)?.status;
  if (!st) return '';
  const k = statusKey(st);
  return `<span class="bd-chip bd-chip--patch is-${k}"><i>${STATUS[k].icon}</i>${STATUS[k].label} <em>${esc(ctx.patch.id)}</em></span>`;
}

export function renderBuild(ctx, slide) {
  const { e, champ: champion, name } = entryOf(ctx, slide);
  const lane = LANES[laneOf(ctx, e)];
  const tier = tierInfo(ctx, e);
  const base = e.builds[0];

  return `<div class="slide slide--build">
    ${background(`<div class="bd-splash" style="${art(champion, 1000, 1080, { zoom: 1.05, ax: 0.36, ay: 0.26 })}"></div><div class="bd-shade"></div><div class="watermark bd-watermark">BUILD</div>`)}
    ${topBar(ctx, 'BUILD CAO THỦ', tag(ctx))}
    <section class="bd-hero">
      <div class="bd-chips">
        ${lane ? `<span class="bd-chip"><i>${lane.icon}</i>${esc(lane.name)}</span>` : ''}
        ${tier ? `<span class="bd-chip is-${tier.tier.toLowerCase()}"><b>${esc(tier.tier)}</b>${num(tier.win)}%</span>` : ''}
        ${patchChip(ctx, e)}
      </div>
      <h1 class="bd-name" data-fit>${esc(champion.name)}</h1>
      ${matchups(ctx, e)}
    </section>
    <section class="bd-cards">${e.builds.map((b, i) => buildCard(ctx, b, i, base)).join('')}</section>
    ${footBar(ctx, sourceNote(ctx.build, name))}
  </div>`;
}

// ---------------- (để dành) giải thích trang bị ----------------
// Đọc "summary" { flag, stats, text } trong data/items/<slug>.json của các món có trong build.
export function renderBuildItems(ctx, slide) {
  const { e, champ: champion, name } = entryOf(ctx, slide);
  const build = e;
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
    ${footBar(ctx, sourceNote(ctx.build, name))}
  </div>`;
}

// ---------------- ảnh tổng quan của bộ build ----------------
// 1 cột / tướng: ảnh tướng + bậc, nhãn BUFF/NERF, 3 món cốt lõi (xuất hiện nhiều nhất trong 3 build, không tính giày),
// ngọc chính, giày, 3 tướng mạnh khi đối đầu. Khung: nội dung 254–1002 (748px), bề ngang 1792px chia đều.
const BO = { area: 1792, gap: 20, artH: 410 };

// Món cốt lõi: đếm số build có món đó, nhiều trước; hoà thì món lên sớm hơn trước.
function coreItems(ctx, e, n = 3) {
  const score = new Map();
  for (const b of e.builds) {
    orderItems(b.items, ctx.items).forEach((s, i) => {
      if (isBoots(ctx.items[s])) return;
      const v = score.get(s) ?? { count: 0, pos: 0 };
      score.set(s, { count: v.count + 1, pos: v.pos + i });
    });
  }
  return [...score]
    .sort((a, b) => b[1].count - a[1].count || a[1].pos / a[1].count - b[1].pos / b[1].count)
    .slice(0, n)
    .map(([slug, v]) => ({ slug, count: v.count }));
}

function overviewCard(ctx, e, w) {
  const champ = ctx.champions[e.champion];
  const tier = tierInfo(ctx, e);
  const st = ctx.patch?.champions?.find((c) => c.slug === e.champion)?.status;
  const k = st ? statusKey(st) : null;
  const keystones = [...new Set(e.builds.map((b) => b.runes[0]))];
  const boots = e.builds.map((b) => b.items.find((s) => isBoots(ctx.items[s]))).find(Boolean);
  const name = ctx.build.slides.find((s) => s.champion === e.champion)?.title ?? titleCase(champ.name);
  const cell = Math.floor((w - 36 - 20) / 3); // 3 ô trong thẻ: trừ lề 18×2 và 2 khe 10px
  return `<article class="bo-card" style="width:${w}px">
    <div class="bo-art" style="${art(champ, w, BO.artH, { zoom: 1.55, ay: 0.32 })}"></div>
    <div class="bo-tags">
      ${tier ? `<span class="bo-tag is-${tier.tier.toLowerCase()}"><b>${esc(tier.tier)}</b>${num(tier.win)}%</span>` : '<span></span>'}
      ${k ? `<span class="bo-tag is-${k}">${STATUS[k].icon}${STATUS[k].label}</span>` : ''}
    </div>
    <h3 class="bo-name" data-fit>${esc(name)}</h3>
    <div class="bo-body">
      <small>CỐT LÕI</small>
      <div class="bo-core">${coreItems(ctx, e).map((c) => `<img src="/${esc(ctx.items[c.slug].icon)}" alt="${esc(itemName(ctx.items[c.slug]))}">`).join('')}</div>
      <small>NGỌC · GIÀY</small>
      <div class="bo-extra">
        ${keystones.map((id) => `<img class="bo-key" src="/${esc(ctx.runes[id].icon)}" alt="${esc(runeName(ctx.runes[id]))}">`).join('')}
        ${boots ? `<img class="bo-boots" src="/${esc(ctx.items[boots].icon)}" alt="${esc(itemName(ctx.items[boots]))}">` : ''}
      </div>
      ${e.matchups?.strong?.length ? `<small>MẠNH KHI ĐỐI ĐẦU VỚI</small>
      <div class="bo-mu">${e.matchups.strong.map((s) => avatar(ctx.champions[s], cell, Math.round(cell / 1.15), 'bo-av')).join('')}</div>` : ''}
    </div>
  </article>`;
}

export function renderBuildOverview(ctx) {
  const set = ctx.build;
  const entries = set.champions;
  const n = Math.max(entries.length, 1);
  const w = Math.min(420, Math.floor((BO.area - BO.gap * (n - 1)) / n));
  const role = ROLES[set.role];
  const lane = LANES[role?.lane];
  const nBuilds = entries.reduce((a, e) => a + e.builds.length, 0);
  return `<div class="slide slide--build slide--build-ov">
    ${background('<div class="watermark bd-watermark">BUILD</div>')}
    ${topBar(ctx, 'BUILD CAO THỦ', tag(ctx))}
    <section class="ov-hero">
      <div class="ov-title lane-title">${lane ? `<i>${lane.icon}</i>` : ''}<h1>BUILD ${esc(role?.name ?? '')}</h1></div>
      <div class="ov-headline">
        ${set.headline ? `<p>${set.headline.split('·').map((s) => `<span>${esc(s.trim())}</span>`).join('<i></i>')}</p>` : ''}
        <div class="ov-counts">
          <span class="ov-count is-neutral"><b>${entries.length}</b> TƯỚNG</span>
          <span class="ov-count is-neutral"><b>${nBuilds}</b> BUILD</span>
          <span class="ov-count is-neutral">${esc(set.date)}</span>
        </div>
      </div>
    </section>
    <section class="bo-cols">${entries.map((e) => overviewCard(ctx, e, w)).join('')}</section>
    ${footBar(ctx, `Nguồn: Build của cao thủ · ${set.source} · ${set.date}`)}
  </div>`;
}
