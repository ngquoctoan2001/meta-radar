import {
  esc, topBar, footBar, background, statusBadge, changeCard, verdictBox, findSkill, SKILL_KICKER, ICON, STATUS, statusKey,
} from '../lib/ui.js';

// Khổ 1:1: chia thẻ vào 2 cột sao cho 2 cột cao gần bằng nhau (ước lượng theo số dòng).
function twoColumns(cards, changes) {
  // chỉ 1 thẻ → 1 cột rộng hết khung
  const cols = cards.length === 1 ? [{ w: 0, html: [] }] : [{ w: 0, html: [] }, { w: 0, html: [] }];
  cards.forEach((html, i) => {
    const col = cols.reduce((a, b) => (b.w < a.w ? b : a));
    col.w += 1.3 + changes[i].lines.length;
    col.html.push(html);
  });
  return `<div class="changes changes--cols" data-fit-stack>${cols.map((c) => `<div class="chg-col">${c.html.join('')}</div>`).join('')}</div>`;
}

export function renderChampion(ctx, slide) {
  const entry = ctx.patch.champions.find((c) => c.slug === slide.ref);
  const champ = ctx.champions[slide.ref];
  if (!entry || !champ) throw new Error(`Thiếu dữ liệu tướng "${slide.ref}"`);
  const k = statusKey(entry.status);
  // layout chung + ghi đè riêng theo khổ, vd "layout": { "splashPosition": "72% 20%", "9x16": { "splashPosition": "60% 0%" } }
  const layout = { ...(champ.layout ?? {}), ...(champ.layout?.[ctx.format] ?? {}) };

  const cards = entry.changes.map((g) => {
    if (g.key === 'stats') {
      return changeCard({ iconSvg: ICON.stats, kicker: SKILL_KICKER.stats, title: g.name ?? 'Chỉ số cơ bản', note: g.note, lines: g.lines });
    }
    const skill = findSkill(champ, g.key);
    return changeCard({
      img: skill?.icon,
      badge: g.badge ?? g.key.toUpperCase(),
      kicker: g.badge ? `CHIÊU ${g.badge}` : SKILL_KICKER[g.key] ?? g.key.toUpperCase(),
      title: g.name ?? skill?.name ?? '',
      note: g.note,
      lines: g.lines,
    });
  });
  const lineCount = entry.changes.reduce((n, g) => n + g.lines.length, 0);

  const style = [
    `--splash:url('/${champ.splash}')`,
    `--splash-pos:${layout.splashPosition ?? '50% 20%'}`,
    `--splash-size:${layout.splashSize ?? 'cover'}`,
  ].join(';');

  return `<div class="slide slide--champion is-${k}" style="${esc(style)}">
    ${background(`<div class="ch-splash"></div><div class="ch-shade"></div><div class="slash"></div><div class="watermark">${STATUS[k].label}</div>`)}
    ${topBar(ctx, 'CHI TIẾT TƯỚNG')}
    <main class="ch-main">
      <div class="ch-hero">
        ${statusBadge(entry.status)}
        <h1 class="ch-name" data-fit>${esc(champ.name)}</h1>
        <div class="ch-meta">
          <span class="ch-title">${esc(champ.title)}</span>
          ${champ.roles.map((r) => `<span class="role-chip">${esc(r)}</span>`).join('')}
        </div>
        ${verdictBox(entry.verdict, entry.status)}
      </div>
      ${ctx.format === '1x1' ? twoColumns(cards, entry.changes) : `<div class="changes" data-fit-stack data-groups="${cards.length}" data-lines="${lineCount}">${cards.join('')}</div>`}
    </main>
    ${footBar(ctx)}
  </div>`;
}
