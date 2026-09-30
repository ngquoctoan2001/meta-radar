// Xuất ảnh nhận diện kênh trong brand/ ra PNG.
//
//   node scripts/render-brand.mjs            # cả avatar và ảnh bìa
//   node scripts/render-brand.mjs avatar     # chỉ avatar
//   node scripts/render-brand.mjs cover      # chỉ ảnh bìa Facebook
//
// → brand/meta-radar-avatar.png   1080×1080   (+ @2x 2160×2160)
//   brand/meta-radar-cover.png    1640×924    (+ @2x 3280×1848)
//   review/avatar-preview.png, review/cover-preview.png — xem thử khi lên TikTok / Facebook
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ensureServer } from './lib/ensure-server.mjs';
import { ROOT } from './lib/patches.mjs';
import { getBrowser, closeBrowser } from './lib/renderer.mjs';

const TARGETS = {
  avatar: { page: 'brand/avatar.html', file: 'meta-radar-avatar', width: 1080, height: 1080, preview: avatarPreview },
  cover: { page: 'brand/cover.html', file: 'meta-radar-cover', width: 1640, height: 924, preview: coverPreview },
};

const picked = process.argv.slice(2).filter((a) => !a.startsWith('--'));
for (const name of picked) {
  if (!TARGETS[name]) {
    console.error(`Không có "${name}". Chọn: ${Object.keys(TARGETS).join(', ')}`);
    process.exit(1);
  }
}

async function shoot(origin, { page: url, width, height }, scale) {
  const browser = await getBrowser();
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  const problems = [];
  page.on('response', (r) => r.status() >= 400 && !r.url().endsWith('/favicon.ico') && problems.push(`${r.status()} ${r.url()}`));
  page.on('pageerror', (e) => problems.push(e.message));
  try {
    await page.goto(`${origin}/${url}`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__READY__ !== undefined, null, { timeout: 30000 });
    const [state, error] = await page.evaluate(() => [window.__READY__, window.__ERROR__]);
    if (state === 'error') throw new Error(`${url}: ${error}`);
    if (problems.length) console.warn(`⚠ ${url}:\n  ${problems.join('\n  ')}`);
    return await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width, height } });
  } finally {
    await page.close();
  }
}

const dataUrl = (png) => `data:image/png;base64,${png.toString('base64')}`;

async function snapshot(html, width) {
  const browser = await getBrowser();
  const page = await browser.newPage({ viewport: { width, height: 400 } });
  try {
    await page.setContent(`<!doctype html><meta charset="utf-8">${html}`, { waitUntil: 'load' });
    return await page.screenshot({ type: 'png', fullPage: true });
  } finally {
    await page.close();
  }
}

// Avatar bị cắt tròn ở nhiều cỡ, trên nền tối và nền sáng.
function avatarPreview({ png }) {
  const src = dataUrl(png);
  const sizes = [420, 200, 110, 56, 36];
  const row = (bg, fg) => `<div class="row" style="background:${bg};color:${fg}">${sizes
    .map((s) => `<figure><img src="${src}" style="width:${s}px;height:${s}px"><figcaption>${s}px</figcaption></figure>`)
    .join('')}</div>`;
  return snapshot(`<style>
    body{margin:0;font:600 18px/1 'Segoe UI',sans-serif}
    .row{display:flex;align-items:center;gap:48px;padding:40px 48px}
    figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:14px}
    img{border-radius:50%;display:block}
  </style>${row('#0b0b0f', '#9a9aa8')}${row('#ffffff', '#666')}`, 1200);
}

// Ảnh bìa: bản máy tính (chỉ dải giữa) và bản điện thoại (cả ảnh), có avatar đè lên như trên Facebook.
// Vị trí avatar là ước lượng theo giao diện fanpage hiện tại — chỉ để kiểm tra chữ có bị che không.
function coverPreview({ png, avatar }) {
  const src = dataUrl(png);
  const av = avatar ? `<img class="av" src="${dataUrl(avatar)}">` : '';
  return snapshot(`<style>
    body{margin:0;background:#f0f2f5;font:600 18px/1.3 'Segoe UI',sans-serif;color:#555;padding:32px 40px}
    h2{font-size:18px;margin:0 0 12px;color:#333}
    .desk{position:relative;width:1100px;height:${Math.round((1100 * 624) / 1640)}px;overflow:hidden;border-radius:0 0 10px 10px}
    .desk>img{width:1100px;margin-top:${(-150 * 1100) / 1640}px;display:block}
    .desk-wrap{position:relative;padding-bottom:70px}
    .desk-wrap .av{position:absolute;left:32px;top:${Math.round((1100 * 624) / 1640) - 84}px;width:168px;height:168px}
    .mob-row{display:flex;gap:40px;align-items:flex-start}
    .mob{position:relative;width:390px;background:#fff;padding-bottom:90px;border-radius:12px;overflow:hidden}
    .mob>img{width:390px;display:block}
    .mob .av{position:absolute;left:16px;top:${Math.round((390 * 924) / 1640) - 70}px;width:150px;height:150px}
    .av{border-radius:50%;border:4px solid #fff;box-sizing:border-box}
    .note{max-width:600px}
  </style>
  <h2>Máy tính — chỉ hiện dải giữa ảnh (mô phỏng)</h2>
  <div class="desk-wrap"><div class="desk"><img src="${src}"></div>${av}</div>
  <div class="mob-row">
    <div><h2>Điện thoại (mô phỏng)</h2><div class="mob"><img src="${src}">${av}</div></div>
    <p class="note">Vị trí avatar là ước lượng theo giao diện fanpage hiện tại, dùng để kiểm tra chữ và khuôn mặt tướng không bị che.</p>
  </div>`, 1180);
}

const { origin, stop } = await ensureServer();
try {
  const names = picked.length ? picked : Object.keys(TARGETS);
  await mkdir(path.join(ROOT, 'review'), { recursive: true });
  let avatar;
  for (const name of names) {
    const t = TARGETS[name];
    const x1 = await shoot(origin, t, 1);
    const x2 = await shoot(origin, t, 2);
    await writeFile(path.join(ROOT, 'brand', `${t.file}.png`), x1);
    await writeFile(path.join(ROOT, 'brand', `${t.file}@2x.png`), x2);
    if (name === 'avatar') avatar = x1;
    if (name === 'cover' && !avatar) avatar = await shoot(origin, TARGETS.avatar, 1);
    await writeFile(path.join(ROOT, 'review', `${name}-preview.png`), await t.preview({ png: x1, avatar }));
    console.log(`✔ brand/${t.file}.png (${t.width}×${t.height}) + @2x (${t.width * 2}×${t.height * 2}) · review/${name}-preview.png`);
  }
} finally {
  await closeBrowser();
  await stop();
}
