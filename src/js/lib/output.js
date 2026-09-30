// Kích thước ảnh xuất. Dùng chung cho trang quản lý và server.
//
// Khung vẽ luôn 1920×1080 (CSS px). Độ nét = tỉ lệ khi chụp:
//   1 → 1920×1080 (nhẹ, đăng nhanh)
//   2 → 3840×2160 (chữ, số, viền, icon sắc gấp đôi — nên dùng khi đăng Facebook)
export const CANVAS = { width: 1920, height: 1080 };

export const SCALES = {
  1: { label: 'Chuẩn', size: '1920×1080' },
  2: { label: 'Nét 2x', size: '3840×2160' },
};
export const DEFAULT_SCALE = 2;
export const isScale = (s) => Object.hasOwn(SCALES, String(s));

// 1x: 7.3a-02-samira.png · 2x: 7.3a-02-samira@2x.png
export const fileName = (patchId, index, slideId, scale) =>
  `${patchId}-${String(index + 1).padStart(2, '0')}-${slideId}${Number(scale) === 2 ? '@2x' : ''}.png`;
