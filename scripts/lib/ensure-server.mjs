// Đảm bảo có server (scripts/server.mjs) ĐÚNG PHIÊN BẢN đang chạy để vẽ slide.
// - Cổng PORT (mặc định 5173) có server cùng phiên bản API → dùng luôn.
// - Có server nhưng là code cũ (vd cửa sổ start.bat mở từ trước khi cập nhật) → cảnh báo, bật server tạm ở cổng kế tiếp.
// - Chưa có → bật server tạm. Trả về { origin, stop }.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { ROOT } from './patches.mjs';

// Tăng số này mỗi khi đổi API của server (tham số, đường dẫn lưu ảnh…).
export const API_VERSION = 7;

const BASE_PORT = Number(process.env.PORT ?? 5173);

async function health(port) {
  try {
    const res = await fetch(`http://localhost:${port}/api/health`);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export async function ensureServer() {
  for (let port = BASE_PORT; port < BASE_PORT + 10; port++) {
    const h = await health(port);
    if (h?.api === API_VERSION) return { origin: `http://localhost:${port}`, stop: () => {} };
    if (h) {
      console.warn(`⚠ Server ở cổng ${port} đang chạy code cũ — tắt cửa sổ start.bat rồi mở lại. Tạm dùng server riêng.`);
      continue;
    }
    const child = spawn(process.execPath, [path.join(ROOT, 'scripts', 'server.mjs')], {
      stdio: 'ignore',
      env: { ...process.env, PORT: String(port) },
    });
    for (let i = 0; i < 50 && (await health(port))?.api !== API_VERSION; i++) await new Promise((r) => setTimeout(r, 200));
    if ((await health(port))?.api !== API_VERSION) {
      child.kill();
      throw new Error(`Không bật được server ở cổng ${port}`);
    }
    return { origin: `http://localhost:${port}`, stop: () => child.kill() };
  }
  throw new Error(`Không tìm được cổng trống từ ${BASE_PORT} đến ${BASE_PORT + 9}`);
}
