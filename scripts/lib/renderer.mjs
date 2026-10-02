// Chụp ảnh slide bằng trình duyệt thật (Edge/Chrome có sẵn trên máy) qua playwright-core.
import { chromium } from 'playwright-core';
import { CANVAS, SCALE } from '../../src/js/lib/output.js';

let browserPromise;

async function launch() {
  const errors = [];
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel });
    } catch (err) {
      errors.push(`${channel}: ${err.message.split('\n')[0]}`);
    }
  }
  throw new Error(`Không mở được Edge/Chrome để chụp ảnh.\n${errors.join('\n')}`);
}

export function getBrowser() {
  browserPromise ??= launch().catch((err) => {
    browserPromise = undefined;
    throw err;
  });
  return browserPromise;
}

export async function closeBrowser() {
  if (browserPromise) (await browserPromise).close();
  browserPromise = undefined;
}

// Trả về Buffer PNG. `origin` là địa chỉ server đang phục vụ slide.html.
// Khung vẽ của từng loại ảnh (canvasOf trong src/js/lib/output.js) chụp ở tỉ lệ SCALE = 2 — trình duyệt vẽ lại mọi thứ
// ở độ phân giải gấp đôi: 16:9 → 3840×2160, build vuông → 2160×2160, ảnh bìa dọc → 2160×2880.
export async function renderSlide(origin, patchId, slideId) {
  const browser = await getBrowser();
  const page = await browser.newPage({ viewport: CANVAS, deviceScaleFactor: SCALE });
  const warnings = [];
  page.on('console', (m) => {
    if (m.type() === 'warning' || m.type() === 'error') warnings.push(m.text());
  });
  try {
    const q = new URLSearchParams({ patch: patchId, slide: slideId });
    await page.goto(`${origin}/slide.html?${q}`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__READY__ !== undefined, null, { timeout: 30000 });
    const state = await page.evaluate(() => [window.__READY__, window.__ERROR__]);
    if (state[0] === 'error') throw new Error(state[1]);
    // ảnh build (vuông) và ảnh bìa (dọc 3:4) có khung vẽ riêng: slide.js báo khung vẽ của ảnh qua window.__CANVAS__
    const size = (await page.evaluate(() => window.__CANVAS__)) ?? CANVAS;
    if (size.width !== CANVAS.width || size.height !== CANVAS.height) await page.setViewportSize(size);
    const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: size.width, height: size.height } });
    return { png, warnings };
  } finally {
    await page.close();
  }
}
