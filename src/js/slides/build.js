// Ảnh BUILD — khổ VUÔNG 1:1, khung 1080×1080 (SQUARE_CANVAS trong lib/output.js), xuất 2160×2160.
// Người dùng chốt 02/10/2026 sau khi xem 7 mẫu, và bỏ hẳn bản 16:9 (ảnh build chỉ đăng TikTok / Facebook):
//   Ảnh tướng     — dải ảnh tướng phía trên · 3 nhóm đối đầu nằm ngang (mạnh / yếu / hợp, mỗi nhóm 3 avatar) ·
//                   3 build xếp hàng (6 trang bị theo thứ tự + ngọc chính + 4 ngọc). Mỗi tướng trong bộ build = 1 ảnh.
//   Ảnh tổng quan — lưới 3×2 thẻ đứng: ảnh tướng lớn, CỐT LÕI và MẠNH KHI GẶP (không hiện ngọc · giày — người dùng bỏ
//                   để ảnh tướng hiện nhiều hơn).
//   Ảnh bìa       — thumbnail TikTok, khổ dọc 3:4.
// Dữ liệu: builds/<id>/build.json (1 ngày + 1 vai trò, "champions": [...]) · ngọc: data/runes.json · trang bị: data/items/<slug>.json
// ("summary" trong data/items là tooltip trang bị người dùng gửi — để dành, chưa có mẫu ảnh.)
import { esc, topBar, footBar, background, ICON, STATUS, statusKey } from '../lib/ui.js';
import { LANES } from './tier.js';
import { ROLES, titleCase, OVERVIEW_SIZE } from '../lib/roles.js';

const BUILD_CLASS = ['is-b1', 'is-b2', 'is-b3'];
const num = (n) => Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
const runeName = (r) => r?.vi ?? r?.en ?? r?.cn ?? '?';
const itemName = (it) => it?.nameVi || it?.name || '?';
const tag = (ctx) => ({ small: 'BẢN', value: ctx.build.patch ?? ctx.build.date });
const source = (set) => `Nguồn: ${set.source} · ${set.date}`;
const laneOf = (ctx, e) => e.lane ?? ROLES[ctx.build.role]?.lane;

// Tướng của ảnh này trong bộ build
function entryOf(ctx, slide) {
  const e = ctx.build.champions?.find((c) => c.champion === slide.champion);
  if (!e) throw new Error(`Bộ build không có tướng "${slide.champion}"`);
  return { e, champ: ctx.champions[e.champion] };
}

// Giày luôn đứng cuối hàng (vị trí 6), dù ảnh chụp ghi ở vị trí nào — người dùng chốt quy ước này.
const isBoots = (it) => !!it && (it.tags?.includes('Giày') || /greaves|boots|treads|steelcaps|shoes/i.test(it.name ?? '') || /靴|胫甲|鞋/.test(it.cnName ?? ''));
const orderItems = (slugs, items) => [...slugs.filter((s) => !isBoots(items[s])), ...slugs.filter((s) => isBoots(items[s]))];

// Splash cắt quanh khuôn mặt cho khung w×h (giống thẻ tier list), mặt đặt tại (ax, ay) của khung.
function art(champ, w, h, { zoom = 1, ax = 0.5, ay = 0.3, face = champ.layout?.face ?? { x: champ.layout?.focusX ?? 0.5, y: 0.25 } } = {}) {
  const { width: sw = 1280, height: sh = 720 } = champ.splashDims ?? {};
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
// Cắt sát khuôn mặt mà khó nhận ra tướng (vd Nunu & Willump: phải thấy cả cậu bé lẫn người tuyết) → khung riêng
// layout.avatar { x, y, zoom }: tâm khung + độ phóng so với mặc định (< 1 = lấy rộng hơn). Ghi bằng splash-grid.mjs --avatar=x,y,zoom.
const AVATAR_ZOOM = 2.6;
function avatar(champ, w, h, cls) {
  if (!champ.layout?.face) return `<img class="${cls}" src="/${esc(champ.portrait)}" alt="${esc(champ.name)}">`;
  const a = champ.layout.avatar;
  const crop = a ? { zoom: AVATAR_ZOOM * (a.zoom ?? 1), ay: 0.5, face: a } : { zoom: AVATAR_ZOOM, ay: 0.42 };
  return `<span class="${cls} is-crop" role="img" aria-label="${esc(champ.name)}" style="${art(champ, w, h, crop)}"></span>`;
}

// Bậc + tỉ lệ thắng của tướng ở đường này trong tier list gắn kèm (nếu có).
// Người dùng báo số mới hơn tier list → ghi "tier": { "win": 55.13 } (và/hoặc "tier": "T0") trong mục của tướng, đè lên số cũ.
// Người dùng không muốn một nhãn nào đó cho tướng → "hide": ["tier", "patch"] trong mục của tướng.
const hidden = (e, chip) => e.hide?.includes(chip);
function tierInfo(ctx, e) {
  if (hidden(e, 'tier')) return null;
  const lane = ctx.tierlist?.lanes.find((l) => l.lane === laneOf(ctx, e));
  const info = { ...lane?.champions.find((c) => c.slug === e.champion), ...e.tier };
  return info.tier && info.win != null ? info : null;
}
// Tướng có thay đổi ở bản cập nhật gắn kèm → nhãn "▲ BUFF 7.3a" / "▼ NERF 7.3a" (như thẻ tier list).
const patchStatus = (ctx, e) => (hidden(e, 'patch') ? null : ctx.patch?.champions?.find((c) => c.slug === e.champion)?.status ?? null);

// ---------------- ảnh tướng ----------------
// Nhãn trên tên tướng: đường · bậc + % thắng · BUFF / NERF <bản>
function chips(ctx, e) {
  const lane = LANES[laneOf(ctx, e)];
  const tier = tierInfo(ctx, e);
  const st = patchStatus(ctx, e);
  const k = st ? statusKey(st) : null;
  return `<div class="bd-chips">
    ${lane ? `<span class="bd-chip"><i>${lane.icon}</i>${esc(lane.name)}</span>` : ''}
    ${tier ? `<span class="bd-chip is-${tier.tier.toLowerCase()}"><b>${esc(tier.tier)}</b>${num(tier.win)}%</span>` : ''}
    ${k ? `<span class="bd-chip bd-chip--patch is-${k}"><i>${STATUS[k].icon}</i>${STATUS[k].label} <em>${esc(ctx.patch.id)}</em></span>` : ''}
  </div>`;
}

// Đối đầu: mạnh / yếu khi gặp, hợp với… — mỗi nhóm tiêu đề + 3 avatar, không ghi tên.
const MATCHUP_ROWS = [
  { key: 'strong', cls: 'is-buff', icon: ICON.up, label: 'MẠNH', sub: 'KHI GẶP' },
  { key: 'weak', cls: 'is-nerf', icon: ICON.down, label: 'YẾU', sub: 'KHI GẶP' },
  { key: 'synergy', cls: 'is-ally', icon: ICON.shield, label: 'HỢP', sub: null },
];
// "Hợp với …": vai trò hay đi cùng nhất theo đường (ghi đè bằng matchups.synergyLabel)
const SYNERGY_SUB = { dragon: 'VỚI HỖ TRỢ', support: 'VỚI XẠ THỦ', jungle: 'VỚI ĐƯỜNG GIỮA', mid: 'VỚI ĐI RỪNG', baron: 'VỚI ĐI RỪNG' };
const AVATAR = 88;
function muGroup(ctx, e, r) {
  const m = e.matchups ?? {};
  if (!m[r.key]?.length) return '';
  const sub = r.sub ?? m.synergyLabel ?? SYNERGY_SUB[laneOf(ctx, e)] ?? 'VỚI ĐỒNG ĐỘI';
  return `<div class="sq-mug ${r.cls}">
    <div class="sq-mug-h"><i>${r.icon}</i><b>${r.label}</b><small>${esc(sub)}</small></div>
    <div class="sq-mug-a">${m[r.key].map((slug) => avatar(ctx.champions[slug], AVATAR, AVATAR, 'sq-av')).join('')}</div>
  </div>`;
}

function buildCard(ctx, b, i) {
  const keystone = ctx.runes[b.runes[0]];
  return `<article class="bd-card ${BUILD_CLASS[i]}">
    <div class="bd-rank"><small>BUILD</small><b>${i + 1}</b></div>
    <div class="bd-body">
      <header class="bd-head">
        <h3 class="bd-title" data-fit data-fit-group="title">${esc(b.title)}</h3>
        <div class="bd-fit">
          <p><i>${ICON.up}</i><em>HỢP</em><span data-fit data-fit-group="fit">${esc(b.team)}</span></p>
          <p><i>${ICON.bolt}</i><em>KHẮC CHẾ</em><span data-fit data-fit-group="fit">${esc(b.enemy)}</span></p>
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
          ${b.runes.slice(1).map((id) => `<img class="bd-rune" src="/${esc(ctx.runes[id].icon)}" alt="${esc(runeName(ctx.runes[id]))}">`).join('')}
        </div>
      </div>
    </div>
  </article>`;
}

// Dải ảnh tướng phía trên: mặt tướng đặt lệch phải (71% bề ngang) để nhãn + tên nằm bên trái.
// - Splash 16:9 phủ vừa khít bề ngang nên mặt không dịch sang phải được: mặt nằm hẳn bên trái splash (vd Morgana 0,26 —
//   bên phải là Kayle) thì LẬT NGANG ảnh để mặt sang phải, không bị tên che.
// - Mặt nằm gần giữa (vd Galio, Senna) thì giới hạn bề ngang TÊN cho vừa khoảng trống bên trái mặt (tên dài tự co chữ);
//   hàng nhãn không bị giới hạn theo (3 nhãn mà xuống dòng sẽ đẩy lên chạm thanh trên).
// Trả về { html, nameW }.
const SQ = 1080;
const BANNER = { h: 330, zoom: 1.62, ax: 0.71, ay: 0.5 };
function banner(champ) {
  const { width: sw = 1280, height: sh = 720 } = champ.splashDims ?? {};
  const face = champ.layout?.face ?? { x: champ.layout?.focusX ?? 0.5, y: 0.25 };
  const flip = face.x < 0.4;
  const W = Math.max(SQ, (BANNER.h * BANNER.zoom * sw) / sh);
  const fx = (flip ? 1 - face.x : face.x) * W;
  const faceX = fx + Math.min(0, Math.max(SQ - W, SQ * BANNER.ax - fx)); // vị trí mặt trên ảnh (px, sau khi lật nếu có)
  const style = art(champ, SQ, BANNER.h, { zoom: BANNER.zoom, ax: flip ? 1 - BANNER.ax : BANNER.ax, ay: BANNER.ay });
  return {
    html: `<div class="sq-banner" style="height:${BANNER.h}px"><div class="sq-banner-art ${flip ? 'is-flip' : ''}" style="${style}"></div></div>`,
    nameW: Math.round(Math.min(640, Math.max(400, faceX - 110))),
  };
}

// Khung dọc: thanh trên 26–90 · dải ảnh 0–330 (nhãn + tên 100–322) · đối đầu 340–486 · 3 build 500–1020 · chân ảnh 1038.
export function renderBuild(ctx, slide) {
  const { e, champ } = entryOf(ctx, slide);
  const top = banner(champ);
  return `<div class="slide slide--build slide--sq sq-build">
    ${background(top.html)}
    ${topBar(ctx, 'BUILD CAO THỦ', tag(ctx))}
    <section class="sq-hero" data-sec>
      ${chips(ctx, e)}
      <h1 class="sq-name" data-fit style="max-width:${top.nameW}px">${esc(champ.name)}</h1>
    </section>
    <section class="sq-mu" data-sec>${MATCHUP_ROWS.map((r) => muGroup(ctx, e, r)).join('')}</section>
    <section class="sq-builds" data-sec>${e.builds.map((b, i) => buildCard(ctx, b, i)).join('')}</section>
    ${footBar(ctx, source(ctx.build))}
  </div>`;
}

// ---------------- ảnh tổng quan của bộ build ----------------
// Thẻ 323×383: ảnh tướng 220 (nhãn bậc / BUFF-NERF ở trên, tên ở dưới) · CỐT LÕI · MẠNH KHI GẶP.
const OV = { cardW: 323, artH: 220, avW: 66, avH: 56 };
// Nhãn 2 dòng. same = cả 2 dòng cùng một kiểu chữ (CỐT LÕI là một cụm — người dùng yêu cầu không để 2 chữ 2 kiểu).
const label = (a, b, same) => `<small class="sqo-label ${same ? 'is-same' : ''}"><b>${a}</b><span>${b}</span></small>`;

// Món cốt lõi: đếm số build có món đó (không tính giày), nhiều trước; hoà thì món lên sớm hơn trước.
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

function overviewCard(ctx, e) {
  const champ = ctx.champions[e.champion];
  const tier = tierInfo(ctx, e);
  const st = patchStatus(ctx, e);
  const k = st ? statusKey(st) : null;
  const name = ctx.build.slides.find((s) => s.champion === e.champion)?.title ?? titleCase(champ.name);
  return `<article class="sqo-card">
    <div class="sqo-art" style="${art(champ, OV.cardW, OV.artH, { zoom: 2.35, ay: 0.4 })}">
      <div class="bo-tags">
        ${tier ? `<span class="bo-tag is-${tier.tier.toLowerCase()}"><b>${esc(tier.tier)}</b>${num(tier.win)}%</span>` : '<span></span>'}
        ${k ? `<span class="bo-tag is-${k}">${STATUS[k].icon}${STATUS[k].label}</span>` : ''}
      </div>
      <h3 class="sqo-name" data-fit>${esc(name)}</h3>
    </div>
    <div class="sqo-body">
      <div class="sqo-line">${label('CỐT', 'LÕI', true)}<div class="sqo-core">${coreItems(ctx, e).map((c) => `<img src="/${esc(ctx.items[c.slug].icon)}" alt="${esc(itemName(ctx.items[c.slug]))}">`).join('')}</div></div>
      ${e.matchups?.strong?.length ? `<div class="sqo-line is-buff">${label('MẠNH', 'KHI GẶP')}<div class="sqo-mu">${e.matchups.strong.map((s) => avatar(ctx.champions[s], OV.avW, OV.avH, 'sqo-av')).join('')}</div></div>` : ''}
    </div>
  </article>`;
}

// Khung dọc: thanh trên 26–90 · tiêu đề 104–224 · lưới thẻ 240–1022 · chân ảnh 1038.
export function renderBuildOverview(ctx, slide) {
  const set = ctx.build;
  // Bộ nhiều hơn 6 tướng có nhiều ảnh tổng quan: ảnh thứ k lấy 6 tướng thứ k (theo thứ tự "champions").
  const pages = set.slides.filter((s) => s.type === 'build-overview');
  const page = Math.max(pages.findIndex((s) => s.id === slide?.id), 0);
  const all = set.champions;
  const entries = pages.length > 1 ? all.slice(page * OVERVIEW_SIZE, (page + 1) * OVERVIEW_SIZE) : all;
  const role = ROLES[set.role];
  const lane = LANES[role?.lane];
  const nBuilds = all.reduce((a, e) => a + e.builds.length, 0);
  return `<div class="slide slide--build slide--sq sq-ov">
    ${background()}
    ${topBar(ctx, 'BUILD CAO THỦ', tag(ctx))}
    <section class="sqo-head" data-sec>
      <div class="sqo-title">${lane ? `<i>${lane.icon}</i>` : ''}<h1>BUILD ${esc(role?.name ?? '')}</h1>
        <div class="ov-counts">
          <span class="ov-count is-neutral"><b>${all.length}</b> TƯỚNG</span>
          <span class="ov-count is-neutral"><b>${nBuilds}</b> BUILD</span>
          <span class="ov-count is-neutral">${esc(set.date)}</span>
          ${pages.length > 1 ? `<span class="ov-count bo-page">PHẦN <b>${page + 1}</b>/${pages.length}</span>` : ''}
        </div>
      </div>
      ${set.headline ? `<p class="sqo-headline">${set.headline.split('·').map((s) => `<span>${esc(s.trim())}</span>`).join('<i></i>')}</p>` : ''}
    </section>
    <section class="sqo-list" data-sec>${entries.map((e) => overviewCard(ctx, e)).join('')}</section>
    ${footBar(ctx, source(set))}
  </div>`;
}

// ---------------- ảnh bìa (thumbnail TikTok) của bộ build ----------------
// Khổ DỌC 3:4 — khung 1080×1440 (COVER_CANVAS trong lib/output.js), xuất 2160×2880: đúng tỉ lệ ô ảnh trên lưới
// trang cá nhân TikTok nên không bị cắt. Nửa đầu bộ ở khối ảnh trên, nửa sau ở khối dưới (khối nhiều hơn 3 tướng
// thì chia 2 hàng), giữa là dải tiêu đề. TikTok đè biểu tượng lên góc trên phải và số lượt xem lên góc dưới trái
// của ô ảnh → hai góc đó chỉ có ảnh tướng, không có chữ.
// Dòng chữ chạy dưới tiêu đề: "headline" của ảnh bìa trong "slides" (không ghi thì lấy "headline" của bộ).
const BC = { width: 1080, blockH: 416, rowGap: 6, perRow: 3 };

function coverBlock(ctx, entries, cls) {
  const cut = Math.ceil(entries.length / 2);
  const rows = entries.length > BC.perRow ? [entries.slice(0, cut), entries.slice(cut)] : [entries];
  const h = (BC.blockH - BC.rowGap * (rows.length - 1)) / rows.length;
  const slant = Math.round(h * 0.18);
  const zoom = Math.max(1.3, 610 / h); // mặt tướng to gần bằng nhau dù khối có 1 hay 2 hàng
  const row = (list) => {
    const step = BC.width / Math.max(list.length, 1);
    const w = step + slant;
    return `<div class="bc-row">${list.map((e, i) => `<div class="bc-panel" style="left:${(i * step - slant / 2).toFixed(1)}px;width:${w.toFixed(1)}px">
        <div class="bc-art" style="${art(ctx.champions[e.champion], w, h, { zoom, ay: 0.45 })}"></div>
      </div>`).join('')}</div>`;
  };
  return `<div class="bc-block ${cls}" style="--s:${slant}px">${rows.map(row).join('')}</div>`;
}

export function renderBuildCover(ctx, slide) {
  const set = ctx.build;
  const role = ROLES[set.role];
  const lane = LANES[role?.lane];
  const all = set.champions;
  const half = Math.ceil(all.length / 2);
  const nBuilds = all.reduce((a, e) => a + e.builds.length, 0);
  const ticker = (slide.headline ?? set.headline ?? '').split('·').map((s) => s.trim()).filter(Boolean);
  return `<div class="slide slide--build slide--build-cover">
    ${background()}
    ${coverBlock(ctx, all.slice(0, half), 'bc-block--top')}
    <section class="bc-band">
      ${topBar(ctx, set.date, tag(ctx))}
      <div class="bc-main">
        <h1>BUILD ${esc(role?.name ?? '')}</h1>
        <div class="bc-info">
          ${lane ? `<i>${lane.icon}</i>` : ''}
          <span class="bc-badge"><b>${all.length}</b>TƯỚNG</span>
          <p class="bc-sub"><b>${nBuilds} BUILD</b><span>${esc(slide.tagline ?? 'CAO THỦ TRUNG QUỐC')}</span></p>
        </div>
      </div>
      ${ticker.length ? `<p class="bc-ticker">${ticker.map((s) => `<span>${esc(s)}</span>`).join('<i></i>')}</p>` : ''}
    </section>
    ${coverBlock(ctx, all.slice(half), 'bc-block--bottom')}
  </div>`;
}
