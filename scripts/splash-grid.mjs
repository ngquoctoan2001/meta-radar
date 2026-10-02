// Ảnh splash kẻ lưới để đo vị trí khuôn mặt tướng → điền vào data/champions/<slug>.json.
//
//   node scripts/splash-grid.mjs hwei tristana         → review/splash-<slug>.png để đo
//   node scripts/splash-grid.mjs jinx --focus=0.62      → ghi layout.focusX (khung ảnh chi tiết tướng của patch)
//   node scripts/splash-grid.mjs jinx --face=0.58,0.14  → ghi layout.face (tâm khuôn mặt x,y — dùng cắt thẻ tướng tier list)
//
// Vạch vàng dọc/ngang đánh số 0.1 … 0.9 theo bề ngang/bề cao ảnh.
// Vạch hồng = focusX hiện tại. Dấu thập xanh = layout.face hiện tại.
// focusX: vị trí ngang khuôn mặt đã tính cả cách ảnh patch cắt khung (giữ nguyên giá trị đã duyệt).
// face: tâm khuôn mặt thật (giữa hai mắt), x và y từ 0 đến 1, lấy lẻ được.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './lib/patches.mjs';
import { ensureServer } from './lib/ensure-server.mjs';
import { getBrowser, closeBrowser } from './lib/renderer.mjs';

const args = process.argv.slice(2);
const slugs = args.filter((a) => !a.startsWith('--'));
const arg = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const focusArg = arg('focus');
const focus = focusArg === undefined ? null : Number(focusArg);
const faceArg = arg('face');
const face = faceArg === undefined ? null : faceArg.split(',').map(Number);
// --avatar=x,y,zoom: khung avatar riêng cho ảnh build (tâm khung + độ phóng so với mặc định, < 1 = lấy rộng hơn);
// --avatar=none xoá khung riêng, quay về cắt quanh khuôn mặt.
const avatarArg = arg('avatar');
const avatar = avatarArg === undefined || avatarArg === 'none' ? null : avatarArg.split(',').map(Number);
const inRange = (v) => v >= 0 && v <= 1;
const badFocus = focus !== null && !inRange(focus);
const badFace = face !== null && (face.length !== 2 || !face.every(inRange));
const badAvatar = avatar !== null && (avatar.length !== 3 || !avatar.slice(0, 2).every(inRange) || !(avatar[2] >= 0.3 && avatar[2] <= 3));
const writes = focus !== null || face !== null || avatarArg !== undefined;
if (!slugs.length || badFocus || badFace || badAvatar || (writes && slugs.length !== 1)) {
  console.log('Cách dùng: node scripts/splash-grid.mjs <slug> [slug...]\n' +
    '           node scripts/splash-grid.mjs <slug> --focus=0.62\n' +
    '           node scripts/splash-grid.mjs <slug> --face=0.58,0.14\n' +
    '           node scripts/splash-grid.mjs <slug> --avatar=0.66,0.53,0.7   (hoặc --avatar=none)');
  process.exit(1);
}

if (writes) {
  const file = path.join(ROOT, 'data', 'champions', `${slugs[0]}.json`);
  const champ = JSON.parse(await readFile(file, 'utf8'));
  champ.layout = { ...champ.layout };
  if (focus !== null) champ.layout.focusX = focus;
  if (face !== null) champ.layout.face = { x: face[0], y: face[1] };
  if (avatar !== null) champ.layout.avatar = { x: avatar[0], y: avatar[1], zoom: avatar[2] };
  else if (avatarArg === 'none') delete champ.layout.avatar;
  await writeFile(file, JSON.stringify(champ, null, 2) + '\n');
  console.log(`✔ ${slugs[0]}: layout = ${JSON.stringify(champ.layout)}`);
}

const W = 1280;
const steps = Array.from({ length: 19 }, (_, i) => +((i + 1) * 0.05).toFixed(2));
const isMajor = (v) => Math.round(v * 100) % 10 === 0;

const { origin: ORIGIN, stop } = await ensureServer();
try {
  const browser = await getBrowser();
  await mkdir(path.join(ROOT, 'review'), { recursive: true });
  for (const slug of slugs) {
    const champ = JSON.parse(await readFile(path.join(ROOT, 'data', 'champions', `${slug}.json`), 'utf8'));
    const { width = 1280, height = 720 } = champ.splashDims ?? {};
    const H = Math.round((W * height) / width);
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    const vertical = steps
      .map((v) => `<i class="v" style="left:${v * 100}%;opacity:${isMajor(v) ? 1 : 0.4}"></i>${isMajor(v) ? `<b class="v" style="left:${v * 100}%">${v.toFixed(1)}</b>` : ''}`)
      .join('');
    const horizontal = steps
      .map((v) => `<i class="h" style="top:${v * 100}%;opacity:${isMajor(v) ? 0.8 : 0.3}"></i>${isMajor(v) ? `<b class="h" style="top:${v * 100}%">${v.toFixed(1)}</b>` : ''}`)
      .join('');
    const f = champ.layout?.face;
    // khung avatar của ảnh build: ô vuông cao 1 / (2.6 × zoom) chiều cao splash (2.6 = AVATAR_ZOOM trong src/js/slides/build.js)
    const av = champ.layout?.avatar ?? (f ? { x: f.x, y: f.y + 0.08 / 2.6, zoom: 1 } : null);
    const avSide = av ? H / (2.6 * av.zoom) : 0;
    await page.goto(`${ORIGIN}/index.html`); // cùng origin để tải ảnh trong assets/
    await page.setContent(`<body style="margin:0">
      <style>
        img{display:block;width:${W}px;height:${H}px}
        i{position:absolute;background:#ffe600}
        i.v{top:0;bottom:0;width:2px;margin-left:-1px}
        i.h{left:0;right:0;height:2px;margin-top:-1px}
        b{position:absolute;padding:2px 6px;background:#000c;color:#ffe600;font:700 18px/1 sans-serif}
        b.v{top:8px;transform:translateX(-50%)}
        b.h{left:8px;transform:translateY(-50%)}
        .now{position:absolute;top:0;bottom:0;width:4px;margin-left:-2px;background:#ff2d6f}
        .face{position:absolute;width:44px;height:44px;margin:-22px 0 0 -22px;border:3px solid #00f0ff;border-radius:50%;box-shadow:0 0 0 2px #000a}
        .face::before,.face::after{content:'';position:absolute;background:#00f0ff}
        .face::before{left:50%;top:-14px;bottom:-14px;width:2px;margin-left:-1px}
        .face::after{top:50%;left:-14px;right:-14px;height:2px;margin-top:-1px}
        .avatar{position:absolute;box-sizing:border-box;border:3px dashed #7dff6b;border-radius:14%;box-shadow:0 0 0 2px #000a}
      </style>
      <img src="${ORIGIN}/${champ.splash}">${vertical}${horizontal}
      <span class="now" style="left:${(champ.layout?.focusX ?? 0.5) * 100}%"></span>
      ${f ? `<span class="face" style="left:${f.x * 100}%;top:${f.y * 100}%"></span>` : ''}
      ${av ? `<span class="avatar" style="left:${av.x * W - avSide / 2}px;top:${av.y * H - avSide / 2}px;width:${avSide}px;height:${avSide}px"></span>` : ''}</body>`);
    await page.waitForFunction(() => document.images[0].complete);
    const out = path.join(ROOT, 'review', `splash-${slug}.png`);
    await page.screenshot({ path: out });
    await page.close();
    console.log(`✔ ${slug}: review/splash-${slug}.png (focusX ${champ.layout?.focusX ?? 0.5}${f ? ` · face ${f.x},${f.y}` : ' · chưa có face'})`);
  }
} finally {
  await closeBrowser();
  stop();
}
