---
name: tao-build
description: Tạo ảnh BUILD CAO THỦ 16:9 (3840×2160) cho một tướng Tốc Chiến trong dự án meta-wildrift (kênh META RADAR) từ ảnh chụp build của cao thủ trên bảng xếp hạng Tốc Chiến Trung Quốc mà người dùng gửi (popup "<tên tướng> 主模式" có 技能 / 符文 / 装备, nút 应用, tên cao thủ + 排位). Tự nhận diện trang bị, ngọc, phép bổ trợ bằng cách so icon; xếp build theo hạng cao thủ; gom vào BỘ BUILD theo ngày + vai trò (builds/build-<ngày>-<adc|top|jungle|mid|sp>/build.json, mỗi tướng 1 ảnh); tự tải tướng/trang bị còn thiếu; đồng bộ giày ở ô 6; đặt tên 3 build theo tình huống (hợp đội hình nào, khắc chế đối thủ nào); chọn 3 tướng mạnh khi gặp, 3 tướng yếu khi gặp, 3 tướng hợp; lưu tooltip trang bị; kiểm tra và xuất PNG. Dùng skill này khi người dùng gửi ảnh build / ảnh lên đồ / ảnh ngọc của tướng (kể cả nhiều tướng một lúc), ảnh tooltip trang bị, hoặc nói "làm build", "build tướng X", "lên đồ X", "build cao thủ", "build tướng hot".
---

# Tạo ảnh Build cao thủ

Mẫu ảnh đã được người dùng duyệt (`src/js/slides/build.js`, `src/css/slide-build.css`). Ví dụ hoàn chỉnh: `builds/build-2026-10-01-adc/` (6 xạ thủ: Ashe, Samira, Tristana, Senna, Yunara, Kalista).

**Bộ build = 1 ngày + 1 vai trò** (ADC, TOP, RỪNG, MID, SP): mỗi bộ là 1 mục con trên trang quản lý (vd "01/10 · Build ADC"), gồm **1 ảnh tổng quan** (tự tạo, đứng đầu) rồi mỗi tướng 1 ảnh.
- **Ảnh tổng quan** (`build-overview`, đã duyệt): "BUILD ADC" + `headline`; mỗi tướng 1 cột gồm ảnh tướng, bậc + %, BUFF/NERF, 3 món cốt lõi (tự tính: món có trong nhiều build nhất, không tính giày), ngọc chính, giày, 3 avatar "mạnh khi đối đầu với" (lấy từ `matchups.strong`). Vừa nhất ≤ 6 tướng. Khi bộ đủ tướng, viết `headline` ở gốc `build.json`: 3 cụm ngắn nối bằng ` · `, vd "6 xạ thủ đáng chơi · 3 build mỗi tướng · Theo cao thủ Trung Quốc". Người dùng muốn vậy để menu không dài ("hôm nay ADC, mai TOP"). Ảnh gốc của từng tướng nằm ở `source/<tướng>/`.

Mỗi tướng có **1 ảnh**:
- **Bên trái:** ảnh tướng, đường, bậc trong tier list, và 3 nhóm avatar MẠNH khi gặp · YẾU khi gặp · HỢP với… (mỗi nhóm 3 tướng).
- **Bên phải:** BUILD 1/2/3. Mỗi build gồm tên build, phần HỢP / KHẮC CHẾ, 6 icon trang bị theo thứ tự (giày luôn ở ô 6), ngọc chính và 4 ngọc phụ.

Việc của bạn:
1. Đọc đúng build bằng script.
2. Viết tên build và tình huống.
3. Chọn 9 tướng đối đầu.
4. Lưu tooltip.
5. Kiểm tra và xuất ảnh.

Người dùng nhắn tiếng Việt rất thân mật ("tao", "fen"). Trả lời thân thiện, xưng "mình – bạn".

## Quy trình

### 1. Phân loại ảnh người dùng gửi
- **Ảnh build:** popup có tên tướng tiếng Trung + 主模式 ở trên, 3 hàng 技能 (phép bổ trợ) · 符文 (ngọc) · 装备 (trang bị), nút 应用. Bên trái là tên cao thủ và **排位: N (hạng)**.
  - Đọc hạng của từng ảnh. Build xếp **theo hạng tăng dần**: BUILD 1 = hạng cao nhất. Người dùng đã yêu cầu "sắp xếp build 1 2 3 theo top".
  - Tên cao thủ và hạng **không** in lên ảnh.
- **Ảnh tooltip:** khung chi tiết một món, gồm tên, chỉ số xanh lá, nội tại, nhãn 新装备 (món mới) / 调整 (vừa chỉnh). Chụp đè lên popup nên vẫn thấy hạng ở góc dưới bên trái; tooltip có thể chụp từ cao thủ không nằm trong 3 build, không sao.
- **Người dùng có thể chỉ không chụp** món đã có từ build trước ("vô cực… có rồi"). Không cần đòi thêm tooltip.
- **Gom ảnh build theo tướng** (người dùng có thể gửi nhiều tướng một lúc). Mỗi tướng **1–3 ảnh build**:
  - Nhiều hơn 3 ảnh → chọn 3 build khác nhau nhất, nói rõ đã bỏ ảnh nào.
  - 2 ảnh trùng hệt nhau → báo người dùng.
- **Ngày:** hôm nay, trừ khi người dùng nói ngày khác.
- **Làm theo yêu cầu riêng của người dùng trong tin nhắn**, vd "dùng giày của top 1 cho top 4".

### 2. Tạo build từ ảnh
```bash
node scripts/champ-build.mjs new <tên tướng tiếng Trung> <yyyy-mm-dd> top<N>=<ảnh> top<N>=<ảnh> top<N>=<ảnh> tip=<ảnh tooltip> tip=… [--role=adc|top|jungle|mid|sp]
```
- `<tên tướng>`: y như trong ảnh (vd 莎弥拉), hoặc tên tiếng Anh / slug.
- `top<N>=`: ảnh build của cao thủ hạng N, thứ tự gõ không quan trọng. `tip=`: ảnh tooltip, chỉ chép vào `source/<tướng>/` để lưu.
- Script **thêm tướng vào bộ** `build-<ngày>-<vai trò>` (tạo bộ nếu chưa có); thứ tự ảnh trong bộ = thứ tự thêm. Vai trò mặc định theo đường tỉ lệ chọn cao nhất trong tier list; người dùng nói rõ ("senna đường rồng", "làm TOP") thì dùng `--role=`. Tướng đã có trong bộ → script từ chối; làm lại build thì `--replace` (giữ 9 tướng đối đầu đã viết).
- Nhiều tướng một lúc: chạy lần lượt từng tướng, cùng ngày → vào cùng bộ.
- Đường dẫn ảnh hiện trong tin nhắn người dùng.
- Script sẽ:
  - so từng icon với icon chính thức máy chủ CN;
  - **tự tải** tướng / trang bị chưa có;
  - xếp **giày vào ô 6**;
  - **giày khác nhau giữa các build → đổi hết sang đôi xuất hiện nhiều nhất** (người dùng đã chốt quy ước này ở cả Ashe lẫn Samira; nói lại trong báo cáo);
  - tự chọn bản cập nhật, tier list, **đường** (đường có tỉ lệ chọn cao nhất của tướng trong tier list);
  - **từ chối nếu ảnh trùng ảnh của build đã làm**. Người dùng gửi lại ảnh cũ → hỏi làm lại hay sửa bộ cũ. Chắc chắn làm lại thì thêm `--allow-duplicate`.
- **Tướng chơi nhiều đường** (vd Senna Rồng / Hỗ trợ): xem build là đồ xạ thủ hay đồ hỗ trợ, hoặc theo lời người dùng, rồi dùng `--role=adc` / `--role=sp`.
- **Mở `review/build-read-<slug>.png` bằng Read.** Mỗi ô có ảnh cắt · icon khớp · độ lệch; ô viền đỏ là chưa chắc, phải soát bằng mắt.
  - Ngọc chính trong game có khung trang trí nên hay lệch cao (40–70) mà vẫn đúng.
  - Sai thì sửa `build.json` bằng Edit (mã ngọc xem `data/runes.json`, slug trang bị xem `data/items/`).
  - Màn hình khác bố cục (icon lệch hẳn) → báo người dùng.
- **Trang bị chỉ Tốc Chiến có** (không có tên Anh / Việt, slug `item-<mã>`): ghi vào `data/items/item-<mã>.json` bằng Edit:
  - `name` / `nameVi` tạm dịch + `"nameTemp": true`;
  - `"tags"` có `"Giày"` nếu là giày;
  - báo người dùng để xác nhận tên.
- **Tướng chưa đo khuôn mặt** (script nhắc): ảnh nền bên trái cắt theo khuôn mặt, nên đo:
  ```bash
  node scripts/splash-grid.mjs <slug>                  # mở review/splash-<slug>.png, đọc tâm khuôn mặt
  node scripts/splash-grid.mjs <slug> --face=<x>,<y>
  ```

### 3. Viết tên build + tình huống
Mỗi build cần `title` (lối chơi), `team` (hợp đội hình nào của mình), `enemy` (khắc chế đối thủ kiểu gì). Ghi vào mục của tướng trong `champions` của `builds/<id>/build.json` (Edit: kèm dòng `"champion": "<slug>"` gần đó để chuỗi cần thay là duy nhất); cách suy từ trang bị, độ dài và ví dụ đã duyệt xem `references/viet-build.md`. 3 build phải đọc lên thấy **khác nhau**.

### 4. Chọn 9 tướng đối đầu
`matchups.strong` (mạnh khi gặp) · `matchups.weak` (yếu khi gặp) · `matchups.synergy` (hợp với) trong mục của tướng, **mỗi nhóm đúng 3 slug**. Audit cảnh báo khi 2 tướng trong bộ trùng hệt bộ 3 "hợp với". Ảnh chỉ hiện avatar, không tên.
- Cách chọn xem `references/viet-build.md`.
- Nhãn "HỢP với …" tự đổi theo đường.
- Không có số liệu đối đầu đáng tin (cột 对位情况 trên bảng xếp hạng chỉ là đối thủ hay gặp + tỉ lệ thắng **của đối thủ**). Vì vậy 9 tướng là **phân tích của bạn**; giữ `matchups.note` và nói rõ trong báo cáo. Người dùng gửi số liệu khắc chế (克制 / 被克制 / 搭档) thì dùng số liệu đó.
- Tướng chưa có dữ liệu → `node scripts/fetch-champion.mjs <slug…>`.
- **Avatar cắt từ ảnh splash lớn quanh khuôn mặt** (ảnh chân dung trên web chỉ 285×323 nên mờ — người dùng đã chê). Mọi tướng trong 9 avatar cần `layout.face`; thiếu thì audit nhắc. Đo nhiều tướng một lúc: ghép 4 ảnh lưới / tấm cho đỡ tốn lượt đọc, hoặc `splash-grid.mjs <slug…>` rồi `--face=x,y` từng tướng; soát lại avatar trong ảnh xuất (vd Kog'Maw cần lấy mắt + miệng, không phải đỉnh đầu).

### 5. Ảnh tooltip → lưu `summary` (không làm ảnh)
Người dùng không muốn ảnh giải thích trang bị, nhưng **giữ dữ liệu** để dùng sau. Với mỗi tooltip, ghi `summary` vào `data/items/<slug>.json` bằng Edit (định dạng ở `references/viet-build.md`).
- Món đã có `summary`: **cập nhật nếu chỉ số / nội tại khác** (sửa `source` sang ngày mới); giống hệt thì để nguyên.
- Không sửa `stats` tải từ CN (có thể đã cũ); tooltip mới là số mới nhất.

### 6. Kiểm tra, xuất ảnh, báo cáo
```bash
node scripts/audit.mjs build-<yyyy-mm-dd>-<vai trò>               # cả bộ: dữ liệu + bố cục từng tướng
node scripts/render.mjs build-<yyyy-mm-dd>-<vai trò> [tướng…]       # 3840×2160 → builds/<id>/out/ (chỉ tướng vừa thêm: ghi slug)
```
- Sửa hết `✘`: hay gặp thiếu `title` / `team` / `enemy`, matchups chưa đủ 3, chữ tràn.
- **Mở ảnh trong `builds/<id>/out/` bằng Read** để soát:
  - khuôn mặt;
  - chữ thanh trên đọc được;
  - giày ở ô 6;
  - đúng thứ tự build.

  Ảnh tổng hợp `--sheet` không cần cho build (chỉ 1 ảnh).
- Script in "⚠ Server ở cổng 5173 đang chạy code cũ" thì vẫn chạy bình thường; chỉ cần nhắc người dùng tắt `start.bat` rồi mở lại.
- **Báo cáo ngắn**, gồm:
  - 3 build (hạng · tên · món đầu);
  - chỗ đã đồng bộ / sửa (giày, ô viền đỏ);
  - 9 tướng đối đầu kèm lý do mỗi nhóm, **ghi rõ là phân tích**;
  - trang bị / tướng mới tải, tên tạm dịch cần xác nhận;
  - món đã lưu `summary`.

  Gửi ảnh xuất. Trên trang quản lý: mục **Build** → Làm mới. Không commit/push trừ khi được yêu cầu.

## Thiết kế đã chốt — đừng đổi
- Nhãn **BUILD 1/2/3** (không ghi "Top N cao thủ").
- Bên trái không có dòng "3 build của top cao thủ…", bảng ngọc hay ô CHỐT.
- Hàng build chỉ có icon trang bị (không tên, không nhãn MỚI) + ngọc. Không hiện phép bổ trợ (vẫn lưu trong dữ liệu).
- **Giày luôn ở ô 6, và cùng một đôi ở cả 3 build.**
- Đầu thẻ build chia 40% tên build / 60% HỢP + KHẮC CHẾ, thẳng cột giữa 3 thẻ.
- Bên trái: 3 nhóm avatar × 3 tướng, chỉ có avatar.
- Nhãn trên tên tướng: đường · bậc + % thắng (chỉ khi tướng có trong tier list; không ghi chữ "thắng") · "▲ BUFF / ▼ NERF <bản>" (tự lấy từ bản cập nhật nếu tướng có thay đổi). Tướng chưa vào tier list (vd vừa buff, tỉ lệ thắng còn thấp) thì chỉ có nhãn đường + BUFF/NERF.
- Ảnh giải thích trang bị (`build-items`) có sẵn trong code nhưng không đưa vào bộ ảnh.

Muốn đổi thiết kế → hỏi người dùng, so pixel như skill **kiem-tra-anh-patch**.
