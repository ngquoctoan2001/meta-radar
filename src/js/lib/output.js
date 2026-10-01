// Kích thước ảnh xuất. Dùng chung cho trang quản lý và server.
//
// Khung vẽ 1920×1080 (CSS px), chụp ở tỉ lệ 2 → mọi ảnh xuất ra đều 3840×2160:
// trình duyệt vẽ lại chữ, số, viền, icon ở độ phân giải gấp đôi (không phải phóng to ảnh nhỏ).
export const CANVAS = { width: 1920, height: 1080 };
export const SCALE = 2;
export const OUTPUT = { width: CANVAS.width * SCALE, height: CANVAS.height * SCALE };

// vd 7.3a-02-samira.png · tier-2026-09-30-02-baron.png
export const fileName = (id, index, slideId) => `${id}-${String(index + 1).padStart(2, '0')}-${slideId}.png`;
