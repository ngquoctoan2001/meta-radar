import {
  esc, topBar, footBar, background, statusBadge, changeCard, verdictBox, ICON, STATUS, statusKey,
} from '../lib/ui.js';
import { analyzeLine, norm, fmt } from '../lib/values.js';

// Chỉ số trang bị sau cập nhật: lấy chỉ số gốc, thay bằng giá trị mới nếu patch có đổi.
function statsAfter(item, entry) {
  const changed = entry.changes.filter((g) => g.key === 'stats').flatMap((g) => g.lines);
  return (item.stats ?? []).map((s) => {
    const line = changed.find((l) => norm(l.label) === norm(s.label));
    if (!line) return { ...s, changed: false };
    const sign = s.value.trim().startsWith('+') ? '+' : '';
    return { ...s, value: sign + line.new, changed: true, effect: analyzeLine(line).effect };
  });
}

// Giá sau cập nhật: nếu patch có dòng "Giá" thì lấy giá mới và tô màu.
function priceAfter(item, entry) {
  const line = entry.changes.flatMap((g) => g.lines).find((l) => norm(l.label) === 'gia');
  if (line) return { value: line.new, changed: true, effect: analyzeLine(line).effect };
  return item.price ? { value: fmt(item.price), changed: false } : null;
}

function balanceMeter(entry) {
  const effects = entry.changes.flatMap((g) => g.lines).map((l) => analyzeLine(l).effect);
  const buff = effects.filter((e) => e === 'buff').length;
  const nerf = effects.filter((e) => e === 'nerf').length;
  const k = statusKey(entry.status);
  return `<section class="balance">
    <div class="balance-head">
      <span class="balance-kicker">CÁN CÂN THAY ĐỔI</span>
      <span class="balance-result is-${k}">${STATUS[k].icon}${k === 'mixed' ? 'VỪA TĂNG VỪA GIẢM' : `THIÊN VỀ ${STATUS[k].label}`}</span>
    </div>
    <div class="balance-bar">
      <span class="balance-part is-buff" style="flex:${buff}"><b>${buff}</b> TĂNG</span>
      <span class="balance-part is-nerf" style="flex:${nerf}"><b>${nerf}</b> GIẢM</span>
    </div>
  </section>`;
}

export function renderItem(ctx, slide) {
  const entry = ctx.patch.items.find((i) => i.slug === slide.ref);
  const item = ctx.items[slide.ref];
  if (!entry || !item) throw new Error(`Thiếu dữ liệu trang bị "${slide.ref}"`);
  const k = statusKey(entry.status);

  const cards = entry.changes.map((g) =>
    changeCard({
      iconSvg: g.key === 'stats' ? ICON.stats : ICON.spark,
      kicker: g.key === 'stats' ? 'THÔNG SỐ' : 'NỘI TẠI',
      title: g.name ?? (g.key === 'stats' ? 'Chỉ số cơ bản' : ''),
      titleEn: g.nameEn,
      note: g.note,
      lines: g.lines,
    }),
  );

  const after = statsAfter(item, entry);
  const price = priceAfter(item, entry);
  const afterHTML = after.length
    ? `<section class="after">
        <span class="after-kicker">SAU CẬP NHẬT ${esc(ctx.patch.id)}</span>
        <div class="after-list">
          ${after.map((s) => `<div class="after-stat ${s.changed ? `is-${s.effect} is-changed` : ''}"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('')}
          ${price ? `<div class="after-stat after-price${price.changed ? ` is-${price.effect} is-changed` : ''}"><b>${ICON.coin}${esc(price.value)}</b><span>Giá (vàng)</span></div>` : ''}
        </div>
      </section>`
    : '';

  return `<div class="slide slide--item is-${k}" style="--item:${esc(item.color ?? '#ffcf6b')}">
    ${background(`<div class="it-bgicon" style="background-image:url('/${esc(item.icon)}')"></div><div class="it-shade"></div><div class="slash"></div><div class="watermark">${STATUS[k].label}</div>`)}
    ${topBar(ctx, 'CHI TIẾT TRANG BỊ')}
    <main class="it-main">
      <div class="it-hero">
        <div class="it-emblem">
          <div class="it-rays"></div>
          <div class="it-ring"></div>
          <div class="it-frame"><img src="/${esc(item.icon)}" alt=""></div>
        </div>
        ${statusBadge(entry.status)}
        <h1 class="it-name" data-fit>${esc(item.name)}</h1>
        <div class="it-sub">
          ${item.nameVi ? `<span class="it-vi">${esc(item.nameVi)}</span>` : ''}
          ${(item.tags ?? []).map((t) => `<span class="role-chip">${esc(t)}</span>`).join('')}
        </div>
        ${verdictBox(entry.verdict, entry.status)}
      </div>
      <div class="changes it-changes" data-fit-stack>
        ${cards.join('')}
        ${balanceMeter(entry)}
        ${afterHTML}
      </div>
    </main>
    ${footBar(ctx)}
  </div>`;
}
