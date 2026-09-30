import {
  esc, topBar, footBar, background, statusBadge, changeCard, verdictBox, findSkill, SKILL_KICKER, ICON, STATUS, statusKey,
} from '../lib/ui.js';

// Khung splash bên trái (khớp .ch-splash trong slide-champion.css) và vị trí ngang đặt khuôn mặt tướng.
const SPLASH_BOX = { width: 1240, height: 1080 };
const FACE_X = 660;

// layout.focusX = vị trí ngang của khuôn mặt trong ảnh splash (0 = mép trái, 1 = mép phải).
// Tính background-position để khuôn mặt rơi đúng FACE_X — đúng với mọi nguồn ảnh, mọi tỉ lệ ảnh.
function splashPosition(champ) {
  const { width = 1280, height = 720 } = champ.splashDims ?? {};
  const focus = champ.layout?.focusX ?? 0.5;
  const shown = width * Math.max(SPLASH_BOX.width / width, SPLASH_BOX.height / height); // background-size: cover
  const spare = shown - SPLASH_BOX.width;
  const x = spare > 0 ? Math.min(Math.max((focus * shown - FACE_X) / spare, 0), 1) : 0.5;
  return `${(x * 100).toFixed(1)}% 20%`;
}

export function renderChampion(ctx, slide) {
  const entry = ctx.patch.champions.find((c) => c.slug === slide.ref);
  const champ = ctx.champions[slide.ref];
  if (!entry || !champ) throw new Error(`Thiếu dữ liệu tướng "${slide.ref}"`);
  const k = statusKey(entry.status);

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

  const style = `--splash:url('/${champ.splash}');--splash-pos:${splashPosition(champ)}`;

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
      <div class="changes" data-fit-stack data-groups="${cards.length}" data-lines="${lineCount}">${cards.join('')}</div>
    </main>
    ${footBar(ctx)}
  </div>`;
}
