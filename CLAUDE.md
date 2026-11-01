# Ticket Writer — hướng dẫn dự án

Tool web 1 trang giúp support viết ticket (Title + Nội dung để copy) và làm checklist setup/training thiết bị có ảnh bằng chứng.

| Tài liệu | Nội dung |
|---|---|
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | Hành vi của tool. Đọc trước khi đổi hành vi; đổi hành vi thì cập nhật trong cùng lần sửa. |
| [docs/CONFIG.md](docs/CONFIG.md) | Cách thêm/sửa loại ticket và checklist setup (schema từng trường). |
| `../ticket-writer.html` | Bản gốc 1 file. Chỉ để tham chiếu, **không sửa**. Bản mới phải cho output giống hệt với cùng dữ liệu nhập. |
| `../CLAUDE.md` | Nguyên tắc làm việc chung (tự load vì folder nằm trong `actions/`). |

## Ngôn ngữ

| Phần | Ngôn ngữ |
|---|---|
| Cấu trúc trang | **HTML5** |
| Giao diện | **CSS3** (custom properties, grid/flex, `prefers-color-scheme`) |
| Logic + cấu hình | **JavaScript ES2020**, chạy thẳng trên Chrome/Edge bản hiện tại. Không TypeScript, không framework, không thư viện, không build step. Kiểu dữ liệu ghi bằng **JSDoc**. |
| Tool dev (tùy chọn) | **Python 3** trong `tests/tools/`: chạy test / bấm thử UI bằng Chrome headless. App không cần Python. |
| Tài liệu | **Markdown** |
| Chữ trên giao diện, docs, comment | **Tiếng Việt** |
| Tên file | **kebab-case** tiếng Anh (`ticket-form.js`) |
| Tên biến/hàm/key | **camelCase** tiếng Anh; factory `createXxx`; hằng số `UPPER_SNAKE` |

## Chạy & chia sẻ

- **`index.html` là file chính**: double-click là chạy (giao thức `file://`), không cần server, không cần cài gì.
- Gửi đồng nghiệp: nén **cả folder** `ticket-writer/` (giữ nguyên cấu trúc), bên kia giải nén rồi double-click `index.html`.
- Vì chạy trên `file://`:
  - Dùng `<script src="...">` thường. **Không** dùng ES module (`type="module"`, `import`/`export`): trình duyệt chặn trên `file://`.
  - **Không** `fetch()`/XHR file trong folder. Cấu hình viết thành file `.js`.
  - Mọi đường dẫn là **tương đối** (`src/...`, không có `/` đầu, không có `C:\`).
- Thêm file `.js` mới → thêm `<script>` vào `index.html` đúng vị trí theo layer (xem bên dưới). Quên dòng này thì file không chạy. File config / domain / application mới → thêm cả vào `tests/index.html`.

## Kiến trúc (Clean Architecture)

```
ticket-writer/
├─ index.html                  File chính. Khung HTML + danh sách <script> theo thứ tự layer
├─ styles/                     CSS, mỗi file 1 vùng giao diện
│  ├─ tokens.css               màu, bo góc, font (light + dark)
│  ├─ layout.css · form.css · checklist.css · output.css · dialog.css
├─ config/                     DỮ LIỆU: chỉ khai báo, không có logic
│  ├─ app.js                   version, Loại có sẵn, Kết luận, ký hiệu, nhãn, storage key
│  ├─ tickets/                 VIẾT TICKET: incident.js (Hỗ trợ merchant) · transfer.js
│  ├─ setup/                   SETUP / TRAINING
│  │  ├─ catalog.js            danh mục Thiết bị → Hãng → Model, Quy trình (thêm model mới ở đây)
│  │  └─ <device>/<brand>/<flow>/<checklist>.js
│  └─ sms/                     promotion.js (giá, Type Customer, câu chữ) · shipping.js (câu chữ tin báo ship thiết bị)
├─ src/
│  ├─ core/                    namespace.js (TW) · registry.js (config đăng ký vào) · ports.js (typedef port)
│  ├─ domain/                  QUY TẮC NGHIỆP VỤ: hàm thuần, không DOM, không storage
│  │                           text · title · ticket · checklist · body · validation · navigation · image-slots · image-archive · template ·
│  │                           sms · sms-message · shipping · shipping-message
│  ├─ application/             USE CASE: store + service, điều phối domain và port
│  │                           context · store · session · session-repository · ticket/navigation/view/image/
│  │                           output/category/template/sms/shipping-service
│  ├─ infrastructure/          ADAPTER: storage (localStorage) · clipboard · screen-capture (chụp màn hình) · zip (ghi file ZIP) · pdf-image · pdf (ghi file PDF) · files
│  ├─ ui/                      GIAO DIỆN: dom (helper) · picker · ticket-form · category-combo · idea-list ·
│  │                           checklist-view · image-zone · output-view · image-panel · image-viewer ·
│  │                           template-dialog · header · paste-handler · sms-form · shipping-form
│  └─ main.js                  COMPOSITION ROOT: tạo adapter, inject vào service, gắn UI
├─ tests/                      xem tests/README.md
│  ├─ index.html               double-click để chạy test
│  ├─ *.test.js · golden-*.js
│  └─ tools/*.py               chạy test / bấm thử UI / sinh golden từ terminal
└─ docs/
```

### Chiều phụ thuộc (bắt buộc)

```
ui ──► application ──► domain ◄── config
            │
            └──► port (interface) ◄── infrastructure implements
main.js: biết tất cả, nối chúng lại
```

| Layer | Được dùng | Cấm |
|---|---|---|
| `config` | `TW.registry` | logic, DOM, storage |
| `domain` | `core`, dữ liệu config truyền vào qua tham số | `document`, `window`, `localStorage`, `navigator`, `Date.now()`, gọi `application`/`ui`/`infrastructure` |
| `application` | `domain`, port được inject | DOM, gọi thẳng `localStorage`/`navigator.clipboard` |
| `infrastructure` | API trình duyệt | quy tắc nghiệp vụ |
| `ui` | `application` (service, store), `domain` chỉ để đọc/hiển thị | đổi state trực tiếp, gọi `localStorage`/clipboard trực tiếp |

Thứ tự `<script>` trong `index.html`: `core` → `config/app.js` → `config/tickets/*` → `config/setup/catalog.js` → `config/setup/**` → `config/sms/*` → `domain` → `application` → `infrastructure` → `ui` → `main.js`.

### Khuôn 1 file JS

```js
// src/domain/title.js — Ghép title từ Loại + Tóm tắt.
(function (TW) {
  'use strict';

  /**
   * @param {{ categories: string[], summary: string }} input
   * @returns {string}
   */
  function buildTitle({ categories, summary }) { /* ... */ }

  TW.domain.title = { buildTitle };
})(window.TW);
```

File config:

```js
// config/tickets/incident.js — Viết ticket: Hỗ trợ merchant.
(function (registry) {
  'use strict';

  const { addTicket, NOTE } = registry;

  addTicket('incident', { /* ... */ });
})(window.TW.registry);
```

- Mỗi file là 1 IIFE + `'use strict'`. Biến toàn cục duy nhất: `window.TW`.
- **Không** destructure ngay ở tham số IIFE (`function ({ addTicket })`) khi có `'use strict'` bên trong: đó là lỗi cú pháp, cả file không chạy. Destructure ở dòng `const` như trên.
- Mỗi file gắn **đúng 1** thuộc tính vào namespace của layer: `TW.domain.*`, `TW.application.*`, `TW.infra.*`, `TW.ui.*` (riêng `TW.registry` ở core).
- Ưu tiên factory function + closure (`createTemplateService(deps)`) thay cho `class`. Hàm trả về không dùng `this`, nên truyền thẳng làm callback được.

## SOLID áp dụng thế nào

- **S — Single Responsibility**: 1 file = 1 trách nhiệm. Ví dụ ghép title, ghép nội dung, kiểm tra điều kiện copy là 3 file domain riêng; ô chọn Loại, checklist, khối ảnh là 3 view riêng.
- **O — Open/Closed**: thêm loại ticket hoặc checklist = **thêm 1 file config**, không sửa `src/`. Hiện có 2 kiểu mục (nhập ý / Kết luận). Khi cần kiểu thứ 3: tách thành bảng renderer + composer theo `kind`, không nối thêm `if/else`.
- **L — Liskov**: mọi loại ticket và checklist theo cùng 1 schema (docs/CONFIG.md); code xử lý loại nào cũng không cần biết đang là loại gì. Adapter thay thế được nhau (vd storage thật ↔ storage giả trong test).
- **I — Interface Segregation**: port nhỏ, chỉ đúng hàm cần: `KeyValueStore { read(key), write(key, value) }`, `TextClipboard { writeText }`, `ImageClipboard { writeImage, readImages }`, `ScreenCapture { capture }`, `FileAdapter { readAsDataUrl, readJson, download, downloadZip, downloadPdf }`. Typedef đặt ở `src/core/ports.js`.
- **D — Dependency Inversion**: service nhận port qua tham số factory, không tự tạo. Chỉ `main.js` biết adapter cụ thể nào được dùng.

## Clean code

- File ≤ ~200 dòng, hàm ≤ ~30 dòng. Dài hơn → tách.
- Hàm ≤ 3 tham số; nhiều hơn thì truyền 1 object.
- Tên nói rõ ý định (`missingImageCount`, không `n2`). Hàm bắt đầu bằng động từ (`buildBody`, `isCopyAllowed`).
- Domain là **hàm thuần**: cùng input → cùng output, không sửa tham số đầu vào, không side effect.
- Không magic string/number trong `src/`: đưa vào `config/app.js` hoặc hằng số đầu file.
- Không lặp logic trong `src/`. Riêng `config/setup` **được phép lặp** bước giữa các file để mỗi quy trình đọc độc lập.
- Comment giải thích **tại sao**, không kể lại code làm gì.
- **Không `innerHTML`** với dữ liệu người dùng hoặc config; dùng `textContent` / `createElement`.
- Bắt lỗi ở biên (infrastructure): localStorage/clipboard có thể throw → bắt tại adapter, trả kết quả an toàn. Domain không `try/catch`.
- Không dead code, không `console.log` còn sót, không code "để sau dùng".
- Format: 2 space, nháy đơn, có dấu `;`.

## Không được phá (dữ liệu đã lưu của người dùng)

- **Không đổi key loại** đang có: `incident` `request` `transfer` `setup` `setupPax` `newDb` `setupValor` `setupTraining`. State và template lưu theo key. Gộp loại → khai báo key cũ trong `formerKeys` của loại nhận (vd `request` → `incident`); key cũ không được dùng lại.
- **`id` mục checklist duy nhất trong toàn dự án**: tick/N/A lưu chung theo id. Không đổi id đang có; bỏ bước thì xóa mục.
- **Key mục ticket dùng chung giữa các loại**: cùng key = cùng ý nghĩa (chi tiết ở docs/CONFIG.md).
- Không đổi `storageKey`, `templateKey`, `categoryKey`. Thêm dữ liệu lưu mới → thêm trường, vẫn đọc được bản cũ.
- Mỗi lần sửa bất kỳ file nào: tăng `version` trong `config/app.js`, dạng `vYYYY-MM-DD.N`.

## Nội dung checklist

- Giữ nguyên chữ người dùng viết (kể cả viết tắt, từ chuyên môn). Thấy lỗi chính tả hay link nghi sai thì **báo**, không tự sửa.
- Mỗi setup có 2 quy trình **Ship mới** (`new`) và **Replace** (`replace`), luôn là file riêng, không gộp bằng if/else.

## Kiểm tra sau khi sửa

1. Double-click `tests/index.html` (hoặc `python tests/tools/run_tests.py`): tất cả test xanh. Sửa `domain`/`application` → thêm hoặc cập nhật test.
2. Double-click `index.html`, mở DevTools Console: không có lỗi. Có Python thì chạy thêm `python tests/tools/smoke_ui.py` (bấm thử UI, báo lỗi JS); đổi UI thì cập nhật kịch bản `tests/tools/smoke_ui.js`.
3. Đi qua mọi loại ticket và mọi nhánh Thiết bị → Hãng → Model → Quy trình: hiện đúng mục/checklist.
4. Loại vừa sửa: nhập thử → Kết quả đúng REQUIREMENTS §8, nút Copy nội dung khóa/mở đúng §9.
5. localStorage có sẵn từ bản trước (ticket đang nhập, template) vẫn load đúng.
6. Khi refactor: Title + Nội dung phải giống từng ký tự với `../ticket-writer.html` cho cùng input, ngoại lệ: dòng `Model:` của ticket setup (REQUIREMENTS §14.3), loại Hỗ trợ merchant (REQUIREMENTS §14.5) và các chỗ đổi config checklist có chủ đích, ghi trong `CHANGED_SINCE_ORIGINAL` của `tests/golden.test.js` (REQUIREMENTS §14.4). Các ca này nằm trong test golden.
