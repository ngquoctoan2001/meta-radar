// Các thành phần dùng chung cho mọi loại ảnh: icon, thanh trên/dưới, nhãn trạng thái, thẻ thay đổi.
import { analyzeLine, groupEffect } from './values.js';

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const svg = (body, { fill = false, sw = 2.4 } = {}) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" fill="${fill ? 'currentColor' : 'none'}" stroke="${fill ? 'none' : 'currentColor'}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const ICON = {
  up: svg('<path d="M6 12.5l6-6 6 6M6 19l6-6 6 6"/>', { sw: 3 }),
  down: svg('<path d="M6 5l6 6 6-6M6 11.5l6 6 6-6"/>', { sw: 3 }),
  swap: svg('<path d="M4 8h14l-4-4M20 16H6l4 4"/>', { sw: 2.8 }),
  dot: svg('<circle cx="12" cy="12" r="4"/>', { fill: true }),
  arrow: svg('<path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5"/>', { sw: 2.6 }),
  bolt: svg('<path d="M13.5 2 4 13.5h7L10 22l10-12h-7l.5-8z"/>', { fill: true }),
  stats: svg('<path d="M5 20v-6M10 20V8M15 20v-9M20 20V4"/>', { sw: 2.8 }),
  spark: svg('<path d="M12 2.5l2.2 6.3 6.3 2.2-6.3 2.2L12 19.5l-2.2-6.3-6.3-2.2 6.3-2.2z"/>', { fill: true }),
  coin: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7v10M9 9.5h4.2a1.8 1.8 0 0 1 0 3.6H10.8a1.8 1.8 0 0 0 0 3.6H15"/>', { sw: 2 }),
  tower: svg('<path d="M7 21h10M8.5 21l1-9h5l1 9M7.5 12h9M8 12 7 6.5h10L16 12M7 6.5V3.5h2.3v1.6h1.9V3.5h1.6v1.6h1.9V3.5H17v3"/>', { sw: 1.9 }),
  nexus: svg('<path d="M12 2.5 19 9l-7 12.5L5 9z"/><path d="M5 9h14M12 2.5 9.5 9l2.5 12.5L14.5 9z"/>', { sw: 1.9 }),
  shield: svg('<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/>', { sw: 2.2 }),
};

export const STATUS = {
  buff: { label: 'BUFF', icon: ICON.up },
  nerf: { label: 'NERF', icon: ICON.down },
  mixed: { label: 'ĐIỀU CHỈNH', icon: ICON.swap },
  neutral: { label: 'THAY ĐỔI', icon: ICON.dot },
  rework: { label: 'LÀM LẠI', icon: ICON.spark },
  new: { label: 'MỚI', icon: ICON.spark },
};
// "adjust" trong patch.json dùng chung giao diện với "mixed".
export const statusKey = (s) => (s === 'adjust' ? 'mixed' : STATUS[s] ? s : 'neutral');

export const SKILL_KICKER = { p: 'NỘI TẠI', q: 'CHIÊU Q', w: 'CHIÊU W', e: 'CHIÊU E', r: 'CHIÊU CUỐI', stats: 'THÔNG SỐ' };

export function statusBadge(status, { size = 'lg' } = {}) {
  const k = statusKey(status);
  const s = STATUS[k];
  return `<div class="status status--${size} is-${k}">
    <span class="status-ico">${s.icon}</span>
    <span class="status-txt">${s.label}</span>
  </div>`;
}

export function topBar(ctx, label) {
  const { brand, patch } = ctx;
  return `<header class="topbar">
    <div class="brand">
      ${brand.showGameLogo ? `<img class="brand-icon" src="/assets/brand/wild-rift-icon.png" alt="">
      <img class="brand-logo" src="/assets/brand/toc-chien-logo.png" alt="Liên Minh Huyền Thoại: Tốc Chiến">
      <span class="brand-sep"></span>` : ''}
      <div class="brand-channel"><b>${esc(brand.channelName)}</b><span>${esc(brand.handle)}</span></div>
    </div>
    <div class="patch-tag">
      ${label ? `<span class="patch-tag-label">${esc(label)}</span>` : ''}
      <span class="patch-tag-ver"><small>BẢN</small>${esc(patch.id)}</span>
    </div>
  </header>`;
}

export function footBar(ctx) {
  const { brand, index, total } = ctx;
  return `<footer class="footbar">
    <span>${esc(brand.credit)}</span>
    <span class="footbar-dot"></span>
    <span>${esc(brand.handle)}</span>
    <span class="footbar-page"><b>${String(index + 1).padStart(2, '0')}</b> / ${String(total).padStart(2, '0')}</span>
  </footer>`;
}

export const background = (extra = '') =>
  `<div class="bg">${extra}<div class="bg-grid"></div><div class="bg-noise"></div></div>`;

function newValueHTML(raw, r) {
  const v = r.newV;
  if (v.kind === 'ranks' && r.cellEffects && r.cellEffects.length === v.parts.length) {
    const cells = v.parts.map((p, i) => `<span class="cell is-${r.cellEffects[i]}">${esc(p)}</span>`);
    return cells.join('<span class="sep">/</span>') + (v.unit ? ` <span class="unit">${esc(v.unit)}</span>` : '');
  }
  // đơn vị (giây, vàng) nhỏ hơn con số
  if (v.kind !== 'text' && v.unit) return `${esc(raw.slice(0, raw.lastIndexOf(v.unit)).trim())} <span class="unit">${esc(v.unit)}</span>`;
  return esc(raw);
}

export function lineHTML(line) {
  const r = analyzeLine(line);
  if (line.text) {
    return `<div class="ln ln--text is-${r.effect}">
      <span class="ln-label">${esc(line.label)}</span>
      <span class="ln-text">${esc(line.text)}</span>
      <span class="ln-delta"><i>${STATUS[statusKey(r.effect)].icon}</i></span>
    </div>`;
  }
  return `<div class="ln is-${r.effect}">
    <span class="ln-label">${esc(line.label)}</span>
    <span class="ln-old">${esc(line.old)}</span>
    <span class="ln-arrow">${ICON.arrow}</span>
    <span class="ln-new">${newValueHTML(line.new, r)}</span>
    <span class="ln-delta">${r.delta ? `<b>${esc(r.delta)}</b>` : `<i>${STATUS[statusKey(r.effect)].icon}</i>`}</span>
  </div>`;
}

// Thẻ một nhóm thay đổi (1 kỹ năng / chỉ số / nội tại trang bị).
export function changeCard({ img, iconSvg, badge, kicker, title, titleEn, note, lines }) {
  const eff = groupEffect(lines);
  const k = statusKey(eff);
  return `<section class="chg is-${k}">
    <div class="chg-head">
      <div class="chg-icon">
        ${img ? `<img src="/${esc(img)}" alt="">` : `<span class="chg-icon-svg">${iconSvg ?? ICON.stats}</span>`}
        ${badge ? `<span class="chg-key">${esc(badge)}</span>` : ''}
      </div>
      <div class="chg-titles">
        <span class="chg-kicker">${esc(kicker)}${note ? `<em>${esc(note)}</em>` : ''}</span>
        <h3 class="chg-title" data-fit>${esc(title)}${titleEn ? ` <small>(${esc(titleEn)})</small>` : ''}</h3>
      </div>
      <span class="chg-eff">${STATUS[k].icon}${STATUS[k].label}</span>
    </div>
    <div class="chg-lines">${lines.map(lineHTML).join('')}</div>
  </section>`;
}

export function verdictBox(text, status) {
  if (!text) return '';
  return `<div class="verdict is-${statusKey(status)}">
    <span class="verdict-tag">${ICON.bolt}CHỐT</span>
    <p data-fit-block>${esc(text)}</p>
  </div>`;
}

// Tìm kỹ năng của tướng theo key (p/q/w/e/r).
export const findSkill = (champ, key) => champ?.skills?.find((s) => s.key === key);
