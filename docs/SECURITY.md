# Bảo mật

Ticket Writer xử lý thông tin merchant (tên tiệm, số điện thoại, ảnh màn hình có thể chứa dữ liệu thanh toán). Tài liệu này ghi dữ liệu nằm ở đâu, đi đâu, rủi ro nào đã chấp nhận và quy tắc khi sửa code.

## 1. Dữ liệu nằm ở đâu

Mọi thứ nằm trên **máy đang dùng**, trong profile trình duyệt / tài khoản Windows đó. Không có server, không gửi lên Internet.

| Dữ liệu | Nơi lưu | Xóa khi |
|---|---|---|
| Ticket đang nhập, form SMS, chế độ xem (`ticketWriter.v1`) | localStorage | `Ticket mới`, xóa dữ liệu trình duyệt |
| Template, Loại tự thêm, tên nhân viên, giao diện, link phone-upload | localStorage (key ở REQUIREMENTS §12) | Xóa trong app / xóa dữ liệu trình duyệt |
| Ảnh đang dán | IndexedDB `ticketWriter.images.v1` | `Ticket mới`, `Xóa hết ảnh`, `Mở file đã lưu`, xóa dữ liệu trình duyệt |
| File tải xuống: ZIP / PDF ảnh, ticket offline (`OFF-….json/.zip`), `ticket-templates.json`, sao lưu (`ticket-writer-backup-….json`) | Thư mục Downloads | Người dùng tự xóa |
| Mã bí mật phone-upload | `%LOCALAPPDATA%\TicketWriter\` | Người dùng tự xóa |
| Ảnh iPad gửi lên chưa được lấy | Bộ nhớ cửa sổ phone-upload | Tắt cửa sổ |

Lưu ý:

- Trên `file://`, Chrome dùng **chung 1 vùng lưu trữ cho mọi trang `file://`** của profile đó. Trang HTML khác mở bằng double-click trên cùng máy, cùng profile đọc được localStorage / IndexedDB của Ticket Writer. Không mở file HTML lạ bằng profile đang dùng Ticket Writer.
- File trong Downloads (ticket offline, ZIP, PDF, sao lưu) chứa thông tin merchant: xử lý như tài liệu nội bộ, xóa khi xong việc. File sao lưu (gợi ý Tóm tắt, tên tag, template) không có ticket đang nhập nhưng vẫn là dữ liệu nội bộ: chép sang máy mới bằng USB / ổ công ty, không gửi qua chat / email ngoài.

## 2. Dữ liệu đi đâu

| Đường đi | Mô tả | Rủi ro / cách giảm |
|---|---|---|
| Clipboard | `Copy title / nội dung / ảnh`, `Copy để điền` (JSON có đánh dấu `ticket-writer-fill`) | App khác trên máy đọc được clipboard. Không có cách chặn; không copy dữ liệu nhạy cảm hơn mức cần. |
| Bookmark *Điền ticket* | Chạy trên trang ticket system, đọc clipboard, chỉ điền khi thấy đánh dấu của Ticket Writer, thiếu ô nào thì không điền gì | Selector ở `config/app.js` (`ticketFill`); trang ticket đổi giao diện thì bookmark không điền (không điền nhầm chỗ). |
| Bookmark *Lấy thông tin tiệm* | Chạy trên trang ticket / My Merchant / Lead (portal), chỉ đọc dòng tiêu đề ticket hoặc merchant (Tên tiệm / MID), nội dung ticket hoặc 2 ô DBA / MID + địa chỉ trang (không đọc ZIP), copy vào clipboard (JSON có đánh dấu `ticket-writer-shop`); Ticket Writer đọc lại khi bấm `Dán thông tin tiệm` | Không gửi đi đâu ngoài clipboard. Chữ trong clipboard là dữ liệu không tin cậy: chỉ nhận chuỗi, trim, tối đa 300 ký tự, nội dung 3000 (`sanitizeShopInfo`). Selector ở `config/app.js` (`shopGrab`). |
| Chụp màn hình | `getDisplayMedia`, giữ luồng chia sẻ để lần sau chụp ngay | Chrome luôn hiện thanh "Đang chia sẻ màn hình"; bấm Dừng chia sẻ khi không cần. |
| phone-upload | iPad → máy tính qua LAN, Ticket Writer lấy qua `127.0.0.1` | Xem §3. |
| Bot Telegram (Gửi Telegram) | Chuyển case: tin + ảnh Issue → `https://api.telegram.org` → group của team | Đường DUY NHẤT ra Internet. Xem §6. |

App **không** tải gì từ CDN / Internet, không có thư viện ngoài. Ngoại lệ duy nhất gửi dữ liệu ra Internet: nút `Gửi Telegram` (§6).

## 3. phone-upload (nhận ảnh iPad / iPhone)

Chương trình PowerShell mở **port 8765 trên mọi card mạng** của máy tính. Đây là phần rủi ro nhất của dự án.

### Bảo vệ đang có

| Biện pháp | Chống lại |
|---|---|
| **Mã máy tính** (12 ký tự ngẫu nhiên, RNG mật mã, ~60 bit) + chỉ nhận request từ chính máy đó (loopback) | Máy khác trong LAN lấy ảnh / đổi mã iPad |
| **Mã iPad** riêng, hết hạn sau 12 tiếng, `Đổi mã ngay` khi đổi ca | iPad dùng chung: người ca trước còn mở trang gửi nhầm ảnh vào máy mình |
| Mã lưu ngoài folder dự án | Nén folder gửi đồng nghiệp làm lộ mã |
| Chỉ nhận `image/*`, tối đa 50 MB / ảnh, header tối đa 16 KB | Gửi file lạ, làm tràn bộ nhớ bằng 1 request |
| Sai mã / sai nguồn → 404, không giải thích | Dò đường dẫn |
| Ảnh chỉ trong bộ nhớ, tắt cửa sổ là mất | Ảnh tồn đọng trên đĩa |
| Bỏ kết nối để không / treo quá 15 giây | 1 kết nối treo chặn mọi request khác |

### Rủi ro đã biết, đang chấp nhận

- **HTTP thường, không mã hóa.** Ảnh đi qua Wi-Fi dưới dạng thô; người cùng mạng có công cụ bắt gói tin có thể thấy ảnh và mã iPad. Chỉ dùng **Wi-Fi nội bộ có mật khẩu**, không dùng Wi-Fi công cộng / Wi-Fi khách.
- **CORS `*`** (bắt buộc vì Ticket Writer chạy `file://`). Trang web khác trong trình duyệt gọi được `127.0.0.1:8765`, nhưng phải biết mã máy tính mới làm được gì.
- Trong 12 tiếng, ai cầm iPad đang mở trang gửi ảnh (hoặc biết link iPad) đều gửi được ảnh vào máy mình. Đổi ca thì bấm `Đổi mã ngay`.
- Ca "máy khác trong LAN gọi bằng mã máy tính bị chặn" **chưa có test tự động** và chưa chạy thật (test hiện chạy `-LocalOnly`). Logic nằm ở `Invoke-Request` trong `phone-upload.ps1`.

### Trước khi dùng ở công ty

- Hỏi **IT** có cho mở port trên máy làm việc không. Tường lửa Windows hỏi lần đầu: chỉ cho phép **Private networks**.
- Không chạy phone-upload khi không cần. Tắt cửa sổ = đóng port.
- Lộ link (vd chụp màn hình có mã QR gửi đi): bấm `Đổi mã ngay`. Lộ mã máy tính: xóa `%LOCALAPPDATA%\TicketWriter\phone-upload-token.txt`, chạy lại `.bat`, dán link mới vào Ticket Writer.

## 4. Quy tắc khi viết code

- **Không `innerHTML`** với dữ liệu người dùng / config / dữ liệu từ phone-upload. Dùng `textContent`, `createElement` (helper ở `src/ui/dom.js`).
- **Không thêm thư viện, không tải script / font / ảnh từ mạng.**
- **Không `fetch` / XHR** ngoài `src/infrastructure/phone-inbox.js` (chỉ gọi `http://127.0.0.1`) và `src/infrastructure/telegram-bot.js` (chỉ gọi `telegram.apiBase` = `https://api.telegram.org`, chỉ `sendMessage` / `sendPhoto` / `sendMediaGroup`, §6). Thêm host / method khác = vùng duyệt bắt buộc (REVIEW.md).
- **Không** ghi token bot vào code, config, test, log, thông báo lỗi, file tải xuống, file Sao lưu (`backupKeys` không có `telegramTokenKey`).
- Dữ liệu đọc từ storage / file / mạng là **dữ liệu không tin cậy**: luôn qua hàm `sanitize…` / kiểm dạng trước khi dùng (vd `sanitizeTicket`, `parseOfflineFile`, `parsePhoneLink`). Dữ liệu hỏng → bỏ qua phần đó, không throw.
- Không `eval` / `new Function`. Bookmarklet là ngoại lệ có chủ đích: chuyển hàm `fillTicketPage` thành chữ để chạy trên trang ticket; hàm đó chỉ dùng tham số, không nhận code từ ngoài.
- phone-upload: mọi đường dẫn phải cần mã; đường dẫn mã máy tính phải kiểm loopback; không ghi ảnh ra đĩa; giới hạn kích thước trước khi đọc body.
- Không ghi dữ liệu merchant vào `console`, tên file tạm, hay thông báo lỗi gửi đi đâu.

## 5. Báo sự cố

Nghi lộ dữ liệu (gửi nhầm file, lộ link / mã QR, lộ token bot, máy bị truy cập lạ): đổi mã phone-upload như §3, `/revoke` token bot như §6, xóa file trong Downloads liên quan, báo trưởng nhóm / IT theo quy định công ty.

## 6. Bot Telegram (nút Gửi Telegram ở Chuyển case)

Cả team dùng chung 1 bot (`@frt_transfer_bot`). Bấm `Gửi Telegram` → xem trước → `Gửi`: bot gửi tin (chữ thường) rồi ảnh Issue vào group của team đang chọn.

### Bảo vệ đang có

| Biện pháp | Chống lại |
|---|---|
| Bot là **thành viên thường** (không admin), `/setjoingroups` **Disable**, `/setprivacy` **Enable** | Token lộ: người có token chỉ gửi được tin vào group bot đang ở; không xóa tin / cấm người, không thêm bot vào group khác, không đọc tin trong group |
| Token **không nằm trong code / config / repo / file release / file Sao lưu**; mỗi máy dán 1 lần, lưu ở localStorage `ticketWriter.telegram.v1`; ô token là ô mật khẩu, dán đúng dạng là lưu và xóa khỏi ô | Lộ token khi gửi file cho đồng nghiệp, đẩy lên GitHub, chụp màn hình |
| Chỉ gửi vào `chatId` khai báo trong `config/tickets/pass-case.js`; không có ô nhập ID group | Gửi nhầm / gửi ra group lạ |
| Chỉ gọi `sendMessage` / `sendPhoto` / `sendMediaGroup`; chữ thường (không `parse_mode`) | Bot làm việc khác ngoài gửi tin; nội dung nhập vào biến thành link / định dạng lạ |
| Xem trước (group, tin, số ảnh) rồi mới gửi; đang gửi thì khóa nút, service bỏ qua lần bấm thứ 2 | Gửi nhầm team, gửi 2 lần |
| Cuối tin ghi `FRT: <tên>` (tên nhân viên lưu trên máy) | Không biết ai chuyển case (tin luôn hiện tên bot) |
| Request không cookie, không referrer, không cache | Request mang thêm dữ liệu ngoài nội dung tin |

### Rủi ro đã biết, đang chấp nhận

- **Token lưu trên máy** đọc được bởi trang HTML khác mở bằng `file://` cùng profile Chrome (§1). Mã hóa không giúp gì (khóa nằm trong code). Đổi lại: dán 1 lần. Lộ token → làm theo "Khi lộ token" dưới.
- **Tên người chuyển do người dùng tự khai**: tool không kiểm chứng ai đang dùng máy.
- **Dữ liệu merchant đi qua Telegram API** (vốn cũng lên Telegram khi dán tay). Cần IT đồng ý cho máy công ty gọi `api.telegram.org`.

### Khi lộ token / có người nghỉ

1. @BotFather → `/revoke` → chọn bot → lấy token mới. Token cũ chết ngay.
2. Phát token mới **riêng** cho từng người (nhắn riêng / đưa trực tiếp), không gửi vào group, không email chung.
3. Mỗi người: `Gửi Telegram` → `Xóa token trên máy này` → dán token mới.

### Thêm bot vào group mới

`/setjoingroups` → Enable → thêm bot vào group (thành viên thường, **không cấp admin**: cấp admin làm group thường đổi thành supergroup, đổi ID) → lấy ID group (gửi `/start@frt_transfer_bot` trong group, mở `https://api.telegram.org/bot<token>/getUpdates`, lấy `chat.id` mới nhất) → `/setjoingroups` → Disable → ghi ID vào `chatId` của team. Xong thì `/revoke` vì token đã nằm trong lịch sử trình duyệt.
