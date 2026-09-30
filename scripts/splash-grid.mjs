// Ảnh splash kẻ lưới để đo vị trí khuôn mặt tướng → điền layout.focusX trong data/champions/<slug>.json.
//
//   node scripts/splash-grid.mjs hwei tristana     → review/splash-<slug>.png để đo
//   node scripts/splash-grid.mjs jinx --focus=0.62  → ghi layout.focusX vào data/champions/jinx.json rồi vẽ lại để kiểm
//
// Vạch vàng đánh số 0.1 … 0.9 theo bề ngang ảnh, vạch hồng = focusX hiện tại.
// focusX = vị trí tâm khuôn mặt (giữa hai mắt), lấy lẻ được, vd 0.62.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './lib/patches.mjs';
import { ensureServer } from './lib/ensure-server.mjs';
import { getBrowser, closeBrowser } from './lib/renderer.mjs';

const args = process.argv.slice(2);
const slugs = args.filter((a) => !a.startsWith('--'));
const focusArg = args.find((a) => a.startsWith('--focus='))?.split('=')[1];
const focus = focusArg === undefined ? null : Number(focusArg);
if (!slugs.length || (focus !== null && (slugs.length !== 1 || !(focus >= 0 && focus <= 1)))) {
  console.log('Cách dùng: node scripts/splash-grid.mjs <slug> [slug...]  |  node scripts/splash-grid.mjs <slug> --focus=0.62');
  process.exit(1);
}

if (focus !== null) {
  const file = path.join(ROOT, 'data', 'champions', `${slugs[0]}.json`);
  const champ = JSON.parse(await readFile(file, 'utf8'));
  champ.layout = { ...champ.layout, focusX: focus };
  await writeFile(file, JSON.stringify(champ, null, 2) + '\n');
  console.log(`✔ ${slugs[0]}: layout.focusX = ${focus}`);
}

const W = 1280;
const { origin: ORIGIN, stop } = await ensureServer();
try {
  const browser = await getBrowser();
  await mkdir(path.join(ROOT, 'review'), { recursive: true });
  for (const slug of slugs) {
    const champ = JSON.parse(await readFile(path.join(ROOT, 'data', 'champions', `${slug}.json`), 'utf8'));
    const { width = 1280, height = 720 } = champ.splashDims ?? {};
    const H = Math.round((W * height) / width);
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    const lines = Array.from({ length: 19 }, (_, i) => (i + 1) * 0.05)
      .map((x) => {
        const major = Math.round(x * 100) % 10 === 0;
        return `<i style="left:${x * 100}%;opacity:${major ? 1 : 0.45}"></i>${major ? `<b style="left:${x * 100}%">${x.toFixed(1)}</b>` : ''}`;
      })
      .join('');
    await page.goto(`${ORIGIN}/index.html`); // cùng origin để tải ảnh trong assets/
    await page.setContent(`<body style="margin:0">
      <style>
        img{display:block;width:${W}px;height:${H}px}
        i{position:absolute;top:0;bottom:0;width:2px;margin-left:-1px;background:#ffe600}
        b{position:absolute;top:8px;transform:translateX(-50%);padding:2px 6px;background:#000c;color:#ffe600;font:700 18px/1 sans-serif}
        .now{position:absolute;top:0;bottom:0;width:4px;margin-left:-2px;background:#ff2d6f}
      </style>
      <img src="${ORIGIN}/${champ.splash}">${lines}
      <span class="now" style="left:${(champ.layout?.focusX ?? 0.5) * 100}%"></span></body>`);
    await page.waitForFunction(() => document.images[0].complete);
    const out = path.join(ROOT, 'review', `splash-${slug}.png`);
    await page.screenshot({ path: out });
    await page.close();
    console.log(`✔ ${slug}: review/splash-${slug}.png (vạch hồng = focusX hiện tại ${champ.layout?.focusX ?? 0.5})`);
  }
} finally {
  await closeBrowser();
  stop();
}
