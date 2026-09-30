import { esc, topBar, footBar, background, ICON, STATUS, statusKey, lineHTML, verdictBox } from '../lib/ui.js';

// Ảnh "Khác": thay đổi hệ thống, bản đồ, phép bổ trợ, công trình...
export function renderSystem(ctx, slide) {
  const list = ctx.patch.systems ?? [];
  const cards = list
    .map((sys) => {
      const k = statusKey(sys.status);
      const icon = sys.icon ? `<img src="/${esc(sys.icon)}" alt="">` : `<i>${ICON[sys.iconSvg] ?? ICON.shield}</i>`;
      return `<section class="sys-card is-${k}">
        <div class="sys-icon">${icon}</div>
        <span class="sys-status">${STATUS[k].icon}${STATUS[k].label}</span>
        <h3 class="sys-name" data-fit>${esc(sys.name)}</h3>
        <p class="sys-summary">${esc(sys.summary ?? '')}</p>
        <div class="sys-lines">${(sys.lines ?? []).map(lineHTML).join('')}</div>
      </section>`;
    })
    .join('');

  return `<div class="slide slide--system is-neutral" data-count="${list.length}">
    ${background('<div class="sys-aura"></div><div class="watermark">MAP</div>')}
    ${topBar(ctx, 'HỆ THỐNG & BẢN ĐỒ')}
    <main class="sys-main">
      <div class="sys-head">
        <span class="sys-kicker">THAY ĐỔI KHÁC</span>
        <h1>${esc(slide.title ?? 'Hệ thống & bản đồ')}</h1>
      </div>
      <div class="sys-cards">${cards}</div>
      ${verdictBox(ctx.patch.systemsVerdict, 'neutral')}
    </main>
    ${footBar(ctx)}
  </div>`;
}
