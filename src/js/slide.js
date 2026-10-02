// Vẽ 1 ảnh theo URL:  /slide.html?patch=7.3a&slide=samira  (tier list: ?patch=tier-2026-09-30&slide=baron)
// Bản vuông 1:1 của ảnh build: thêm &format=square
import { loadBundle } from './lib/data.js';
import { fitAll } from './lib/fit.js';
import { esc } from './lib/ui.js';
import { renderOverview } from './slides/overview.js';
import { renderChampion } from './slides/champion.js';
import { renderItem } from './slides/item.js';
import { renderSystem } from './slides/system.js';
import { renderTierOverview, renderTierLane } from './slides/tier.js';
import { renderBuild, renderBuildItems, renderBuildOverview, renderBuildCover } from './slides/build.js';
import { renderBuildSquare, renderBuildOverviewSquare } from './slides/build-square.js';
import { isCover, canvasOf, formatOf } from './lib/output.js';

const SQUARE = { build: renderBuildSquare, 'build-overview': renderBuildOverviewSquare };

const RENDERERS = {
  overview: renderOverview, champion: renderChampion, item: renderItem, system: renderSystem,
  'tier-overview': renderTierOverview, 'tier-lane': renderTierLane,
  build: renderBuild, 'build-items': renderBuildItems, 'build-overview': renderBuildOverview, 'build-cover': renderBuildCover,
};
const root = document.getElementById('root');

async function waitImages() {
  const imgs = [...document.images].map((img) => img.decode().catch(() => console.warn(`[img] Lỗi ảnh: ${img.src}`)));
  // ảnh nền CSS (splash, icon mờ)
  const bgUrls = [...document.querySelectorAll('[style*="url("]')]
    .flatMap((el) => [...el.getAttribute('style').matchAll(/url\('([^']+)'\)/g)].map((m) => m[1]));
  const bgs = bgUrls.map((src) => new Promise((ok) => {
    const im = new Image();
    im.onload = im.onerror = ok;
    im.src = src;
  }));
  await Promise.all([...imgs, ...bgs]);
}

async function main() {
  const q = new URLSearchParams(location.search);
  const patchId = q.get('patch');
  const slideId = q.get('slide');
  if (!patchId || !slideId) throw new Error('Thiếu tham số ?patch=...&slide=...');

  const bundle = await loadBundle(patchId);
  const { slides } = bundle;
  const index = slides.findIndex((s) => s.id === slideId);
  if (index < 0) throw new Error(`Bộ ảnh ${patchId} không có ảnh "${slideId}"`);
  const slide = slides[index];
  // &format=square: bản vuông 1:1 (loại ảnh chưa có bản vuông thì vẫn vẽ 16:9)
  const format = formatOf(slide, q.get('format'));
  const render = format === 'square' ? SQUARE[slide.type] : RENDERERS[slide.type];
  if (!render) throw new Error(`Chưa có mẫu ảnh cho loại "${slide.type}"`);

  // Tải trước mọi font đã khai báo (đều nằm sẵn trong máy). Chỉ chờ document.fonts.ready thì
  // font của nội dung vừa chèn có thể chưa kịp tải → thỉnh thoảng vẽ bằng font dự phòng.
  await Promise.all([...document.fonts].map((f) => f.load().catch(() => {})));

  document.title = `${patchId} · ${slideId}`;
  // khung vẽ theo loại ảnh (ảnh bìa là khổ dọc) — renderer đọc window.__CANVAS__ để chụp đúng cỡ
  const canvas = canvasOf(slide, format);
  Object.assign(document.body.style, { width: `${canvas.width}px`, height: `${canvas.height}px` });
  window.__CANVAS__ = canvas;

  // số trang ở chân ảnh chỉ đếm ảnh nội dung, bỏ qua ảnh bìa / thumbnail
  const pages = slides.filter((s) => !isCover(s));
  root.innerHTML = render({ ...bundle, index: isCover(slide) ? index : pages.indexOf(slide), total: pages.length }, slide);

  await document.fonts.ready;
  await waitImages();
  fitAll(root);
  window.__READY__ = true;
}

main().catch((err) => {
  console.error(err);
  root.innerHTML = `<div class="slide-error"><b>Không vẽ được ảnh</b><pre>${esc(err.message)}</pre></div>`;
  window.__READY__ = 'error';
  window.__ERROR__ = err.message;
});
