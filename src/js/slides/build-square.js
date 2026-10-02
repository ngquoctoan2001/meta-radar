// Ảnh BUILD khổ VUÔNG 1:1 — khung 1080×1080 (SQUARE_CANVAS trong lib/output.js), xuất 2160×2160.
// Bố cục dựng riêng cho khung vuông (không phải bản 16:9 thu lại), người dùng chốt 02/10/2026 sau khi xem 7 mẫu:
//   Ảnh tướng     — dải ảnh tướng phía trên · 3 nhóm đối đầu nằm ngang · 3 build xếp hàng (trang bị + ngọc).
//   Ảnh tổng quan — lưới 3×2 thẻ đứng: ảnh tướng lớn, CỐT LÕI và MẠNH KHI GẶP (không hiện ngọc · giày — người dùng bỏ
//                   để ảnh tướng hiện nhiều hơn).
// Xem: slide.html?patch=<bộ>&slide=<ảnh>&format=square
import { esc, topBar, footBar, background, ICON, STATUS, statusKey } from '../lib/ui.js';
import { LANES } from './tier.js';
import { ROLES, titleCase, OVERVIEW_SIZE } from '../lib/roles.js';
import {
  BUILD_CLASS, MATCHUP_ROWS, SYNERGY_SUB, art, avatar, coreItems, entryOf, itemName, laneOf, num, orderItems,
  patchStatus, runeName, tag, tierInfo,
} from './build.js';

const source = (set) => `Nguồn: ${set.source} · ${set.date}`;

// ---------------- ảnh tướng ----------------
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

// Một nhóm đối đầu: tiêu đề (MẠNH khi gặp…) + 3 avatar.
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
export function renderBuildSquare(ctx, slide) {
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

// ---------------- ảnh tổng quan ----------------
// Thẻ 323×383: ảnh tướng 220 (nhãn bậc / BUFF-NERF ở trên, tên ở dưới) · CỐT LÕI · MẠNH KHI GẶP.
const OV = { cardW: 323, artH: 220, avW: 66, avH: 56 };
// Nhãn 2 dòng. same = cả 2 dòng cùng một kiểu chữ (CỐT LÕI là một cụm — người dùng yêu cầu không để 2 chữ 2 kiểu).
const label = (a, b, same) => `<small class="sqo-label ${same ? 'is-same' : ''}"><b>${a}</b><span>${b}</span></small>`;

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
export function renderBuildOverviewSquare(ctx, slide) {
  const set = ctx.build;
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
