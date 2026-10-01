// Ảnh TIER LIST: 1 ảnh tổng quan (top 3 mỗi đường) + 1 ảnh mỗi đường (đủ tướng T0 và T1).
// Dữ liệu: tierlists/<id>/tierlist.json. Tướng có thay đổi ở bản cập nhật `patch` được gắn nhãn BUFF/NERF;
// có tier list trước (`previous`) thì gắn thêm nhãn MỚI / LÊN T0 / XUỐNG T1.
import { esc, topBar, footBar, background, verdictBox, ICON, STATUS, statusKey } from '../lib/ui.js';
import { LANE_ICONS } from '../lib/lane-icons.js';

export const LANES = {
  baron: { name: 'Đường Baron', short: 'BARON', icon: LANE_ICONS.baron },
  jungle: { name: 'Đi Rừng', short: 'RỪNG', icon: LANE_ICONS.jungle },
  mid: { name: 'Đường Giữa', short: 'GIỮA', icon: LANE_ICONS.mid },
  dragon: { name: 'Đường Rồng', short: 'RỒNG', icon: LANE_ICONS.dragon },
  support: { name: 'Hỗ Trợ', short: 'HỖ TRỢ', icon: LANE_ICONS.support },
};
const TIER_CLASS = { T0: 'is-t0', T1: 'is-t1' };

// Số kiểu Việt Nam: 57.58 → "57,58"
const num = (n) => Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
const pct = (n) => `${num(n)}%`;
const HIGH_BAN = 30; // tỉ lệ cấm từ mức này trở lên được tô nổi

// Cắt splash quanh khuôn mặt cho khung w×h: mặt đặt tại (ax, ay) của khung,
// ảnh gốc hiện cao `zoom` lần chiều cao khung (layout.zoom của tướng nhân thêm nếu cần).
function art(champ, w, h, { zoom = 1.7, ax = 0.5, ay = 0.32 } = {}) {
  const { width: sw = 1280, height: sh = 720 } = champ.splashDims ?? {};
  const face = champ.layout?.face ?? { x: champ.layout?.focusX ?? 0.5, y: 0.25 };
  let H = h * zoom * (champ.layout?.zoom ?? 1);
  let W = (H * sw) / sh;
  if (W < w) [W, H] = [w, (w * sh) / sw];
  const clamp = (v, min) => Math.min(0, Math.max(min, v));
  const x = clamp(w * ax - face.x * W, w - W);
  const y = clamp(h * ay - face.y * H, h - H);
  return `background-image:url('/${champ.splash}');background-size:${W.toFixed(0)}px ${H.toFixed(0)}px;background-position:${x.toFixed(0)}px ${y.toFixed(0)}px`;
}

// Trạng thái của tướng trong bản cập nhật gắn với tier list (buff/nerf/…), null nếu không đổi.
const patchStatus = (ctx, slug) => ctx.patch?.champions?.find((c) => c.slug === slug)?.status ?? null;

// So với tier list trước cùng đường: 'new' | 'up' | 'down' | null
function movement(ctx, lane, entry) {
  if (!ctx.previous) return null;
  const before = ctx.previous.lanes.find((l) => l.lane === lane)?.champions.find((c) => c.slug === entry.slug);
  if (!before) return 'new';
  if (before.tier === entry.tier) return null;
  return before.tier > entry.tier ? 'up' : 'down'; // "T1" > "T0" theo chữ
}
const MOVE = {
  new: { cls: 'is-new', label: 'MỚI', icon: ICON.spark },
  up: { cls: 'is-up', label: 'LÊN', icon: ICON.up },
  down: { cls: 'is-down', label: 'XUỐNG', icon: ICON.down },
};

function tags(ctx, lane, entry) {
  const out = [];
  const st = patchStatus(ctx, entry.slug);
  if (st) {
    const k = statusKey(st);
    out.push(`<span class="tt-tag is-${k}">${STATUS[k].icon}${STATUS[k].label} ${esc(ctx.patch.id)}</span>`);
  }
  const mv = movement(ctx, lane, entry);
  if (mv) out.push(`<span class="tt-tag tt-move ${MOVE[mv].cls}">${MOVE[mv].icon}${MOVE[mv].label}${mv === 'new' ? '' : ` ${esc(entry.tier)}`}</span>`);
  return out.length ? `<div class="tt-tags">${out.join('')}</div>` : '';
}

const tierBadge = (tier) => `<span class="tier-badge ${TIER_CLASS[tier] ?? ''}">${esc(tier)}</span>`;

const statBlock = (label, value, cls = '') => `<div class="tt-stat ${cls}"><small>${label}</small><b>${value}</b></div>`;

// Thẻ một tướng (ảnh lớn nền + thông số). size: 'lg' (T0) | 'md' (T1) | 'sm' (tổng quan)
function tile(ctx, lane, entry, rank, { w, h, size, zoom, ay }) {
  const champ = ctx.champions[entry.slug];
  if (!champ) throw new Error(`Thiếu dữ liệu tướng "${entry.slug}"`);
  const ban = entry.ban >= HIGH_BAN ? 'is-hot' : '';
  const stats = size === 'sm'
    ? `<b class="tt-win">${pct(entry.win)}</b>`
    : `<div class="tt-stats">
        ${statBlock('TỈ LỆ THẮNG', pct(entry.win), 'tt-stat--win')}
        ${statBlock('CHỌN', pct(entry.pick))}
        ${statBlock('CẤM', pct(entry.ban), ban)}
      </div>`;
  return `<article class="tt tt--${size} ${TIER_CLASS[entry.tier] ?? ''}" style="width:${w}px;height:${h}px">
    <div class="tt-art" style="${art(champ, w, h, { zoom, ay })}"></div>
    <div class="tt-top">
      <span class="tt-rank">#${rank}</span>
      ${size === 'sm' ? tierBadge(entry.tier) : ''}
    </div>
    ${tags(ctx, lane, entry)}
    <div class="tt-info">
      <h3 class="tt-name" data-fit>${esc(champ.name)}</h3>
      ${stats}
    </div>
  </article>`;
}

const sourceNote = (t) => `Dữ liệu: ${t.source} · ${t.filter} · ${t.date}`;
const tagOf = (t) => (t.patch ? { small: 'SAU BẢN', value: t.patch } : { small: 'NGÀY', value: t.date });

// ---------------- ảnh tổng quan ----------------
// Khung: 5 cột × 3 thẻ, vùng 254–1002 (748px). Cột rộng (1792 − 4×20) / 5.
const OV = { colW: 342, head: 64, gap: 12 };
OV.cardH = Math.floor((748 - OV.head - OV.gap * 3) / 3);

export function renderTierOverview(ctx) {
  const t = ctx.tierlist;
  // số tướng khác nhau ở mỗi bậc (Malphite T1 ở cả Baron lẫn Hỗ trợ chỉ tính 1)
  const count = (tier) => new Set(t.lanes.flatMap((l) => l.champions.filter((c) => c.tier === tier).map((c) => c.slug))).size;
  const cols = t.lanes.map((l) => {
    const meta = LANES[l.lane];
    const cards = l.champions.slice(0, 3)
      .map((e, i) => tile(ctx, l.lane, e, i + 1, { w: OV.colW, h: OV.cardH, size: 'sm', zoom: 1.75, ay: 0.36 }))
      .join('');
    return `<section class="tov-col">
      <header class="lane-head"><i>${meta.icon}</i><span>${esc(meta.name)}</span></header>
      ${cards}
    </section>`;
  }).join('');

  return `<div class="slide slide--tier slide--tier-ov">
    ${background('<div class="watermark tier-watermark">TIER</div>')}
    ${topBar(ctx, 'TIER LIST', tagOf(t))}
    <section class="ov-hero">
      <div class="ov-title"><h1>TIER LIST</h1></div>
      <div class="ov-headline">
        ${t.headline ? `<p>${t.headline.split('·').map((s) => `<span>${esc(s.trim())}</span>`).join('<i></i>')}</p>` : ''}
        <div class="ov-counts">
          <span class="ov-count is-t0"><b>${count('T0')}</b> TƯỚNG T0</span>
          <span class="ov-count is-t1"><b>${count('T1')}</b> TƯỚNG T1</span>
          <span class="ov-count is-neutral">${esc(t.filter.split('·').pop().trim().toUpperCase())}</span>
          ${t.note ? `<span class="ov-count tier-note">${ICON.clock}${esc(t.note)}</span>` : '<span class="ov-count is-neutral">TOP 3 MỖI ĐƯỜNG</span>'}
        </div>
      </div>
    </section>
    <section class="tov-cols">${cols}</section>
    ${footBar(ctx, sourceNote(t))}
  </div>`;
}

// ---------------- ảnh từng đường ----------------
// Khung: 2 hàng (T0, T1) trong vùng 254–1002, mỗi hàng 364px. Cột nhãn 104px + khe 18px → còn 1670px cho thẻ.
// Hàng T0: 1 tướng → thẻ rộng 640px kiểu "lg"; 2–3 tướng → thẻ hẹp kiểu "md" (như T1). Phần còn lại là cột bên
// (3 ô nổi bật + câu chốt); cột bên hẹp quá thì bỏ 3 ô nổi bật, chỉ giữ câu chốt.
const LN = { rowH: 364, area: 1670, gap: 16, sideGap: 18, t0W: { 1: 640, 2: 420, 3: 330 }, minSideForHighlights: 740 };
export const MAX_T0 = 3;

function highlights(lane) {
  const top = (key) => lane.champions.reduce((a, b) => (b[key] > a[key] ? b : a));
  const pick = (key, label, cls = '') => {
    const e = top(key);
    return { label, slug: e.slug, value: pct(e[key]), cls };
  };
  return [pick('win', 'THẮNG CAO NHẤT'), pick('pick', 'CHỌN NHIỀU NHẤT'), pick('ban', 'BỊ CẤM NHIỀU NHẤT', 'is-hot')];
}

function rowLabel(tier, n) {
  return `<div class="ov-row-label ${TIER_CLASS[tier]}">
    <span class="ov-row-ico">${tier === 'T0' ? ICON.spark : ICON.bolt}</span>
    <span class="ov-row-name">${tier}</span>
    <span class="ov-row-count">${n}</span>
  </div>`;
}

export function renderTierLane(ctx, slide) {
  const t = ctx.tierlist;
  const lane = t.lanes.find((l) => l.lane === slide.lane);
  if (!lane) throw new Error(`Tier list không có đường "${slide.lane}"`);
  const meta = LANES[lane.lane];
  const ranked = lane.champions.map((e, i) => ({ e, rank: i + 1 }));
  const t0 = ranked.filter((x) => x.e.tier === 'T0');
  const t1 = ranked.filter((x) => x.e.tier === 'T1');
  if (t0.length > MAX_T0) throw new Error(`Đường ${meta.name} có ${t0.length} tướng T0 — mẫu ảnh chứa tối đa ${MAX_T0}`);

  const t0W = LN.t0W[t0.length] ?? LN.t0W[1];
  const t0Tile = t0.length
    ? t0.map(({ e, rank }) => (t0.length === 1
      ? tile(ctx, lane.lane, e, rank, { w: t0W, h: LN.rowH, size: 'lg', zoom: 1.45, ay: 0.34 })
      : tile(ctx, lane.lane, e, rank, { w: t0W, h: LN.rowH, size: 'md', zoom: 1.7, ay: 0.3 }))).join('')
    : `<div class="tt tt--empty" style="width:${t0W}px;height:${LN.rowH}px">
        <b>KHÔNG CÓ T0</b><span>Chưa tướng nào vượt trội — cả ${t1.length} tướng mạnh nhất ${esc(meta.name)} đều ở T1</span>
      </div>`;
  const t0Area = Math.max(t0.length, 1) * t0W + (Math.max(t0.length, 1) - 1) * LN.gap;
  const showHighlights = LN.area - t0Area - LN.sideGap >= LN.minSideForHighlights;
  const w1 = Math.floor((LN.area - LN.gap * (t1.length - 1)) / Math.max(t1.length, 1));
  const t1Tiles = t1.map(({ e, rank }) => tile(ctx, lane.lane, e, rank, { w: w1, h: LN.rowH, size: 'md', zoom: 1.7, ay: 0.3 })).join('');

  const hl = highlights(lane).map((h) => `<div class="hl ${h.cls}">
      <small>${h.label}</small>
      <b data-fit>${esc(ctx.champions[h.slug].name)}</b>
      <em>${h.value}</em>
    </div>`).join('');

  return `<div class="slide slide--tier slide--tier-lane">
    ${background(`<div class="watermark tier-watermark">${esc(meta.short)}</div>`)}
    ${topBar(ctx, 'TIER LIST', tagOf(t))}
    <section class="ov-hero">
      <div class="ov-title lane-title"><i>${meta.icon}</i><h1>${esc(meta.name)}</h1></div>
      <div class="ov-headline">
        <p><span>${t0.length ? `${t0.length} tướng T0` : 'Không có T0'}</span><i></i><span>${t1.length} tướng T1</span></p>
        <div class="ov-counts">
          <span class="ov-count is-neutral">${esc(t.filter.split('·').pop().trim().toUpperCase())}</span>
          <span class="ov-count is-neutral">${esc(t.date)}</span>
        </div>
      </div>
    </section>
    <section class="tl-rows">
      <div class="tl-row">
        ${rowLabel('T0', t0.length)}
        <div class="tl-t0s">${t0Tile}</div>
        <div class="tl-side ${showHighlights ? (t0.length > 1 ? 'tl-side--narrow' : '') : 'tl-side--verdict'}">
          ${showHighlights ? `<div class="hl-row">${hl}</div>` : ''}
          ${verdictBox(lane.verdict, 'neutral')}
        </div>
      </div>
      <div class="tl-row">
        ${rowLabel('T1', t1.length)}
        <div class="tl-tiles">${t1Tiles}</div>
      </div>
    </section>
    ${footBar(ctx, sourceNote(t))}
  </div>`;
}
