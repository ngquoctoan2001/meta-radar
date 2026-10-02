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
// Khổ vuông 1:1 (bố cục riêng, xem src/js/slides/build-square.js): khung 1080×1080, xuất 2160×2160.
// Hiện có cho ảnh build + tổng quan build; loại ảnh khác chỉ có khổ 16:9.
export const SQUARE_CANVAS = { width: 1080, height: 1080 };
export const SQUARE_TYPES = ['build', 'build-overview'];
export const hasSquare = (slide) => SQUARE_TYPES.includes(slide?.type);
// format: 'wide' (16:9, mặc định) | 'square' (1:1 — chỉ áp dụng cho loại ảnh có bản vuông)
export const formatOf = (slide, format) => (format === 'square' && hasSquare(slide) ? 'square' : 'wide');
export const canvasOf = (slide, format) => (isCover(slide) ? COVER_CANVAS : formatOf(slide, format) === 'square' ? SQUARE_CANVAS : CANVAS);
// Ảnh vuông lưu ở thư mục con out/1x1/, tên file thêm đuôi "-1x1".
export const SQUARE_DIR = '1x1';

// vd 7.3a-02-samira.png · tier-2026-09-30-02-baron.png
export const fileName = (id, index, slideId, format) => `${id}-${String(index + 1).padStart(2, '0')}-${slideId}${format === 'square' ? '-1x1' : ''}.png`;
