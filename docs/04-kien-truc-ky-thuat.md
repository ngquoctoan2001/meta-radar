# 04 — Kiến trúc kỹ thuật

## 1. Nguyên tắc

1. **Tách dữ liệu khỏi giao diện.** Mỗi patch là **1 file JSON**, còn template HTML chỉ đọc JSON rồi vẽ. Đổi số liệu không phải sửa HTML, đổi giao diện không phải nhập lại số.
2. **Máy làm phần lặp lại, người làm phần có giá trị.** Máy lấy số liệu, ảnh, tính chênh lệch, đoán buff/nerf. Người duyệt trạng thái và viết câu chốt.
3. **Không phụ thuộc mạng lúc render.** Ảnh và font đều nằm sẵn trong máy.
4. **Ít phụ thuộc thư viện.** Frontend dùng HTML/CSS/JS thuần. Chỉ có 1 thư viện Node dùng để chụp ảnh (Playwright).

## 2. Chọn công nghệ

| Hạng mục | Chọn | Lý do / phương án khác |
|---|---|---|
| Template | **HTML + CSS thuần (biến CSS) + JS thuần (ES modules)** | Ít template, thiết kế tuỳ biến nhiều (gradient, `clip-path`, `mask`), viết CSS trực tiếp sẽ rõ ràng hơn |
| CSS nâng cao | *Tuỳ chọn:* SCSS hoặc Tailwind CLI bản standalone | Tailwind lấy từ CDN thì cần mạng lúc render. Nếu thích Tailwind, dùng **Tailwind CLI standalone** (1 file .exe, không cần npm) để build ra CSS tĩnh |
| Chụp ảnh | **Playwright** (Node.js) | Chụp bằng Chrome thật nên đúng từng pixel, chờ được font và ảnh tải xong |
| Trình duyệt để chụp | **Microsoft Edge có sẵn trên Windows** (`channel: 'msedge'`) | Không phải tải thêm Chromium (~150MB) |
| Lấy dữ liệu | Node.js `fetch` có sẵn (Node 18+) | Máy đã có **Node v24** |
| Server xem thử | Script Node nhỏ (`node:http`) hoặc `python -m http.server` | Trang dùng `fetch()` đọc JSON nên cần http://, mở kiểu file:// sẽ lỗi |

### ❌ Vì sao không dùng html2canvas / dom-to-image (chụp ngay trong trình duyệt)?
- Nhiều CSS không được hỗ trợ: `filter`, `backdrop-filter`, `mix-blend-mode`, `mask`, một số gradient.
- Vẽ font sai, lệch dòng tiếng Việt có dấu.
- Gặp lỗi **CORS** khi ảnh nằm ở domain khác.

→ Playwright chụp đúng những gì bạn thấy trên Chrome.

> 🔧 **Phương án không cần cài gì:** dùng Edge headless bằng dòng lệnh:
> `msedge --headless --screenshot=out.png --window-size=1920,1080 "http://localhost:5173/..."`.
> Cách này không có tín hiệu báo trang đã sẵn sàng, dễ chụp khi ảnh chưa tải xong → chỉ nên dùng để thử nhanh.

## 3. Cấu trúc thư mục

```
meta-wildrift/
├─ README.md
├─ docs/                          ← tài liệu này
├─ package.json                   ← chỉ 1 thư viện: playwright (hoặc playwright-core)
│
├─ data/
│  ├─ champions.json              ← danh bạ 142 tướng (tạo tự động)
│  ├─ items.json                  ← danh bạ trang bị: tên VN, tên EN, file icon
│  └─ overrides.json              ← sửa tay: slug đặc biệt, vị trí cắt splash, tên skill lệch
│
├─ assets/
│  ├─ champions/{slug}/
│  │   ├─ portrait.jpg            ← 285×323 (ảnh tổng quan)
│  │   ├─ splash.jpg              ← 1280×720 skin mặc định (ảnh chi tiết)
│  │   └─ skill-p.jpg, skill-1.jpg, skill-2.jpg, skill-3.jpg, skill-r.jpg   ← 96×96
│  ├─ items/{ten-khong-dau}.png   ← tải tay 1 lần
│  ├─ icons/                      ← icon tự làm: chỉ số cơ bản, mũi tên, trạng thái
│  ├─ fonts/                      ← Oswald, Be Vietnam Pro, Barlow Condensed (.woff2)
│  └─ brand/                      ← logo kênh
│
├─ patches/
│  └─ 7.2b/
│     ├─ raw/                     ← HTML + JSON gốc của patch notes (để đối chiếu)
│     ├─ patch.json               ← dữ liệu đã chuẩn hoá + phần bạn biên tập
│     └─ out/
│        ├─ 16x9/ 00-cover.png, 01-overview.png, 02-lee-sin.png, …
│        └─ 9x16/ …
│
├─ templates/
│  ├─ slide.html                  ← 1 trang = 1 ảnh:  ?patch=7.2b&slide=lee-sin&format=16x9
│  ├─ studio.html                 ← xem cả bộ ảnh thu nhỏ trên 1 trang để duyệt nhanh
│  ├─ css/
│  │   ├─ tokens.css              ← màu, font, khoảng cách (biến CSS)
│  │   ├─ base.css
│  │   ├─ cover.css, overview.css, detail.css, items.css, summary.css
│  │   └─ format-9x16.css         ← chỉ ghi đè bố cục cho bản dọc
│  └─ js/
│     ├─ slide.js                 ← đọc query → tải patch.json → chọn template → vẽ
│     ├─ templates/*.js           ← mỗi loại ảnh 1 hàm trả về HTML (template literal)
│     ├─ parse-change.js          ← bộ phân tích dòng "cũ → mới" (dùng chung với Node)
│     └─ autofit.js               ← tự giảm cỡ chữ khi tràn
│
└─ scripts/
   ├─ sync-champions.mjs          ← tải danh bạ tướng + ảnh (lần đầu, và khi có tướng/skin mới)
   ├─ import-patch.mjs            ← URL patch notes → patches/{ver}/patch.json (bản nháp)
   ├─ serve.mjs                   ← server tĩnh để xem thử
   └─ render.mjs                  ← Playwright chụp từng ảnh → PNG
```

## 4. Dữ liệu

### 4.1 `data/champions.json` (1 phần tử)

```jsonc
{
  "slug": "lee-sin",
  "name": "LEE SIN",
  "title": "Thầy Tu Mù",
  "roles": ["ĐẤU SĨ", "SÁT THỦ"],
  "colors": { "primary": "#…", "secondary": "#…" },       // lấy từ dữ liệu ảnh splash
  "portrait": "assets/champions/lee-sin/portrait.jpg",
  "splash":   "assets/champions/lee-sin/splash.jpg",
  "skills": [
    { "slot": "p", "label": "NỘI TẠI",   "name": "Loạn Đả",            "icon": "assets/champions/lee-sin/skill-p.jpg" },
    { "slot": "1", "label": "CHIÊU 1",   "name": "Sóng Âm / Vô Ảnh Cước", "icon": "…/skill-1.jpg" },
    { "slot": "2", "label": "CHIÊU 2",   "name": "Hộ Thể / Kiên Định",  "icon": "…/skill-2.jpg" },
    { "slot": "3", "label": "CHIÊU 3",   "name": "Địa Chấn / Dư Chấn",  "icon": "…/skill-3.jpg" },
    { "slot": "r", "label": "CHIÊU CUỐI","name": "Nộ Long Cước",        "icon": "…/skill-r.jpg" }
  ],
  "syncedAt": "2026-09-30"
}
```

### 4.2 `patches/7.2b/patch.json` — trái tim của hệ thống

```jsonc
{
  "version": "7.2b",
  "date": "2026-07-29",
  "source": "https://wildrift.leagueoflegends.com/vi-vn/news/game-updates/wild-rift-patch-notes-7-2b",
  "headline": "LEE SIN LÊN ĐỈNH, AMBESSA \"CHẾT\"?",          // ✍️ BẠN VIẾT (ảnh bìa)

  "champions": [
    {
      "slug": "lee-sin",
      "suggested": "buff",                // 🤖 máy đoán
      "status": "buff",                   // ✍️ BẠN CHỐT: buff | nerf | adjust | rework | new
      "level": 2,                         // ✍️ BẠN CHỐT: 1 nhẹ · 2 vừa · 3 mạnh
      "verdict": "Lee Sin rừng lì đòn hơn hẳn — combo W vào giao tranh sớm gần như miễn phí.", // ✍️ BẠN VIẾT
      "riotReason": "…",                  // 🤖 lấy từ phần lý do trong patch notes, để tham khảo
      "changes": [
        {
          "title": "Hộ Thể/Kiên Định",    // 🤖 nguyên văn patch notes
          "skill": "2",                    // 🤖 khớp tự động với champions.json (null = chỉ số cơ bản)
          "lines": [
            {
              "raw":   "Lá Chắn: 80/140/200/260 → 100/160/220/280",
              "label": "Lá Chắn",
              "old":   { "base": [80, 140, 200, 260], "ratios": [] },
              "new":   { "base": [100, 160, 220, 280], "ratios": [] },
              "unit":  "",
              "inverse": false,           // true với hồi chiêu, năng lượng, giá…
              "effect": "buff",           // 🤖 buff | nerf | mixed | neutral | unknown
              "delta": { "abs": [20, 20, 20, 20], "pct": [25, 14.3, 10, 7.7] }
            }
          ]
        }
      ]
    }
  ],

  "items": [
    {
      "id": "vong-am-luden", "name": "Vọng Âm Luden",
      "status": "buff", "verdict": "…",
      "groups": [ { "title": "Vọng Âm", "lines": [ /* cùng cấu trúc như trên */ ] } ]
    }
  ],

  "slides": ["cover", "overview", "lee-sin", "aurora", "ekko", "…", "items", "summary"]  // ✍️ thứ tự ảnh
}
```

- Các trường 🤖 do `import-patch.mjs` tạo ra. Các trường ✍️ bạn điền hoặc sửa.
- **Chạy lại import không được xoá phần ✍️ bạn đã viết.** Script phải gộp dữ liệu mới vào file cũ theo `slug`, không ghi đè cả file.

## 5. Bộ phân tích dòng thay đổi (`parse-change.js`)

Đầu vào: `"Sát thương: 35/65/95/125 + 30% Sức Mạnh Phép Thuật → 40/70/100/130 + 33% Sức Mạnh Phép Thuật"`

```
1. Tách nhãn:     /^(.+?):\s*(.+)$/          → label = "Sát thương", rest
2. Tách cũ/mới:   rest.split("→")            → oldStr, newStr   (không có "→" thì đánh dấu "thay đổi mô tả")
3. Mỗi vế:        tách theo " + "            → phần đầu là cơ bản, các phần sau là hệ số
                   cơ bản: tách "/" → mảng số; "17,5" → 17.5 (dấu phẩy thập phân kiểu VN)
                   đơn vị: "%", "giây", "s"
                   hệ số: "30% Sức Mạnh Phép Thuật" → { pct: 30, stat: "SMPT" }
4. So sánh:       theo từng cấp → tăng / giảm / giữ nguyên
                   số cấp khác nhau (3 vs 4) → "unknown", cần xem tay
5. Chỉ số ngược:  nhãn chứa "Hồi chiêu", "Năng lượng", "Tiêu hao", "Giá", "Thời gian vận" → đảo chiều
6. Kết luận dòng: tất cả tốt → buff · tất cả xấu → nerf · lẫn lộn → mixed
7. Kết luận tướng: đếm dòng buff/nerf → gợi ý status (vd: 2 nerf + 1 mixed → "nerf")
```

- Những dòng không phân tích được thì **vẫn hiển thị nguyên văn**, đánh dấu `unknown` để bạn xem lại. **Không bao giờ bỏ qua dòng một cách lặng lẽ.**
- Viết **test** bằng các dòng có thật trong patch 7.2b (liệt kê ở [02](02-nguon-du-lieu-va-anh.md)). Mỗi patch mới có dạng dòng lạ thì thêm vào bộ test. Dùng `node --test`, có sẵn trong Node, không cần cài thêm.
- Đoán buff/nerf chỉ là **gợi ý**. Có những thay đổi số trông như nerf nhưng thực chất là buff (vd giảm sát thương nhưng tăng hệ số). Người duyệt vẫn là bạn.

## 6. Cách template vẽ và báo "sẵn sàng"

```js
// slide.js (phác thảo)
const q = new URLSearchParams(location.search);
const patch = await (await fetch(`/patches/${q.get('patch')}/patch.json`)).json();
const champs = await (await fetch('/data/champions.json')).json();
document.body.dataset.format = q.get('format') ?? '16x9';     // CSS chọn bố cục theo format
root.innerHTML = templates[typeOf(q.get('slide'))](patch, champs, q.get('slide'));

await document.fonts.ready;                                    // chờ font
await Promise.all([...document.images].map(i => i.decode()));  // chờ ảnh
autofit(document.querySelectorAll('[data-autofit]'));          // co chữ nếu tràn
window.__READY__ = true;                                       // báo cho Playwright là đã sẵn sàng
```

- Mỗi template là **1 hàm JS trả về chuỗi HTML** (template literal). Không cần framework.
- `autofit`: nếu `el.scrollWidth > el.clientWidth` thì giảm `font-size` 2px, lặp lại cho đến khi vừa hoặc chạm cỡ tối thiểu. Chạm cỡ tối thiểu mà vẫn tràn → **in cảnh báo ra console** để lúc render biết.

## 7. Chụp ảnh (`render.mjs`)

```js
import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'msedge' });   // dùng Edge có sẵn
const sizes = { '16x9': [1920, 1080], '9x16': [1080, 1920] };

for (const [format, [width, height]] of Object.entries(sizes)) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  page.on('console', m => m.type() === 'warning' && console.warn(`[${format}]`, m.text()));
  for (const [i, slide] of patch.slides.entries()) {
    await page.goto(`http://localhost:5173/templates/slide.html?patch=${ver}&slide=${slide}&format=${format}`);
    await page.waitForFunction(() => window.__READY__ === true);
    await page.screenshot({ path: `patches/${ver}/out/${format}/${String(i).padStart(2, '0')}-${slide}.png` });
  }
}
await browser.close();
```

## 8. Các lệnh sử dụng (dự kiến)

```bash
node scripts/sync-champions.mjs
```
Tải danh bạ tướng + ảnh. Chạy lần đầu, và khi có tướng hoặc skin mới.

```bash
node scripts/import-patch.mjs https://wildrift.leagueoflegends.com/vi-vn/news/game-updates/wild-rift-patch-notes-7-2b
```
Tạo `patches/7.2b/patch.json` bản nháp.

```bash
node scripts/serve.mjs
```
Mở `http://localhost:5173/templates/studio.html?patch=7.2b` để xem cả bộ ảnh, chỉnh `patch.json` rồi tải lại trang.

```bash
node scripts/render.mjs 7.2b
```
Xuất PNG ra `patches/7.2b/out/`.

## 9. Mở rộng sau này

| Tính năng | Ý tưởng |
|---|---|
| **Trang biên tập** | `studio.html` thêm ô nhập câu chốt, nút chọn buff/nerf, xem trước ngay. Bấm lưu thì gửi về `serve.mjs` để ghi vào `patch.json` |
| **Video TikTok** | Ghép các PNG bằng `ffmpeg`: hiệu ứng zoom nhẹ (Ken Burns), chuyển cảnh, nhạc nền. Hoặc chèn **video demo skill mp4** (có sẵn trên trang chính thức) vào ảnh chi tiết |
| **Gợi ý câu chốt bằng AI** | Đưa `riotReason` + số liệu cho một mô hình ngôn ngữ để viết nháp 2–3 câu chốt, bạn chọn và sửa |
| **Tự phát hiện patch mới** | Chạy định kỳ: kiểm tra trang game-updates, có bài mới thì tự import và báo cho bạn |
| **So sánh nhiều patch** | Lưu lịch sử tất cả `patch.json` → ảnh "Lee Sin đã bị nerf 3 patch liên tiếp" |
