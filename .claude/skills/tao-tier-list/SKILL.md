---
name: tao-tier-list
description: Tạo bộ ảnh TIER LIST 16:9 (1 ảnh tổng quan top 3 mỗi đường + 5 ảnh theo đường, đủ tướng T0/T1) cho kênh Tốc Chiến META RADAR trong dự án meta-wildrift từ ảnh chụp bảng xếp hạng Tốc Chiến Trung Quốc (排行榜 · 强度) mà người dùng gửi — đọc ảnh, lấy ngày ở dòng 刷新时间, ghi số liệu từng đường bằng tên tiếng Trung, tải tướng còn thiếu, so với bản cập nhật gần nhất (BUFF/NERF) và tier list kỳ trước (MỚI/LÊN/XUỐNG), viết câu chốt, kiểm tra và xuất PNG 3840×2160. Dùng skill này khi người dùng gửi ảnh chụp bảng xếp hạng / 排行榜 / tier list (thường 6–10 ảnh), hoặc nói "làm tier list", "bảng xếp hạng mới", "tướng mạnh theo đường", "meta tuần này", "tier list ngày …" — kể cả khi chỉ gửi ảnh kèm vài chữ.
---

# Tạo bộ ảnh Tier List

Mẫu ảnh đã có và đã được người dùng duyệt (`src/js/slides/tier.js`, `src/css/slide-tier.css`). Việc của bạn là:
1. Đọc đúng số liệu từ ảnh.
2. Ghi dữ liệu bằng script.
3. Viết câu chốt bám bản cập nhật.
4. Kiểm tra và xuất ảnh.

Ví dụ hoàn chỉnh: `tierlists/tier-2026-09-30/`, gồm ảnh gốc trong `source/`, dữ liệu `tierlist.json` và ảnh xuất trong `out/`.

Người dùng viết tiếng Việt rất thân mật (xưng "tao", gọi "fen"). Trả lời tiếng Việt, thân thiện, xưng "mình – bạn".

## Quy trình

### 1. Đọc ảnh, kiểm trước khi làm
Đọc theo `references/doc-anh-bang-xep-hang.md`: bố cục màn hình, bộ lọc, thứ tự 5 biểu tượng đường, cột số liệu, lỗi hay gặp.
- **Ghép ảnh theo đường + hạng, không theo thứ tự file.** Người dùng hay gửi lộn xộn, vd phần sau của đường Rừng nằm trước phần đầu.

Kiểm **tất cả** điều dưới đây rồi hỏi người dùng **một lần**, không hỏi từng câu:

| Kiểm | Không ổn thì |
|---|---|
| Bộ lọc là 宗师以上 (Đại Cao Thủ trở lên) | Hỏi: chọn nhầm bộ lọc, hay muốn làm thêm bộ cho bậc rank đó? |
| Ngày ở dòng 刷新时间 giống nhau ở mọi ảnh | Hỏi dùng ngày nào |
| Ngày đó đã có tier list cùng bộ lọc chưa (`ls tierlists/`) | Hỏi: sửa bộ cũ hay thêm bộ thứ hai? |
| Mỗi đường đã thấy dòng T2 đầu tiên (đủ T0, T1) | Liệt kê đường thiếu, xin chụp thêm phần dưới |
| Mỗi đường ≤ 3 T0 và ≤ 7 T1 (giới hạn mẫu ảnh) | Báo ngay, hỏi có muốn mở rộng mẫu ảnh không (đổi thiết kế cần người dùng duyệt) |

- Có điều phải hỏi thì **dừng, không tạo file**. Gửi câu hỏi trước, bảng số liệu đã đọc để sau (cho họ soát luôn).
- Mọi thứ ổn thì gửi bảng số liệu từng đường (hạng · bậc · tướng · thắng · chọn · cấm), rồi làm tiếp luôn, không cần chờ.

**Người dùng chọn làm bộ lọc khác:**
- Thêm `--filter="Đấu Hạng · <bậc>"` cho lệnh `new`. Dịch bậc theo bảng trong file tham khảo; lưu ý 以上 = "trở lên", 以下 = "trở xuống", cả hai đều tính luôn bậc đó.
- Thêm `--suffix=<tên ngắn>` nếu ngày đó đã có bộ khác, vd `--suffix=kc` cho Kim Cương.
- Script tự ghi bộ lọc vào tiêu đề và chỉ so với kỳ trước cùng bộ lọc.

### 2. Tạo khung tier list theo ngày
```bash
node scripts/tierlist.mjs new 2026-10-07 baron=<ảnh> baron=<ảnh> jungle=<ảnh> mid=<ảnh> dragon=<ảnh> support=<ảnh> …
```
- Ghi `<đường>=<đường dẫn ảnh>` theo thứ tự hạng. Đường dẫn ảnh người dùng gửi hiện trong tin nhắn. Ảnh được chép vào `source/` thành `baron-1.jpg`, `baron-2.jpg`…
- Tự đối chiếu ảnh với các tier list đã làm (so nội dung file):
  - **Trùng toàn bộ** → từ chối. Người dùng gửi nhầm ảnh cũ → hỏi lại.
  - **Trùng một phần** → cảnh báo.
- Tự chọn `patch`: bản cập nhật ra gần nhất trước ngày này, dựa trên `"date"` trong `patches/*/patch.json`.
  - Script in số ngày kể từ khi bản đó ra; ≤ 3 ngày thì gợi ý `note`.
  - Patch mới nhất chưa ghi `date` → hỏi người dùng ngày ra rồi điền vào `patch.json`.
- Tự chọn `previous`: tier list **ngày trước đó**, cùng bộ lọc. Bộ khác cùng ngày không tính. Không có thì script báo rõ.
- Ngày đó đã có tier list → script từ chối. Dùng `--suffix=…` theo câu trả lời ở bước 1.

### 3. Ghi số liệu từng đường
```bash
node scripts/tierlist.mjs lane tier-2026-10-07 baron "辛吉德 T0 57.58 3.77 1.14; 安蓓萨 T1 54.86 3.08 1.62; 慎 T1 53.5 5.55 0.46"
```
- **Cú pháp mỗi tướng:** `<tên tiếng Trung y như ảnh> <T0|T1> <thắng> <chọn> <cấm>`. Các tướng ngăn cách bằng `;` và ghi **đúng thứ tự hạng**.
- **Tên đường:** `baron` · `jungle` · `mid` · `dragon` · `support`. Gõ `rung`, `giua`, `rong`, `sp` cũng được.
- **Script tự lo:**
  - Tra tên Trung ra tướng.
  - Chặn lỗi: sai bậc, T0 đứng sau T1, trùng dòng, số ngoài 0–100, tên không có. Có lỗi thì **không ghi gì**.
  - In lại "tên Trung = slug" để bạn soát với ảnh.
- **Ghi đè:** chạy lại cùng đường. Câu chốt đã viết được giữ nguyên.
- **Tra riêng một tên:** `node scripts/cn-hero.mjs 辛吉德 奥瑞利安·索尔`.
- **Mất mạng:** script dùng bản sao `data/cn-heroes.json` (có cảnh báo). Tướng mới ra sau lần tải cuối sẽ không có trong bản sao → báo người dùng.

### 4. Tướng còn thiếu dữ liệu
Lệnh `lane` ghi chú từng tướng:
- **"CHƯA CÓ dữ liệu"** → chạy `node scripts/fetch-champion.mjs <slug...>` (skill **them-tuong-trang-bi**).
- **"chưa đo khuôn mặt"** → thẻ tướng cắt ảnh quanh `layout.face`, thiếu thì mặt bị lệch hoặc mất. Đo như sau:
  ```bash
  node scripts/splash-grid.mjs ashe thresh            # review/splash-<slug>.png: lưới dọc + ngang
  node scripts/splash-grid.mjs ashe --face=0.575,0.27 # ghi tâm khuôn mặt x,y; dấu thập xanh = vị trí đã ghi
  ```
  1. Mở ảnh lưới bằng Read.
  2. Đọc tâm khuôn mặt: giữa hai mắt. Tướng không rõ mặt (Malphite, Fiddlesticks) thì lấy đầu hoặc miệng.
  3. Ghi bằng `--face`, rồi mở lại ảnh xem dấu thập xanh đã đúng chỗ chưa.

### 5. So sánh rồi viết câu chốt
```bash
node scripts/tierlist.mjs compare tier-2026-10-07
```
In từng đường kèm ghi chú:
- BUFF/NERF theo bản cập nhật.
- MỚI vào T0–T1, LÊN/XUỐNG bậc, chênh tỉ lệ thắng, tướng rời khỏi T0–T1 (so với kỳ trước).
- Cấm từ 50% trở lên.
- Tướng có trong bản cập nhật mà vắng mặt, trang bị và hệ thống đã đổi.
- Độ dài câu chốt, tiêu đề, ghi chú hiện tại.

Viết `verdict` từng đường, `headline`, `note` vào `tierlist.json` bằng công cụ Edit:
- 5 chỗ `"verdict": ""` giống hệt nhau → khi Edit, kèm dòng `"lane": "baron",` ở trên để chuỗi cần thay là duy nhất.
- Cách viết: xem `references/viet-cau-chot-tier.md`.

### 6. Kiểm tra, xuất ảnh, báo cáo
```bash
node scripts/audit.mjs tier-2026-10-07 --sheet   # dữ liệu + bố cục → review/tier-2026-10-07-tong-hop.png
node scripts/render.mjs tier-2026-10-07          # 3840×2160 → tierlists/<id>/out/
```
- Sửa hết `✘`, xem từng `⚠`. Lỗi hay gặp nhất: **câu chốt quá dài** → rút ngắn.
- Mở ảnh tổng hợp bằng Read để soát bố cục và khuôn mặt (mặt lệch → đo lại `--face`).
- Muốn **soát số** thì mở từng ảnh `tierlists/<id>/out/*.png`, vì ảnh tổng hợp quá nhỏ để đọc số.
- Script in "⚠ Server ở cổng 5173 đang chạy code cũ" thì vẫn chạy bình thường (tự dùng server riêng). Chỉ cần nhắc người dùng tắt `start.bat` rồi mở lại.
- Báo cáo ngắn, gồm:
  - bảng số liệu (nếu chưa gửi ở bước 1);
  - tướng mới vừa tải;
  - `patch` và `previous` đã dùng;
  - câu chốt là bản nháp, sửa được trong `tierlist.json`;
  - chỗ phải đoán.
- Gửi ảnh tổng hợp; trên trang quản lý vào mục **Tier List** → bấm Làm mới. Không commit/push trừ khi được yêu cầu.

## Giới hạn mẫu ảnh
- Mỗi đường có **0–3 tướng T0**:
  - 0 T0: ô "KHÔNG CÓ T0".
  - 1 T0: thẻ rộng + 3 ô nổi bật + câu chốt.
  - 2 T0: 2 thẻ, chữ câu chốt nhỏ hơn.
  - 3 T0: 3 thẻ, chỉ còn câu chốt.
- Mỗi đường **tối đa 7 tướng T1**.
- Vượt giới hạn thì audit báo lỗi. Đã hỏi người dùng ở bước 1; đừng tự sửa CSS.
- Số "N TƯỚNG T0/T1" ở ảnh tổng quan đếm theo tướng: một tướng xuất hiện ở 2 đường chỉ tính 1.

## Thiết kế đã chốt — đừng đổi
- Khổ 16:9, xuất 3840×2160. Không còn bản 1920×1080.
- Thanh trên: logo META RADAR + TikTok @meta.radar đứng trước, logo Tốc Chiến đứng sau.
- Ảnh tổng quan: 5 cột × 3 thẻ; thẻ chỉ ghi tên + %, không có chữ "THẮNG"; có ô ghi chú vàng khi có `note`.
- Icon 5 đường nằm ở `src/js/lib/lane-icons.js`. Icon Rừng và Hỗ trợ dò từ icon chính thức người dùng gửi.
- T0 màu tím, T1 màu vàng.
- Chân ảnh ghi nguồn dữ liệu.

Muốn đổi thiết kế → hỏi người dùng, rồi so pixel như skill **kiem-tra-anh-patch**.
