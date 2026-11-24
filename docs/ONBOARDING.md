# Onboarding — đọc code Ticket Writer từ đầu

Dành cho bạn mới vào dự án. Đi theo thứ tự dưới đây: mỗi bước có **đọc gì**, **để hiểu gì** và **tự kiểm tra** (trả lời được thì sang bước sau). Tổng cộng khoảng 1–2 ngày.

Quy tắc code (layer, đặt tên, cái gì không được phá) nằm ở [CLAUDE.md](../CLAUDE.md). File này chỉ nói **đọc theo thứ tự nào**.

---

## Bước 0 — Chạy được (30 phút)

1. Double-click `index.html`, thử mọi thứ: chọn loại ticket, gõ Tóm tắt, thêm ý, dán ảnh (Ctrl+V), xem khu Kết quả, bấm Copy, lưu / dùng template, nhóm SMS.
2. Double-click `tests/index.html`: dòng đầu phải là `PASS x/x`.
3. Có Python 3: `python tests/tools/run_tests.py` và `python tests/tools/smoke_ui.py`.
4. Đọc [README.md](../README.md), rồi [CLAUDE.md](../CLAUDE.md) (phần Kiến trúc + Không được phá).
5. Mở [docs/diagrams/tree.html](diagrams/tree.html) và [docs/diagrams/architecture.html](diagrams/architecture.html).

**Tự kiểm tra:** Dữ liệu của người dùng nằm ở đâu? Vì sao không dùng `import`/`export` và `fetch()`? Thêm 1 file `.js` mới thì phải sửa thêm file nào?

---

## Bước 1 — Khung: `index.html` + `src/core/`

| File | Để hiểu |
|---|---|
| `index.html` | Khung HTML + danh sách `<script>` theo thứ tự layer. Thứ tự này **là** cơ chế phụ thuộc của dự án (không có bundler). |
| `src/core/namespace.js` | Biến toàn cục duy nhất `window.TW` và 4 namespace `domain / application / infra / ui`. |
| `src/core/registry.js` | Nơi file `config/` đăng ký vào. Bắt lỗi trùng key loại, trùng `id` mục checklist ngay lúc tải trang. |
| `src/core/ports.js` | Typedef JSDoc của các port (interface). Không có code chạy, không có `<script>`. |

Mở thêm [docs/diagrams/dependency.html](diagrams/dependency.html).

**Tự kiểm tra:** Nếu đặt `<script>` của 1 file domain sau `main.js` thì chuyện gì xảy ra? `formerKeys` dùng để làm gì?

---

## Bước 2 — Dữ liệu: `config/`

| File | Để hiểu |
|---|---|
| `config/app.js` | Version, các **storage key (không đổi)**, Kết luận, nhãn, nhóm đang ẩn (`hidden`). |
| `config/tickets/incident.js`, `transfer.js` | Schema 1 loại ticket: `sections` (mục nhập ý, mục Kết luận `kind: 'conclusion'`, `actionFor`, `NOTE`), cờ `smsPromotion`, `showLang`, `noCategory`, `footer`. |
| `config/setup/catalog.js` + 1 file checklist bất kỳ | Thiết bị → Hãng → Model → Quy trình; checklist có `groups[].items[]` với `id` duy nhất toàn dự án. |
| `config/sms/*.js`, `config/notifications.js` | Câu chữ SMS và cảnh báo lưu trữ. |

Đọc kèm [docs/CONFIG.md](CONFIG.md).

**Tự kiểm tra:** Muốn thêm loại ticket mới thì sửa những file nào (đáp án: 1 file config + 1 dòng `<script>` ở `index.html` và `tests/index.html`, không đụng `src/`)? Vì sao không được đổi `id` mục checklist?

---

## Bước 3 — Quy tắc nghiệp vụ: `src/domain/`

Toàn bộ là **hàm thuần**: không DOM, không storage, không `Date.now()`. Đọc theo thứ tự (file sau dùng file trước):

1. `text.js` — viết hoa đầu dòng, gạch đầu dòng, bỏ dấu để tìm.
2. `title.js` — `LOẠI - TÓM TẮT` viết hoa.
3. `ticket.js` — hình dạng 1 ticket, `sanitizeTicket` (đọc dữ liệu cũ/hỏng an toàn).
4. `checklist.js` → `body.js` → `validation.js` — ghép Nội dung và điều kiện mở nút Copy. Đối chiếu với REQUIREMENTS §8, §9.
5. `navigation.js` — đang mở loại nào (nhóm → loại / nhánh setup / loại SMS).
6. `image-slots.js`, `image-archive.js` — ảnh gắn vào đâu, tên file ZIP/PDF.
7. `template.js`, `offline-ticket.js`.
8. Nhóm SMS: `sms.js` → `sms-message.js`, `shipping*.js`, `review*.js`.
9. Có thể để sau: `phone-link.js`, `qr-code.js` (tính năng đang ẩn).

Đọc song song test: `tests/domain.test.js`, `tests/golden.test.js` (so từng ký tự với bản gốc — đọc REQUIREMENTS §14.4 để biết ngoại lệ).

**Tự kiểm tra:** Ticket chưa nhập gì thì `buildBody` trả gì? Kết luận `Resolved` thì mục "Việc cần làm tiếp" có in ra không, vì sao?

---

## Bước 4 — Use case: `src/application/`

| File | Để hiểu |
|---|---|
| `store.js` | State duy nhất của phiên + `subscribe`. Mỗi `update` gửi kèm `change` (`rebuild`, `focus`, `view`) để UI biết dựng lại hay chỉ cập nhật. |
| `context.js`, `session.js` | Config gom lại; các giá trị suy ra từ state (loại đang mở, kết luận…). |
| `session-repository.js` | Đọc/lưu state vào `KeyValueStore`, **đọc được mọi format cũ**. |
| `ticket-service.js` | Mọi thao tác sửa ticket đi qua đây. |
| `output-service.js` | Title, Nội dung, cảnh báo, danh sách ảnh cho khu Kết quả. |
| `image-service.js` | Ảnh trong bộ nhớ + lưu IndexedDB qua port `ImageStore`. |
| Còn lại | `template-`, `offline-`, `category-`, `summary-history-`, `tag-history-`, `sms-`, `shipping-`, `review-`, `staff-`, `theme-`, `notice-`, `view-`, `navigation-`, `phone-service`. Mỗi file 1 việc, đọc lướt. |

Mở [docs/diagrams/uml-class.html](diagrams/uml-class.html): service chỉ biết port, test thay bằng storage giả. Đọc `tests/application.test.js` để thấy cách đó.

**Tự kiểm tra:** Ai gọi `repository.save()`? (Gợi ý: không phải store.) Vì sao service nhận `storage` qua tham số thay vì gọi `localStorage`?

---

## Bước 5 — Adapter: `src/infrastructure/`

Đọc `storage.js`, `image-store.js`, `clipboard.js`, `files.js` — để ý **mọi lỗi đều bắt tại đây** và trả giá trị an toàn (`null`, `false`). Lướt `ticket-fill.js` (bookmarklet chạy trên trang ticket bên ngoài) và `screen-capture.js`. `zip.js`, `pdf.js`, `pdf-image.js` tự viết định dạng file, chỉ đọc khi cần sửa.

Trước khi sửa gì ở đây: đọc [docs/SECURITY.md](SECURITY.md).

**Tự kiểm tra:** Nếu localStorage đầy thì người dùng thấy gì? (Gợi ý: `config/notifications.js`.)

---

## Bước 6 — Giao diện: `src/ui/` và `src/main.js`

1. `ui/dom.js` — helper tạo phần tử (`el`, `button`, `labeledField`, `textInput`…). **Không dùng `innerHTML`**. `ui/combo.js` — phần dùng chung của ô có danh sách gợi ý (ô Loại, ô Tóm tắt).
2. `main.js` — composition root: tạo adapter → service → view, và hàm `store.subscribe` quyết định lúc nào dựng lại form, lúc nào chỉ cập nhật.
3. Theo đúng thứ tự trên màn hình: `header.js` → `picker.js` → `ticket-form.js` (+ `category-combo.js`, `summary-combo.js`, `idea-list.js`, `checklist-view.js`, `image-zone.js`, `sms-form.js`) → `output-view.js`, `image-panel.js` → các dialog.

Mở [docs/diagrams/sequence.html](diagrams/sequence.html) rồi lần theo đúng luồng đó trong code: gõ Tóm tắt → `ticketService.setField` → `store.update` → `main.js` lưu + `output.schedule()` → sau 400ms `outputView.render()`.

**Tự kiểm tra:** Gõ 1 ký tự thì form có bị dựng lại không? Bấm `+ Thêm ý` thì sao? Ảnh dán bằng Ctrl+V vào mục nào khi con trỏ không đứng trong mục nào?

---

## Bước 7 — Bài tập đầu tiên (làm trên nhánh riêng, không merge)

1. Thêm 1 loại ticket thử trong `config/tickets/` (key mới, 2 mục), thêm `<script>`; chạy test, thấy loại mới trên picker.
2. Thêm 1 test trong `tests/domain.test.js` cho `buildTitle` với Tóm tắt có khoảng trắng thừa.
3. Đọc [docs/REVIEW.md](REVIEW.md) và đi qua checklist "trước khi gửi bản mới" như thể sắp gửi bản đó.

---

## Hiện trạng cần biết (để không bị bất ngờ khi đọc code)

| Thứ | Trạng thái | Ở đâu |
|---|---|---|
| Nhóm **Setup / Training** | Code + config còn đủ, **đang ẩn** | `groups[].hidden` trong `config/app.js` |
| **Nhận ảnh iOS** (phone-upload) | Code còn đủ, **đang ẩn** (đang dùng Send Anywhere) | `phoneUpload.hidden` trong `config/app.js` |
| Kết luận **bắt buộc mục Việc cần làm tiếp** | Engine hỗ trợ (`requiresAction`, nhãn "Bắt buộc") nhưng cả 2 Kết luận hiện đều `requiresAction: false` → không bao giờ khóa nút Copy vì lý do này | `conclusions` trong `config/app.js`, `domain/validation.js` |
| Hãng **Clover** trong Setup | Có trong catalog, chưa có checklist → hiện màn hình "Chưa có checklist" | `config/setup/catalog.js` |
| Bản gốc 1 file `ticket-writer.html` | Không có trong repo → **không** sinh lại được `tests/golden-expected.js` | CLAUDE.md |
