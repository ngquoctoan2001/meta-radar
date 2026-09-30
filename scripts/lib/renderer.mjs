// Chụp ảnh slide bằng trình duyệt thật (Edge/Chrome có sẵn trên máy) qua playwright-core.
import { chromium } from 'playwright-core';
import { FORMATS } from '../../src/js/lib/formats.js';

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
export async function renderSlide(origin, patchId, slideId, format = '16x9') {
  const { width, height, scale } = FORMATS[format];
  const browser = await getBrowser();
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  const warnings = [];
  page.on('console', (m) => {
    if (m.type() === 'warning' || m.type() === 'error') warnings.push(m.text());
  });
  try {
    const q = new URLSearchParams({ patch: patchId, slide: slideId, format });
    await page.goto(`${origin}/slide.html?${q}`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__READY__ !== undefined, null, { timeout: 30000 });
    const state = await page.evaluate(() => [window.__READY__, window.__ERROR__]);
    if (state[0] === 'error') throw new Error(state[1]);
    const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width, height } });
    return { png, warnings };
  } finally {
    await page.close();
  }
}
