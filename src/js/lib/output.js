// Kích thước ảnh xuất. Dùng chung cho trang quản lý và server.
//
// Mỗi loại ảnh có một khung vẽ (CSS px), chụp ở tỉ lệ SCALE = 2: trình duyệt vẽ lại chữ, số, viền, icon
// ở độ phân giải gấp đôi (không phải phóng to ảnh nhỏ).
//   bản cập nhật, tier list      16:9   khung 1920×1080 → xuất 3840×2160
//   build (tướng, tổng quan)     1:1    khung 1080×1080 → xuất 2160×2160
//   ảnh bìa / thumbnail          3:4    khung 1080×1440 → xuất 2160×2880
export const CANVAS = { width: 1920, height: 1080 };
export const SCALE = 2;

// Ảnh bìa / thumbnail (loại "…-cover") là ảnh rời: không có số trang và không tính vào tổng "NN / tổng" ở chân các ảnh khác.
// Ảnh bìa theo khổ DỌC 3:4 — đúng tỉ lệ ô ảnh trên lưới trang cá nhân TikTok (người dùng chốt 02/10/2026).
export const isCover = (slide) => String(slide?.type ?? '').endsWith('-cover');
export const COVER_CANVAS = { width: 1080, height: 1440 };
// Ảnh build chỉ có khổ VUÔNG 1:1 (người dùng chốt 02/10/2026: hợp bài đăng TikTok / Facebook, bỏ hẳn bản 16:9).
export const SQUARE_CANVAS = { width: 1080, height: 1080 };
export const isSquare = (slide) => ['build', 'build-overview'].includes(slide?.type);
export const canvasOf = (slide) => (isCover(slide) ? COVER_CANVAS : isSquare(slide) ? SQUARE_CANVAS : CANVAS);

// vd 7.3a-02-samira.png · tier-2026-09-30-02-baron.png · build-2026-10-02-mid-03-hwei.png
export const fileName = (id, index, slideId) => `${id}-${String(index + 1).padStart(2, '0')}-${slideId}.png`;
