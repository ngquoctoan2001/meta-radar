---
name: kiem-tra-anh-patch
description: Kiểm tra, sửa và xuất lại bộ ảnh patch Tốc Chiến trong dự án meta-wildrift — chạy audit dữ liệu + bố cục, xem ảnh tổng hợp, sửa lỗi chữ đè / tràn / thẻ bị cắt, xuất PNG 3840×2160. Dùng sau khi sửa patch.json (đổi câu chốt, đổi buff/nerf, sửa số, đổi thứ tự ảnh), trước khi đăng, hoặc khi người dùng nói "kiểm tra lại ảnh", "xuất lại ảnh", "ảnh bị lỗi / đè chữ", "sửa câu chốt của X", "đổi X thành nerf", "tải bản nét".
---

# Kiểm tra và xuất ảnh patch

## Lệnh

```bash
node scripts/audit.mjs <patch> --sheet     # kiểm tra dữ liệu + từng ảnh, tạo review/<patch>-tong-hop.png
node scripts/render.mjs <patch>             # xuất toàn bộ (3840×2160) → patches/<patch>/out/*.png
node scripts/render.mjs <patch> samira      # chỉ vài ảnh (theo id trong "slides")
node --test tests/*.test.js                 # khi sửa src/js/lib/values.js
```
Tier list dùng cùng lệnh với id `tier-<ngày>` (vd `node scripts/audit.mjs tier-2026-09-30 --sheet`), ảnh lưu ở `tierlists/<id>/out/`; cách làm dữ liệu xem skill **tao-tier-list**. Build dùng id `build-<ngày>-<vai trò>` (vd `build-2026-10-01-adc`, ảnh ở `builds/<id>/out/`) — xem skill **tao-build**. Ảnh build chỉ có khổ **vuông 1:1** (xuất 2160×2160, thumbnail dọc 2160×2880) — không còn bản 16:9.
Server tự bật tạm nếu chưa chạy. Nếu server của người dùng (`start.bat`) đang chạy code cũ, script tự nhận ra (so phiên bản API), in cảnh báo và dùng server riêng ở cổng kế tiếp — chỉ cần nhắc người dùng tắt `start.bat` rồi mở lại. Khi sửa API của `scripts/server.mjs` (tham số, nơi lưu ảnh…), tăng `API_VERSION` trong `scripts/lib/ensure-server.mjs`.

Sửa `patch.json` / dữ liệu bằng công cụ Edit, không dùng `sed -i` (hệ thống quyền có thể chặn lệnh shell sửa file dữ liệu).

## Đọc kết quả audit và cách sửa

`✘` = phải sửa. `⚠` = nên xem lại. Sửa **dữ liệu** trước; thiết kế đã được người dùng duyệt, đừng sửa CSS để cứu một ảnh.

| Báo lỗi | Nguyên nhân thường gặp | Cách sửa |
|---|---|---|
| `.verdict đè chân ảnh` | câu chốt dài | rút câu chốt ≤ 100 ký tự (2–3 dòng) |
| `câu chốt dài N ký tự` | như trên | rút gọn, giữ ý hệ quả |
| `.chg … bị cắt mất phần dưới` / "Quá nhiều thay đổi" | tướng có quá nhiều dòng | gộp dòng trùng ý, bỏ dòng không đổi; vẫn không vừa → báo người dùng (mẫu hiện chưa hỗ trợ tách 1 tướng thành 2 ảnh) |
| `không so sánh tự động được` | giá trị gộp, có chữ | tách thành nhiều dòng (cơ bản / tỷ lệ AP…) hoặc thêm `"effect"` |
| `key kỹ năng "…" không hợp lệ` | gõ sai | chỉ dùng `stats`, `p`, `q`, `w`, `e`, `r` (trang bị: `stats`, `passive`) |
| `không có icon cho kỹ năng` | dữ liệu tướng thiếu | chạy lại `fetch-champion.mjs <slug>` |
| `chưa có data/…json` | tướng/trang bị mới | skill **them-tuong-trang-bi** |
| `"status" … không hợp lệ` | gõ sai | `buff`, `nerf`, `adjust`, `rework`, `new` |
| `chữ tràn` | tên quá dài dù đã tự co | báo người dùng; tên hệ thống có thể viết ngắn hơn |
| `ảnh không tải được` / `không tải được /assets/…` | thiếu file | tải lại dữ liệu tướng/trang bị |
| `không vẽ được: …` | JSON sai / thiếu dữ liệu | đọc thông báo, sửa JSON (dấu phẩy, ngoặc) |
| `câu chốt của đường quá dài` (tier list) | câu chốt 3 dòng | rút còn 2 dòng (≤ ~90 ký tự) |
| `chưa đo khuôn mặt (layout.face)` (tier list) | tướng mới | `splash-grid.mjs <slug> --face=x,y` |

## Luôn tự nhìn ảnh

Audit không thấy được: khuôn mặt tướng bị che, màu trạng thái sai ý (vd buff nhưng người dùng muốn "điều chỉnh"), câu chốt vô nghĩa, số liệu nhập nhầm tướng. Sau khi audit sạch:
1. Mở `review/<patch>-tong-hop.png` bằng Read — soát cả bộ.
2. Nghi ngờ ảnh nào thì xuất riêng (`render.mjs <patch> <id>`) rồi mở `patches/<patch>/out/<file>.png` để xem kỹ (Read tự thu nhỏ; cần soi chi tiết thì cắt một vùng bằng Pillow).
3. Mặt tướng lệch/che → chỉnh `layout.focusX` (skill **them-tuong-trang-bi**).

## Khi phải sửa thiết kế (hiếm — chỉ khi người dùng yêu cầu)

Người dùng rất để ý tính đồng bộ giữa các ảnh cùng loại, và đã chốt giao diện. Trước khi sửa CSS/JS mẫu ảnh:
1. Chép ảnh đã duyệt trong `out/` ra thư mục tạm làm mốc.
2. Sửa.
3. Xuất lại, so pixel với mốc (Python + Pillow có sẵn): chỉ vùng được yêu cầu được phép khác. Số trang ở chân ảnh ("NN / tổng") khác là bình thường khi số ảnh thay đổi.

## Báo cáo
Nói ngắn: đã sửa gì, audit sạch chưa, ảnh nằm ở `patches/<patch>/out/`, cần bấm **Làm mới** trên trang quản lý. Gửi ảnh tổng hợp nếu có SendUserFile. Không commit/push trừ khi được yêu cầu.
