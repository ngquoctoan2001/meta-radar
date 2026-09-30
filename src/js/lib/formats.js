// Các khổ ảnh. Dùng chung cho trang vẽ ảnh, trang quản lý và server.
//
// width/height: kích thước khung vẽ (CSS px) — các thành phần (thẻ, chữ, nhãn) giữ nguyên cỡ như 16:9.
// scale: tỉ lệ khi chụp → ảnh xuất ra = width×scale × height×scale.
//   1:1 vẽ trên khung 1440 rồi xuất 1080×1080 để có đủ chỗ mà chữ vẫn to.
export const FORMATS = {
  '16x9': { label: '16:9', hint: 'Facebook · YouTube', width: 1920, height: 1080, scale: 1 },
  '9x16': { label: '9:16', hint: 'TikTok · Reels · Story', width: 1080, height: 1920, scale: 1 },
  '1x1': { label: '1:1', hint: 'Facebook · Instagram', width: 1440, height: 1440, scale: 0.75 },
};

export const DEFAULT_FORMAT = '16x9';
export const isFormat = (f) => Object.hasOwn(FORMATS, f);
export const outputSize = (f) => ({
  width: Math.round(FORMATS[f].width * FORMATS[f].scale),
  height: Math.round(FORMATS[f].height * FORMATS[f].scale),
});
export const fileName = (patchId, index, slideId, format) =>
  `${patchId}-${String(index + 1).padStart(2, '0')}-${slideId}-${format}.png`;
