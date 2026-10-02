---
name: tao-build
description: Tạo ảnh BUILD CAO THỦ khổ vuông 1:1 (2160×2160) cho một tướng Tốc Chiến trong dự án meta-wildrift (kênh META RADAR) từ ảnh chụp build của cao thủ trên bảng xếp hạng Tốc Chiến Trung Quốc mà người dùng gửi (popup "<tên tướng> 主模式" có 技能 / 符文 / 装备, nút 应用, tên cao thủ + 排位). Tự nhận diện trang bị, ngọc, phép bổ trợ bằng cách so icon; xếp build theo hạng cao thủ; gom vào BỘ BUILD theo ngày + vai trò (builds/build-<ngày>-<adc|top|jungle|mid|sp>/build.json, mỗi tướng 1 ảnh); tự tải tướng/trang bị còn thiếu; đồng bộ giày ở ô 6; đặt tên 3 build theo tình huống (hợp đội hình nào, khắc chế đối thủ nào); chọn 3 tướng mạnh khi gặp, 3 tướng yếu khi gặp, 3 tướng hợp; lưu tooltip trang bị; kiểm tra và xuất PNG. Dùng skill này khi người dùng gửi ảnh build / ảnh lên đồ / ảnh ngọc của tướng (kể cả nhiều tướng một lúc), ảnh tooltip trang bị, hoặc nói "làm build", "build tướng X", "lên đồ X", "build cao thủ", "build tướng hot".
---

# Tạo ảnh Build cao thủ

Mẫu ảnh đã được người dùng duyệt (`src/js/slides/build.js`, `src/css/slide-build.css`). Ví dụ hoàn chỉnh: `builds/build-2026-10-01-adc/` (6 xạ thủ: Ashe, Samira, Tristana, Senna, Yunara, Kalista), `builds/build-2026-10-02-mid/` (12 tướng, 2 ảnh tổng quan + thumbnail).

**Ảnh build chỉ có khổ VUÔNG 1:1** — khung 1080×1080, xuất 2160×2160 (người dùng chốt 02/10/2026: hợp bài đăng TikTok / Facebook; bản 16:9 đã xoá khỏi code, đừng làm lại). Ngoại lệ duy nhất: ảnh thumbnail dọc 3:4.

**Bộ build = 1 ngày + 1 vai trò** (ADC, TOP, RỪNG, MID, SP): mỗi bộ là 1 mục con trên trang quản lý (vd "01/10 · Build ADC"), gồm **1 ảnh tổng quan** (tự tạo, đứng đầu) rồi mỗi tướng 1 ảnh.
- **Ảnh tổng quan** (`build-overview`, đã duyệt): "BUILD ADC" + `headline`; lưới 3×2 thẻ, mỗi tướng 1 thẻ gồm ảnh tướng lớn, bậc + %, BUFF/NERF, tên, **CỐT LÕI** (3 món, tự tính: món có trong nhiều build nhất, không tính giày) và **MẠNH KHI GẶP** (3 avatar lấy từ `matchups.strong`). **Không** hiện ngọc · giày (người dùng bỏ để ảnh tướng hiện nhiều hơn). 6 tướng / ảnh. Khi bộ đủ tướng, viết `headline` ở gốc `build.json`: 3 cụm ngắn nối bằng ` · `, vd "6 xạ thủ đáng chơi · 3 build mỗi tướng · Theo cao thủ Trung Quốc". Người dùng muốn vậy để menu không dài ("hôm nay ADC, mai TOP"). Ảnh gốc của từng tướng nằm ở `source/<tướng>/`.

Mỗi tướng có **1 ảnh** (từ trên xuống):
- **Dải ảnh tướng:** ảnh tướng (mặt lệch phải), góc trái là nhãn đường · bậc + % thắng · BUFF/NERF và tên tướng.
- **Đối đầu:** 3 nhóm avatar nằm ngang MẠNH khi gặp · YẾU khi gặp · HỢP với… (mỗi nhóm 3 tướng).
- **BUILD 1/2/3** xếp hàng. Mỗi build gồm tên build, phần HỢP / KHẮC CHẾ, 6 icon trang bị theo thứ tự (giày luôn ở ô 6), ngọc chính và 4 ngọc phụ.

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
  - **giày khác nhau giữa các build → đổi hết sang đôi xuất hiện nhiều nhất** (người dùng đã chốt quy ước này ở cả Ashe lẫn Samira; nói lại trong báo cáo). Người dùng chỉ định đôi khác ("lấy giày của build 3") → sửa ô 6 của cả 3 build trong `build.json` bằng Edit;
  - **món có tên Trung khác bản PC** (vd 灭世者之帽, 兰德里的苦痛面具) bị lưu thành `item-<mã>` không tên dù có tên chính thức → tải lại bằng `node scripts/fetch-item.mjs "Rabadon's Deathcap" --cn=<mã>`, xoá file `item-<mã>` vừa tạo, sửa slug trong `build.json`;
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
- **Ảnh nằm trong thư mục** (người dùng nói "xem N ảnh mới nhất trong Downloads"): chép N ảnh mới nhất ra thư mục tạm, ghép ảnh thu nhỏ kèm phần tên tướng + 排位 phóng to (12 ảnh / tấm) để phân loại nhanh ảnh build / tooltip theo tướng, rồi chạy `new` từng tướng.
- **Bộ nhiều hơn 6 tướng**: script tự thêm ảnh tổng quan `overview-2`… (mỗi ảnh 6 tướng theo thứ tự `champions`, có nhãn "PHẦN 1/2"). Đổi thứ tự tướng: `node scripts/champ-build.mjs order <id> <slug> <slug> …`.
- **Trang vi-vn lỗi 404** dù tướng có trong danh sách (vd Aurora): `fetch-champion.mjs` tự lấy trang tiếng Anh (ghi `pageLocale`); ảnh build chỉ cần tên + splash nên vẫn làm được, báo người dùng. Trang vi-vn ghi sai tên (Vladimir = "ĐỎ") → thêm vào `NAME_FIX` trong `fetch-champion.mjs`.
- **Tướng chưa đo khuôn mặt** (script nhắc): dải ảnh tướng, thẻ tổng quan và avatar đều cắt theo khuôn mặt, nên đo:
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
- **Ghi nhanh bằng script** (kiểm tra tên có trong Tốc Chiến, đủ 3 tướng, không trùng; ghi luôn tên build + giày chung):
  ```bash
  node scripts/champ-build.mjs set <id> <tướng> strong=a,b,c weak=a,b,c synergy=a,b,c note="…" [label="VỚI ĐỒNG ĐỘI"] [boots=<slug giày>] b1="tên build|hợp|khắc chế" b2="…" b3="…"
  ```
- **Người dùng bảo tự tra trên mạng** ("tra google rồi bổ sung, tôi check lại sau"): chỉ chọn tướng **có trong Tốc Chiến** (lệnh `set` từ chối tướng không có, vd Xerath, Zac, Sejuani). Nguồn bản Tốc Chiến: `zathong.com/<tướng>-wild-rift-build/` (mục weak against / strong against / good with). Kết quả tìm kiếm hay lẫn số liệu bản PC (u.gg, mobalytics, lolalytics) — chỉ dùng khi không có nguồn Tốc Chiến và ghi rõ. Mạnh / yếu lấy tướng cùng đường của bộ (bộ MID → tướng đường giữa; nguồn ghi tướng đường khác thì thay bằng tướng cùng kiểu và nói rõ là phân tích). "Hợp" theo người dùng dặn (vd "hợp với tướng đi rừng nào" → 3 tướng đi rừng, nhãn mặc định). Giữ nhất quán với các tướng người dùng đã cho trong cùng bộ (Ahri mạnh khi gặp Aurelion Sol → Aurelion Sol yếu khi gặp Ahri). Ghi `note` nguồn + "cần soát lại", và báo cáo tách rõ: tướng nào theo nguồn, tướng nào là phân tích.
- **Người dùng tự cho 9 tướng** ("mạnh hơn X là…", "yếu hơn X là…", "hợp với…") → dùng đúng danh sách đó, sửa `matchups.note` thành "Theo số liệu người dùng cung cấp ngày …". Cẩn thận chiều: tướng **mạnh hơn** X = X **yếu khi gặp** (`weak`); tướng **yếu hơn** X = X **mạnh khi gặp** (`strong`). Nhóm "hợp với" không cùng một vai trò (vd Rammus + Kog'Maw + Poppy) → thêm `"synergyLabel": "VỚI ĐỒNG ĐỘI"` để nhãn không ghi sai "VỚI ĐI RỪNG".
- **Người dùng báo tỉ lệ thắng mới hơn tier list** (vd "tỉ lệ thắng của Hwei là 55.13%") → ghi `"tier": { "win": 55.13 }` trong mục của tướng (cạnh `"lane"`); bậc vẫn lấy từ tier list, thêm `"tier": "T0"` bên trong nếu người dùng nói cả bậc hoặc tướng chưa có trong tier list. `--replace` giữ nguyên trường này.
- **Người dùng không muốn nhãn nào đó** ("không cần thẻ tỉ lệ thắng / tier", "không cần buff/nerf") → thêm `"hide": ["tier"]`, `["patch"]` hoặc cả hai trong mục của tướng (cạnh `"lane"`). Áp dụng cho cả ảnh tướng lẫn ảnh tổng quan; `--replace` giữ nguyên.
- Tướng chưa có dữ liệu → `node scripts/fetch-champion.mjs <slug…>`.
- **Avatar cắt từ ảnh splash lớn quanh khuôn mặt** (ảnh chân dung trên web chỉ 285×323 nên mờ — người dùng đã chê). Mọi tướng trong 9 avatar cần `layout.face`; thiếu thì audit nhắc. Đo nhiều tướng một lúc: ghép 4 ảnh lưới / tấm cho đỡ tốn lượt đọc, hoặc `splash-grid.mjs <slug…>` rồi `--face=x,y` từng tướng; soát lại avatar trong ảnh xuất (vd Kog'Maw cần lấy mắt + miệng, không phải đỉnh đầu).
- **Cắt sát mặt mà khó nhận ra tướng** (người dùng đã chê Nunu & Willump khi chỉ thấy mặt người tuyết) → đặt khung avatar riêng: `node scripts/splash-grid.mjs <slug> --avatar=<x>,<y>,<zoom>` (tâm khung, zoom < 1 = lấy rộng hơn; vd Nunu `0.66,0.55,0.62` để thấy cả cậu bé lẫn Willump). Ô nét đứt xanh lá trên ảnh lưới là khung avatar; `--avatar=none` để bỏ.

### 5. Ảnh tooltip → lưu `summary` (không làm ảnh)
Người dùng không muốn ảnh giải thích trang bị, nhưng **giữ dữ liệu** để dùng sau. Với mỗi tooltip, ghi `summary` vào `data/items/<slug>.json` bằng Edit (định dạng ở `references/viet-build.md`).
- Món đã có `summary`: **cập nhật nếu chỉ số / nội tại khác** (sửa `source` sang ngày mới); giống hệt thì để nguyên.
- Không sửa `stats` tải từ CN (có thể đã cũ); tooltip mới là số mới nhất.

### 6. Kiểm tra, xuất ảnh, báo cáo
```bash
node scripts/audit.mjs build-<yyyy-mm-dd>-<vai trò> [--sheet]     # cả bộ: dữ liệu + bố cục từng ảnh (--sheet: thêm review/<id>-tong-hop.png)
node scripts/render.mjs build-<yyyy-mm-dd>-<vai trò> [ảnh…]         # 2160×2160 → builds/<id>/out/ (chỉ tướng vừa thêm: ghi slug)
```
- Thêm tướng mới (hoặc đổi build làm đổi món cốt lõi / đổi 3 tướng "mạnh khi gặp") thì xuất lại cả ảnh tổng quan chứa tướng đó (`overview`, `overview-2`…).
- **Trang quản lý chỉ để xem** (không còn nút tải PNG / ZIP / mở tab mới — người dùng bỏ 02/10/2026): ảnh người dùng đem đăng là file trong `builds/<id>/out/`, nên sửa gì xong cũng phải chạy `render.mjs`.
- Sửa hết `✘`: hay gặp thiếu `title` / `team` / `enemy`, matchups chưa đủ 3, chữ tràn.
- **Mở ảnh trong `builds/<id>/out/` bằng Read** để soát:
  - dải ảnh trên cùng: đúng tướng, thấy mặt, tên không che mặt;
  - chữ thanh trên đọc được;
  - giày ở ô 6;
  - đúng thứ tự build.

  Ảnh tổng hợp `--sheet` chỉ cần khi làm / soát cả bộ.
- Script in "⚠ Server ở cổng 5173 đang chạy code cũ" thì vẫn chạy bình thường; chỉ cần nhắc người dùng tắt `start.bat` rồi mở lại.
- **Báo cáo ngắn**, gồm:
  - 3 build (hạng · tên · món đầu);
  - chỗ đã đồng bộ / sửa (giày, ô viền đỏ);
  - 9 tướng đối đầu kèm lý do mỗi nhóm, **ghi rõ là phân tích**;
  - trang bị / tướng mới tải, tên tạm dịch cần xác nhận;
  - món đã lưu `summary`.

  Gửi ảnh xuất. Trên trang quản lý: mục **Build** → Làm mới (xem trước) · **Mở thư mục ảnh** (file PNG). Không commit/push trừ khi được yêu cầu.

## Ảnh thumbnail (ảnh bìa clip TikTok) của bộ
Người dùng xin "ảnh thumbnail" cho bài đăng của bộ → thêm vào **cuối** `slides` trong `build.json`:
```json
{ "id": "thumbnail", "type": "build-cover", "title": "Thumbnail", "headline": "3 build mỗi tướng · Lên đồ + ngọc · Khắc chế" }
```
- **Khổ dọc 3:4, xuất 2160×2880** (khung 1080×1440, `COVER_CANVAS` trong `src/js/lib/output.js`) — đúng tỉ lệ ô ảnh trên lưới trang cá nhân TikTok. Người dùng đã chốt: lần đầu làm 16:9 thì ô trên lưới bị cắt mất hai bên ("nhầm kích thước rồi"). Đây là ảnh duy nhất trong bộ build không vuông.
- Mẫu `build-cover` (`renderBuildCover`): nửa đầu bộ là khối ảnh tướng cắt xéo phía trên (2 hàng × 3), nửa sau phía dưới, giữa là dải tiêu đề: thương hiệu + ngày + bản, "BUILD <vai trò>" thật to, nhãn vàng "<N> TƯỚNG", "<số build> BUILD / CAO THỦ TRUNG QUỐC" (`tagline` để đổi), dòng chữ chạy (`headline` của ảnh bìa, tổng ≤ ~45 ký tự; không ghi thì lấy `headline` của bộ).
- Xuất: `render.mjs <id> thumbnail`. Ảnh bìa không có chân ảnh và **không tính vào số trang** "NN / tổng" của các ảnh khác; để cuối `slides` thì tên file các ảnh khác không đổi số.

## Bố cục khổ vuông (đã chốt 02/10/2026)
Mẫu `renderBuild` / `renderBuildOverview` trong `src/js/slides/build.js` + `src/css/slide-build.css` (khung 1080×1080), xem bằng `slide.html?patch=<id>&slide=<ảnh>`. Người dùng chọn sau khi xem 7 mẫu ("không đơn thuần là responsive… đặt cái tâm vào"):
- **Ảnh tướng:** dải ảnh tướng phía trên (nhãn + tên ở góc trái), 3 nhóm đối đầu nằm ngang, 3 build xếp hàng (6 trang bị + ngọc).
  - Mặt tướng nằm hẳn bên trái splash (vd Morgana — bên phải là Kayle) thì dải ảnh tự **lật ngang** để mặt sang phải; mặt nằm giữa thì tên tự co cho khỏi che mặt. Soát dải ảnh của tướng mới: đúng tướng, thấy mặt.
- **Ảnh tổng quan:** lưới 3×2 thẻ đứng, ảnh tướng lớn + **CỐT LÕI** + **MẠNH KHI GẶP**. **Không** hiện ngọc · giày. Nhãn "CỐT LÕI": 2 chữ cùng một kiểu.
- `audit.mjs` soát riêng cho khung vuông (`checkSquare`): tràn ngang / dọc, icon lọt khỏi thẻ, khối đè thanh trên / chân ảnh / đè nhau, chữ co dưới 13px.

## Thiết kế đã chốt — đừng đổi
- Nhãn **BUILD 1/2/3** (không ghi "Top N cao thủ").
- Không có dòng "3 build của top cao thủ…", bảng chú thích ngọc hay ô CHỐT.
- Hàng build chỉ có icon trang bị (không tên, không nhãn MỚI) + ngọc. Không hiện phép bổ trợ (vẫn lưu trong dữ liệu).
- **Mọi ngọc đều có viền màu của build** (build 1 xanh, 2 vàng, 3 tím) — không chỉ viền ngọc khác build 1 như trước; người dùng: "tô thì tô hết".
- **Giày luôn ở ô 6, và cùng một đôi ở cả 3 build.**
- Đầu thẻ build chia 40% tên build / 60% HỢP + KHẮC CHẾ, thẳng cột giữa 3 thẻ.
- Đối đầu: 3 nhóm avatar × 3 tướng, chỉ có avatar (không tên).
- Nhãn trên tên tướng: đường · bậc + % thắng (chỉ khi tướng có trong tier list; không ghi chữ "thắng") · "▲ BUFF / ▼ NERF <bản>" (tự lấy từ bản cập nhật nếu tướng có thay đổi). Tướng chưa vào tier list (vd vừa buff, tỉ lệ thắng còn thấp) thì chỉ có nhãn đường + BUFF/NERF.
- Không làm ảnh giải thích trang bị (người dùng không muốn); chỉ lưu `summary` trong `data/items` để dành.

Muốn đổi thiết kế → hỏi người dùng, so pixel như skill **kiem-tra-anh-patch**.
