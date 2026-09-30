# 02 — Nguồn dữ liệu & hình ảnh

> Tất cả dưới đây **đã được kiểm tra thực tế** ngày 30/09/2026 bằng cách tải trang và phân tích dữ liệu.

## 1. Đánh giá các nguồn

| Nguồn | Là game nào? | Có gì | Kết luận |
|---|---|---|---|
| [wildrift.leagueoflegends.com/vi-vn/champions](https://wildrift.leagueoflegends.com/vi-vn/champions/) | ✅ **Tốc Chiến** (chính thức) | 142 tướng, chân dung, skin 1280×720, icon + tên skill tiếng Việt, video skill | ⭐ **Nguồn chính** |
| [wildrift.leagueoflegends.com/vi-vn/news/game-updates](https://wildrift.leagueoflegends.com/vi-vn/news/game-updates/) | ✅ **Tốc Chiến** (chính thức) | Patch notes tiếng Việt, **dữ liệu cấu trúc** cho phần thay đổi tướng | ⭐ **Nguồn số liệu** |
| [leagueoflegends.com/vi-vn/champions](https://www.leagueoflegends.com/vi-vn/champions/) | ⚠️ LMHT **PC** | Ảnh + skill bản PC | Không dùng: skill, số liệu, tên gọi khác Tốc Chiến |
| [ggmeo.com/champions](https://ggmeo.com/champions) | ⚠️ LMHT **PC** (ảnh ở `/images/lmht/`, skill `Ahri_P.png`) | Icon skill PC, bảng ngọc PC | ❌ **Không dùng** — xem cảnh báo bên dưới |
| [LoL Wiki — WR item icons](https://wiki.leagueoflegends.com/en-us/Category:WR_item_icons) | ✅ Tốc Chiến | Icon trang bị 128×128 | Nguồn icon trang bị (chặn bot → tải tay) |
| [Fandom — WR item icons](https://leagueoflegends.fandom.com/wiki/Category:WR_item_icons) | ✅ Tốc Chiến | Như trên + icon cũ | Dự phòng (chặn bot → tải tay) |
| Riot Data Dragon (`ddragon.leagueoflegends.com`) | ⚠️ LMHT PC | Icon trang bị PC, truy cập tự do | Dự phòng cuối. Thiếu các trang bị riêng của Tốc Chiến (vd Súng Từ Trường) |

### ⚠️ Cảnh báo về ggmeo.com
- Mã nguồn trang chứa **hàng trăm đường link tới các trang cá cược** (188bet, 789club, b52, bin88…). Các link được **mã hoá dạng `&#x68;&#x74;…`** để giấu khỏi người xem.
- Đây là dấu hiệu của trang SEO bẩn. Gắn link hoặc lấy ảnh từ đó có thể khiến kênh bị liên kết với cờ bạc (Facebook/TikTok có thể hạ tương tác hoặc gỡ bài).
- Dữ liệu ở đó là **bản PC**. Ví dụ: PC ghi "Lửa Hồ **Ly**", trang Tốc Chiến ghi "Lửa Hồ **Li**". Các tướng như Lee Sin, Ahri có bộ kỹ năng và số liệu Tốc Chiến khác PC.

## 2. Trang chính thức Tốc Chiến — cách lấy dữ liệu

Trang dùng Next.js. **Toàn bộ dữ liệu nằm sẵn trong HTML**, trong thẻ:

```html
<script id="__NEXT_DATA__" type="application/json"> …JSON… </script>
```

→ Chỉ cần tải HTML, đọc thẻ này, `JSON.parse` là có dữ liệu. **Không cần** trình duyệt hay đăng nhập.
Đường dẫn gốc của dữ liệu: `props.pageProps.page.blades[]`. Mỗi "blade" là một khối nội dung, phân biệt bằng trường `type`.

### 2.1 Danh sách tướng — `/vi-vn/champions/`

`blades[type = "characterCardGrid"].items[]` — **142 tướng**:

```jsonc
{
  "title": "AHRI",
  "action": { "payload": { "url": "/vi-vn/champions/ahri/" } },
  "media": {
    "url": "https://cmsassets.rgpub.io/sanity/images/dsfx7636/news_live/3a7e…-285x323.jpg?accountingTag=WR",
    "dimensions": { "width": 285, "height": 323 },
    "colors": { "primary": "#1F223E", "secondary": "#DCE5F9", "label": "#040511" }
  }
}
```

→ **Ảnh chân dung 285×323**: dùng cho ô tướng trong **ảnh tổng quan**.

### 2.2 Trang từng tướng — `/vi-vn/champions/{slug}/`

| Blade `type` | Chứa gì | Dùng cho |
|---|---|---|
| `characterMasthead` | `title` = "AHRI", `subtitle` = "Hồ Li Chín Đuôi" (danh hiệu), `role.roles[]` = PHÁP SƯ, SÁT THỦ, `difficulty` (1–3) | Tên + danh hiệu + vai trò trên ảnh chi tiết |
| `iconTab` | **5 kỹ năng**: `content.subtitle` = `NỘI TẠI` / `1` / `2` / `3` / `CHIÊU CUỐI`, `content.title` = **tên skill tiếng Việt**, `thumbnail.url` = **icon 96×96**, `content.description` = mô tả, `content.media` = **video mp4 demo skill** | Icon + tên skill trên ảnh chi tiết |
| `landingMediaCarousel` | Danh sách skin: `label` = tên skin, `thumbnail.url` = **ảnh 1280×720**. Phần tử đầu tiên = skin mặc định | **Ảnh nền / splash** của ảnh chi tiết |

Ví dụ thực tế — Ahri:

```
NỘI TẠI     | Hút Hồn           | icon …e7995a2c…-96x96.jpg
1           | Quả Cầu Ma Thuật  | icon …1c89cb84…-96x96.jpg
2           | Lửa Hồ Li         | icon …04bd0ccb…-96x96.jpg
3           | Hôn Gió           | icon …01f4f879…-96x96.jpg
CHIÊU CUỐI  | Phi Hồ            | icon …89d14ca6…-96x96.jpg
Skin: 13 ảnh, đầu tiên "AHRI, HỒ LI CHÍN ĐUÔI"
```

> 📝 Tốc Chiến đặt tên chiêu là **Nội tại / Chiêu 1 / Chiêu 2 / Chiêu 3 / Chiêu cuối**, không dùng Q/W/E/R như PC. Ảnh nên dùng đúng cách gọi này cho quen với người chơi Tốc Chiến.

### 2.3 Patch notes — `/vi-vn/news/game-updates/{bài-viết}`

Danh sách bài: `blades[type = "articleCardGrid"].items[]` gồm `title`, `publishedAt`, `action.payload.url`.

Trong một bài patch notes:

| Blade `type` | Nội dung |
|---|---|
| `articleMasthead` | Tiêu đề, ngày đăng, banner |
| `articleRichText` (đầu) | Lời mở đầu |
| **`characterChanges`** | ⭐ **Thay đổi tướng — dữ liệu cấu trúc** |
| `articleRichText` (giữa) | Trang bị, ngọc, lối chơi — **dạng HTML** (tiêu đề + đoạn văn + danh sách) |
| `articleRichText` (cuối) | Sửa lỗi |

Cấu trúc `characterChanges.characters[]` (ví dụ thật, patch 7.2b):

```jsonc
{
  "character": {
    "name": "JAYCE",
    "role": { "label": "ĐẤU SĨ/XẠ THỦ" },
    "media": { "url": "…-800x200.jpg", "colors": { "primary": "#38221C", … } }  // banner ngang
  },
  "summary": { "body": "<p>Jayce đã trở nên quá cứng cáp trong giai đoạn đi đường…</p>" }, // LÝ DO của Riot
  "changes": [
    { "title": "Chỉ Số Cơ Bản",
      "description": { "body": "<ul><li>Giáp Cơ Bản: 46 → 37</li></ul>" } }
  ]
}
```

Patch 7.2b có **10 tướng**: Jayce, Nidalee, Ambessa, Aurora, Sona, Ekko, Kayle, Hecarim, Lee Sin, Zilean.
Ngoài ra (phần HTML) có **5 trang bị**: Găng Tay Băng Giá, Vọng Âm Luden, Súng Từ Trường, Nỏ Thần Dominik, Đoản Đao Navori. Có thêm **1 ngọc** (Nhà Thực Vật Học), thay đổi hệ thống tiền thưởng và chế độ chơi.

> ⚠️ **Phần trang bị/ngọc là HTML viết tay, không đều.** Ví dụ thực tế ở 7.2b: dòng `Sức Mạnh Công Kích: 25 → 30` của Súng Từ Trường bị đặt **chung một thẻ tiêu đề `<h4>`** với tên trang bị tiếp theo "Nỏ Thần Dominik". Bộ đọc tự động sẽ đọc sai những chỗ như vậy. Vì thế phần này **luôn cần người soát lại**. Quy tắc chung: `<h2>` là mục lớn (TRANG BỊ, NGỌC BỔ TRỢ…), `<h4>` là tên trang bị, `<p>` là lý do, `<ul><li>` là dòng thay đổi.

Các dạng dòng thay đổi gặp trong thực tế (bộ phân tích số liệu phải xử lý được hết):

```
Giáp Cơ Bản: 46 → 37                                                   ← 1 số
Hồi máu: 45/60/75/90 → 35/50/65/80                                     ← theo cấp skill
Sát Thương Cơ Bản dựa trên Máu đã mất: 20/30/40% → 10/17,5/25%         ← %, dấu phẩy thập phân kiểu VN
Sát thương: 35/65/95/125 + 30% Sức Mạnh Phép Thuật → 40/70/100/130 + 33% Sức Mạnh Phép Thuật  ← cơ bản + hệ số
Hồi chiêu: 80/70/60 giây → 80/75/70 giây                               ← đơn vị; GIẢM hồi chiêu = BUFF
Tỉ lệ Máu Đã Mất: 2% + 0,015% Sức Mạnh Phép Thuật → 3% + 0,025% …      ← hệ số lẻ
Năng Lượng Tiêu Hao: 80/85/90/95 → 70/80/90/100                        ← vừa tăng vừa giảm theo cấp
```

`summary` (lời Riot giải thích lý do) rất hữu ích: **dùng làm gợi ý để viết câu chốt**.

### 2.4 Khớp dữ liệu patch notes ↔ trang tướng

Patch notes chỉ có **tên**, không có slug hay icon skill. Cần 2 bước khớp:

**a) Tên tướng → slug** (đã kiểm tra cả 142 tướng):
- Chữ thường, bỏ `'` và `.`, đổi khoảng trắng thành `-`, đổi `&` thành `and`.
  - `LEE SIN → lee-sin`, `KAI'SA → kaisa`, `DR. MUNDO → dr-mundo`, `Nunu & Willump → nunu-and-willump`, `JARVAN IV → jarvan-iv`
- Ngoại lệ phải ghi tay: **`Ngộ Không → wukong`**. Nên có file `overrides.json` cho các trường hợp như vậy.

**b) Tên skill trong patch → icon skill:**
- Patch ghi `(Nội Tại) Rình Rập`, trang tướng ghi `Rình Rập` với ô `NỘI TẠI` → bỏ tiền tố `(Nội Tại)`.
- Patch ghi `Hộ Thể/Kiên Định`, trang tướng ghi `Hộ Thể / Kiên Định` → bỏ khoảng trắng quanh `/`.
- So sánh sau khi bỏ dấu tiếng Việt và viết thường. Không khớp thì báo để sửa tay.
- `Chỉ Số Cơ Bản` không phải skill → dùng icon riêng (tự thiết kế: khiên/kiếm).

<a id="sanity"></a>

### 2.5 Mẹo về ảnh (Sanity CDN)

- Link ảnh `cmsassets.rgpub.io/sanity/images/...` **hỗ trợ tham số resize**: `&w=192&fm=png` (đã thử: icon 96px → 192px PNG, trả về 200 OK). Tham số khác: `h`, `fit=crop`, `fm=webp|png|jpg`.
  - Phóng to **không tạo thêm chi tiết**, chỉ đỡ vỡ hình. Icon skill nên hiển thị ở khoảng **96–128px** trên canvas 1920px.
  - Splash 1280×720 hiển thị trên 1920px sẽ hơi mềm. Nên phủ gradient/làm mờ viền, không để splash chiếm toàn khung ở kích thước gốc.
- **Mỗi ảnh có sẵn `colors.primary / secondary / label`** → dùng làm **màu chủ đạo cho ảnh chi tiết** của tướng đó (viền sáng, gradient nền). Mỗi tướng sẽ có một màu riêng mà không phải chọn tay.
- Có **video mp4 demo từng skill** → nguyên liệu cho video TikTok sau này.

### 2.6 Icon trang bị

- Trang chính thức **không có** trang trang bị và patch notes **không kèm icon**.
- Cách làm: **tải tay một lần** toàn bộ icon trang bị Tốc Chiến từ LoL Wiki/Fandom về `assets/items/`. Hai trang wiki chặn tải tự động, nên mở bằng trình duyệt rồi lưu. Có khoảng 100 trang bị và rất ít khi đổi, nên chỉ tốn khoảng 30 phút.
- Đặt tên file theo tên tiếng Việt đã bỏ dấu, ví dụ `vong-am-luden.png`, `gang-tay-bang-gia.png`. Làm thêm 1 file `items.json` ánh xạ tên tiếng Việt ↔ tên tiếng Anh ↔ file.

## 3. Nguyên tắc tải dữ liệu

1. **Không gọi link ảnh trực tiếp khi render.** Tải hết về `assets/`, vì 3 lý do:
   - Render nhanh.
   - Không phụ thuộc mạng.
   - Tránh lỗi CORS khi xuất ảnh.
2. Đồng bộ danh bạ tướng **khi có tướng mới hoặc skin mới**, không cần mỗi patch. Mỗi patch chỉ cần tải bài patch notes.
3. Tải chậm, lịch sự: cách nhau khoảng 0,5–1 giây mỗi request, có đặt User-Agent. Đây là trang của Riot, đừng tải dồn dập.
4. Lưu lại **HTML/JSON gốc** của mỗi patch vào `patches/{ver}/raw/` để đối chiếu khi có người hỏi số liệu.

## 4. Pháp lý — chính sách "Legal Jibber Jabber" của Riot

Tóm tắt (nguồn: [riotgames.com/en/legal](https://www.riotgames.com/en/legal)):

| Được phép ✅ | Không được ❌ |
|---|---|
| Dùng hình ảnh tướng, skill, trang bị cho nội dung fan **miễn phí** | Thu phí xem (paywall), Patreon khoá nội dung, gọi vốn cộng đồng khi chưa có giấy phép |
| Kiếm tiền từ **quảng cáo** (quảng cáo trong video, nhà tài trợ hiển thị) | **Dùng logo, thương hiệu Riot** trong nhận diện kênh |
| Nhận donate khi livestream | **Đăng ký tên miền / tài khoản MXH có thương hiệu Riot** |
| | Chỉ sao chép nội dung có sẵn mà không có đóng góp riêng |

**Hệ quả thực tế cho kênh:**
- **Tên kênh/handle không nên có** "Wild Rift", "Tốc Chiến", "LMHT", "League"… Nên chọn tên riêng (vd "Meta Radar", "Patch Nhanh"…) và mô tả kênh nói về Tốc Chiến.
- **Không đặt logo game** lên ảnh. Dùng logo của kênh.
- Phải có **câu miễn trừ trách nhiệm**. Nguyên văn yêu cầu (tiếng Anh):
  > "[Tên kênh] was created under Riot Games' "Legal Jibber Jabber" policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project."
  - Để ở phần **giới thiệu (bio)** của trang Facebook/TikTok và cuối caption mỗi bài.
  - Trên ảnh chỉ cần 1 dòng chữ nhỏ ở chân: *"Hình ảnh © Riot Games"*.
- Phần **đóng góp riêng** (câu chốt, thiết kế, phân tích %) giúp kênh không bị coi là "sao chép".

> ⚖️ Đây là tóm tắt để tham khảo, không phải tư vấn pháp lý. Nên đọc bản gốc trước khi kiếm tiền từ kênh.
