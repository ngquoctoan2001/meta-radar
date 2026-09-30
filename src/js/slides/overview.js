import { esc, topBar, footBar, background, ICON, STATUS, statusKey, findSkill } from '../lib/ui.js';
import { analyzeLine } from '../lib/values.js';

const ORDER = ['buff', 'nerf', 'mixed', 'rework', 'new', 'neutral'];

// Khổ dọc / vuông: vùng dành cho các hàng tướng (khớp với slide-9x16.css, slide-1x1.css).
// width = khung − 2 lề − cột nhãn − khe; height = chiều cao vùng .ov-rows
const GRID = {
  '9x16': { width: 846, height: 1060, maxPerRow: 4 },
  '1x1': { width: 1206, height: 774, maxPerRow: 6 },
};
const CARD_GAP = 14;
const GROUP_GAP = 20;

// Chọn số thẻ mỗi hàng sao cho thẻ gần vuông nhất (ảnh chân dung cắt đẹp, tên không bị ép).
function gridLayout(format, groups) {
  const g = GRID[format];
  const most = Math.max(...groups.map((x) => x.list.length));
  let best;
  for (let per = 1; per <= Math.min(g.maxPerRow, most); per++) {
    const rows = groups.reduce((n, x) => n + Math.ceil(x.list.length / per), 0);
    const w = Math.floor((g.width - (per - 1) * CARD_GAP) / per);
    const h = Math.floor((g.height - (rows - groups.length) * CARD_GAP - (groups.length - 1) * GROUP_GAP) / rows);
    const score = Math.abs(Math.log(w / h)) + (w > 340 ? 1 : 0);
    if (!best || score < best.score) best = { per, w: Math.min(w, 340), h: Math.min(h, Math.round(w * 1.2)), score };
  }
  return best;
}

function miniSkills(entry, champ) {
  return entry.changes
    .map((g) => {
      if (g.key === 'stats') return `<span class="mini mini--stats">${ICON.stats}</span>`;
      const skill = findSkill(champ, g.key);
      const label = g.badge ?? (g.key === 'p' ? 'P' : g.key.toUpperCase());
      return `<span class="mini"><img src="/${esc(skill?.icon)}" alt=""><b>${esc(label)}</b></span>`;
    })
    .join('');
}

function champCard(entry, champ) {
  const k = statusKey(entry.status);
  return `<article class="ov-card is-${k}">
    <img class="ov-portrait" src="/${esc(champ.portrait)}" alt="${esc(champ.name)}">
    <span class="ov-card-ico">${STATUS[k].icon}</span>
    <div class="ov-card-info">
      <div class="ov-minis">${miniSkills(entry, champ)}</div>
    </div>
  </article>`;
}

function itemTile(entry, item) {
  const k = statusKey(entry.status);
  return `<div class="ov-tile is-${k}">
    <div class="ov-tile-icon"><img src="/${esc(item.icon)}" alt=""></div>
    <div class="ov-tile-text">
      <b data-fit>${esc(item.name)}</b>
      <small data-fit>${esc(item.nameVi ?? '')}</small>
    </div>
    <em class="ov-tile-status">${STATUS[k].icon}${STATUS[k].label}</em>
  </div>`;
}

function systemTile(sys) {
  const k = statusKey(sys.status);
  const line = sys.lines?.[0];
  const icon = sys.icon ? `<img src="/${esc(sys.icon)}" alt="">` : `<i>${ICON[sys.iconSvg] ?? ICON.shield}</i>`;
  const r = line ? analyzeLine(line) : null;
  return `<div class="ov-tile ov-tile--sys is-${k}">
    <div class="ov-tile-icon">${icon}</div>
    <div class="ov-tile-text">
      <b data-fit>${esc(sys.name)}</b>
      ${line ? `<em class="ov-sys-val" data-fit>${esc(line.old)} ${ICON.arrow} <strong class="is-${r.effect}">${esc(line.new)}</strong></em>` : ''}
    </div>
  </div>`;
}

export function renderOverview(ctx) {
  const { patch, champions, items } = ctx;
  const groups = ORDER.map((st) => ({
    st,
    list: patch.champions.filter((c) => statusKey(c.status) === st),
  })).filter((g) => g.list.length);

  const rows = groups
    .map(({ st, list }) => `<div class="ov-row is-${st}">
      <div class="ov-row-label">
        <span class="ov-row-ico">${STATUS[st].icon}</span>
        <span class="ov-row-name">${STATUS[st].label}</span>
        <span class="ov-row-count">${list.length}</span>
      </div>
      <div class="ov-cards">${list.map((e) => champCard(e, champions[e.slug])).join('')}</div>
    </div>`)
    .join('');

  const count = (st) => patch.champions.filter((c) => statusKey(c.status) === st).length;
  const nItems = patch.items?.length ?? 0;
  const nSys = patch.systems?.length ?? 0;
  const maxCards = Math.max(...groups.map((g) => g.list.length));

  let cardStyle;
  if (ctx.format === '16x9' || !GRID[ctx.format]) {
    // 1792 = 1920 - 2×64 lề; 122 = cột nhãn + khoảng cách; 16 = khe giữa các thẻ
    const cardW = Math.min(300, Math.floor((1792 - 122 - (maxCards - 1) * 16) / maxCards));
    cardStyle = `--card-w:${cardW}px`;
  } else {
    const g = gridLayout(ctx.format, groups);
    cardStyle = `--card-w:${g.w}px;--card-h:${g.h}px`;
  }

  return `<div class="slide slide--overview" data-rows="${groups.length}" data-max="${maxCards}" style="${cardStyle}">
    ${background('<div class="ov-aura ov-aura--buff"></div><div class="ov-aura ov-aura--nerf"></div><div class="watermark ov-watermark">' + esc(patch.id) + '</div>')}
    ${topBar(ctx, 'TỔNG QUAN')}
    <section class="ov-hero">
      <div class="ov-title">
        <h1>${esc(patch.id)}</h1>
      </div>
      <div class="ov-headline">
        ${patch.headline ? `<p>${patch.headline.split('·').map((s) => `<span>${esc(s.trim())}</span>`).join('<i></i>')}</p>` : ''}
        <div class="ov-counts">
          ${count('buff') ? `<span class="ov-count is-buff">${STATUS.buff.icon}<b>${count('buff')}</b> BUFF</span>` : ''}
          ${count('nerf') ? `<span class="ov-count is-nerf">${STATUS.nerf.icon}<b>${count('nerf')}</b> NERF</span>` : ''}
          ${count('mixed') ? `<span class="ov-count is-mixed">${STATUS.mixed.icon}<b>${count('mixed')}</b> ĐIỀU CHỈNH</span>` : ''}
          ${nItems ? `<span class="ov-count is-neutral"><b>${nItems}</b> TRANG BỊ</span>` : ''}
          ${nSys ? `<span class="ov-count is-neutral"><b>${nSys}</b> HỆ THỐNG</span>` : ''}
        </div>
      </div>
    </section>
    <section class="ov-rows">${rows}</section>
    <section class="ov-bottom">
      ${nItems ? `<div class="ov-group ov-group--items">
        <div class="ov-side"><span>TRANG BỊ</span></div>
        <div class="ov-panel"><div class="ov-tiles">${patch.items.map((e) => itemTile(e, items[e.slug])).join('')}</div></div>
      </div>` : ''}
      ${nSys ? `<div class="ov-group ov-group--sys">
        <div class="ov-side"><span>HỆ THỐNG</span></div>
        <div class="ov-panel"><div class="ov-tiles">${patch.systems.map(systemTile).join('')}</div></div>
      </div>` : ''}
    </section>
    ${footBar(ctx)}
  </div>`;
}
