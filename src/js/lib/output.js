// Kích thước ảnh xuất. Dùng chung cho trang quản lý và server.
//
// Khung vẽ 1920×1080 (CSS px), chụp ở tỉ lệ 2 → mọi ảnh xuất ra đều 3840×2160:
// trình duyệt vẽ lại chữ, số, viền, icon ở độ phân giải gấp đôi (không phải phóng to ảnh nhỏ).
export const CANVAS = { width: 1920, height: 1080 };
export const SCALE = 2;
export const OUTPUT = { width: CANVAS.width * SCALE, height: CANVAS.height * SCALE };

// Ảnh bìa / thumbnail (loại "…-cover") là ảnh rời: không có số trang và không tính vào tổng "NN / tổng" ở chân các ảnh khác.
// Ảnh bìa theo khổ DỌC 3:4 — đúng tỉ lệ ô ảnh trên lưới trang cá nhân TikTok (người dùng chốt 02/10/2026):
// khung 1080×1440, chụp ở tỉ lệ SCALE = 2 → xuất 2160×2880.
export const isCover = (slide) => String(slide?.type ?? '').endsWith('-cover');
export const COVER_CANVAS = { width: 1080, height: 1440 };
export const canvasOf = (slide) => (isCover(slide) ? COVER_CANVAS : CANVAS);

// vd 7.3a-02-samira.png · tier-2026-09-30-02-baron.png
export const fileName = (id, index, slideId) => `${id}-${String(index + 1).padStart(2, '0')}-${slideId}.png`;
