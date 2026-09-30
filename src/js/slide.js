// Vẽ 1 ảnh theo URL:  /slide.html?patch=7.3a&slide=samira
import { loadPatchBundle } from './lib/data.js';
import { fitAll } from './lib/fit.js';
import { esc } from './lib/ui.js';
import { renderOverview } from './slides/overview.js';
import { renderChampion } from './slides/champion.js';
import { renderItem } from './slides/item.js';
import { renderSystem } from './slides/system.js';

const RENDERERS = { overview: renderOverview, champion: renderChampion, item: renderItem, system: renderSystem };
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

  const bundle = await loadPatchBundle(patchId);
  const slides = bundle.patch.slides;
  const index = slides.findIndex((s) => s.id === slideId);
  if (index < 0) throw new Error(`Patch ${patchId} không có ảnh "${slideId}"`);
  const slide = slides[index];
  const render = RENDERERS[slide.type];
  if (!render) throw new Error(`Chưa có mẫu ảnh cho loại "${slide.type}"`);

  // Tải trước mọi font đã khai báo (đều nằm sẵn trong máy). Chỉ chờ document.fonts.ready thì
  // font của nội dung vừa chèn có thể chưa kịp tải → thỉnh thoảng vẽ bằng font dự phòng.
  await Promise.all([...document.fonts].map((f) => f.load().catch(() => {})));

  document.title = `${patchId} · ${slideId}`;
  root.innerHTML = render({ ...bundle, index, total: slides.length }, slide);

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
