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
  clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', { sw: 2.2 }),
};

// Biểu tượng TikTok (nốt nhạc, 2 lớp bóng xanh/đỏ như logo gốc) đứng trước handle kênh.
const TIKTOK_PATH = 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z';
const HANDLE_ICON = {
  tiktok: `<svg class="handle-ico" viewBox="-1 -1 26 26" aria-hidden="true">
    <path fill="#25f4ee" transform="translate(-0.8 -0.8)" d="${TIKTOK_PATH}"/>
    <path fill="#fe2c55" transform="translate(0.8 0.8)" d="${TIKTOK_PATH}"/>
    <path fill="#fff" d="${TIKTOK_PATH}"/>
  </svg>`,
};
export const handleHTML = (brand) => `<span class="handle">${HANDLE_ICON[brand.handleIcon] ?? ''}${esc(brand.handle)}</span>`;

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

// tag: ô màu bên phải, mặc định "BẢN <patch>"; tier list truyền { small: 'SAU BẢN', value: '7.3a' }.
export function topBar(ctx, label, tag = { small: 'BẢN', value: ctx.patch?.id }) {
  const { brand } = ctx;
  return `<header class="topbar">
    <div class="brand">
      ${brand.logo ? `<img class="brand-avatar" src="/${esc(brand.logo)}" alt="">` : ''}
      <div class="brand-channel"><b>${esc(brand.channelName)}</b>${handleHTML(brand)}</div>
      ${brand.showGameLogo ? `<span class="brand-sep"></span>
      <img class="brand-icon" src="/assets/brand/wild-rift-icon.png" alt="">
      <img class="brand-logo" src="/assets/brand/toc-chien-logo.png" alt="Liên Minh Huyền Thoại: Tốc Chiến">` : ''}
    </div>
    <div class="patch-tag">
      ${label ? `<span class="patch-tag-label">${esc(label)}</span>` : ''}
      <span class="patch-tag-ver"><small>${esc(tag.small)}</small>${esc(tag.value)}</span>
    </div>
  </header>`;
}

// note: dòng ghi chú thêm sau handle (vd nguồn dữ liệu tier list).
export function footBar(ctx, note) {
  const { brand, index, total } = ctx;
  return `<footer class="footbar">
    <span>${esc(brand.credit)}</span>
    <span class="footbar-dot"></span>
    ${handleHTML(brand)}
    ${note ? `<span class="footbar-dot"></span><span class="footbar-note">${esc(note)}</span>` : ''}
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
