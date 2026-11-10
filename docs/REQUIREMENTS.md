# Ticket Writer — Requirements

Viết lại từ bản 1 file `../ticket-writer.html` (version `v2026-10-16.1`). Tài liệu này mô tả **hành vi hiện có**; bản tách file phải giữ đúng như vậy. Mục 14 là yêu cầu mới cho đợt tách file và các thay đổi so với bản gốc.

---

## 1. Mục đích

Công cụ web 1 trang cho nhân viên support/tech:

1. **Viết ticket**: nhập theo mục → tool ghép ra **Title** và **Nội dung** đúng chuẩn để copy dán vào hệ thống ticket.
2. **Setup / Training thiết bị**: làm theo checklist từng bước, mỗi bước có tick / N/A / ảnh bằng chứng. Tool ghép checklist thành nội dung ticket và gom ảnh để copy từng ảnh.

Mục tiêu: ticket đồng nhất format, không quên bước, không thiếu ảnh bằng chứng.

## 2. Ràng buộc kỹ thuật

- HTML + CSS + JS thuần, không thư viện ngoài, không cần server, mở bằng trình duyệt (Chrome/Edge).
- Dữ liệu lưu trong `localStorage` của trình duyệt trên máy người dùng. Không gửi đi đâu.
- Ảnh chỉ giữ trong bộ nhớ, **mất khi tải lại trang** (cố ý, không lưu ảnh).
- Hỗ trợ dark mode theo hệ điều hành.
- Hỗ trợ gõ tiếng Việt bằng IME (Unikey…): không xử lý phím Enter/Backspace, không viết hoa khi đang gõ dấu.
- Hiện `version` cạnh tên app để biết đang mở đúng bản mới.

## 3. Bố cục giao diện

**Header**: tên app + version · các nút chọn **loại ticket** (bản mới: chọn theo cấp, xem §14.2) · chế độ xem (`Chia đôi` / `Nhập` / `Kết quả`) · `Template` · `+ Lưu template` · `Lưu offline` · `Mở file offline` (§19) · `⇄ Đổi bên` · `Ticket mới`.

**Chế độ xem**
- `Chia đôi`: trái Nhập, phải Kết quả. `⇄ Đổi bên` đảo trái/phải (chỉ bật ở Chia đôi).
- `Nhập` / `Kết quả`: chỉ hiện 1 bên.
- Màn hình hẹp (< 800px): không có Chia đôi, tự chuyển thành `Nhập`; ẩn nút Chia đôi và Đổi bên.
- `Alt+M`: xoay vòng chế độ.

**Ticket mới**: hỏi xác nhận → xóa toàn bộ nội dung ticket và ảnh. Giữ loại ticket, chế độ xem, template, danh sách Loại.

## 4. Trường chung (mọi loại ticket)

| Trường | Mô tả |
|---|---|
| **Loại** | Không có ở loại có `noCategory` (Chuyển CS/MKT). Ô chọn nhiều thẻ (chip). Danh sách có sẵn: `ABC`, `CLOVER`, `PAX`, `INTERNET`. Gõ để lọc (không phân biệt dấu), ↑/↓ chọn, Enter thêm (đang gõ dở mà bấm Tab cũng thêm mục đang sáng rồi mới sang ô kế), Backspace khi ô trống = bỏ thẻ cuối, Esc đóng. Thứ tự chọn = thứ tự trong title. Gõ tên chưa có → `+ Thêm "…"` → lưu vào danh sách riêng trên máy (viết HOA, gộp khoảng trắng, bỏ ` - `). Loại tự thêm có nút × để xóa khỏi danh sách; loại có sẵn thì không. |
| **Tóm tắt** | Đưa vào title. `Enter`: sang ô kế tiếp (như Tab). |
| **Phone** | Ô text (bàn phím số trên mobile). `Enter`: sang ô kế tiếp (như Tab). |
| **Ngôn ngữ merchant** | Chỉ ở loại có `showLang` (Chuyển CS/MKT). Chọn `ENG` / `VIE`, mặc định `ENG`. |

- Con trỏ tự vào ô **Loại** (loại không có ô Loại thì ô **Tóm tắt**) khi mở trang, đổi loại ticket, bấm `Ticket mới` hoặc dùng template (ở nhóm Viết ticket và Setup).

## 5. Title

- Có Loại: `<LOẠI 1> - <LOẠI 2> - <Tóm tắt>`; không có Loại: `<Tóm tắt>`.
- Loại không có ô Loại (Chuyển CS/MKT): title luôn chỉ là `<Tóm tắt>`. Loại đã chọn ở loại khác vẫn giữ, đổi lại thì hiện như cũ.
- Toàn bộ viết HOA. Bỏ dấu `-`/khoảng trắng thừa ở cuối phần Loại.
- Có Loại mà chưa có Tóm tắt: dấu nối vẫn hiện sẵn, vd `ABC - `.
- Ví dụ: Loại `ABC`, `CLOVER` + Tóm tắt `mất kết nối` → `ABC - CLOVER - MẤT KẾT NỐI`.

## 6. Nhóm "Viết ticket"

### 6.1 Các loại

| Key | Nhãn nút | Các mục (theo thứ tự) |
|---|---|---|
| `incident` | Hỗ trợ merchant | Vấn đề (`s1`) · Đã support (`s2`) · **Kết luận** · Việc cần làm tiếp (`s5`, chỉ hiện khi Pending) · Note (`s6`). Cuối form có khối tùy chọn **SMS Promotion** (§16) |
| `transfer` | Chuyển CS/MKT | Yêu cầu (`s1`). Không có ô Loại. Có Ngôn ngữ merchant. Cuối nội dung luôn có câu: `Nhờ team help merchant ạ. Many thanks team!` |

Mục cùng key giữa các loại (`s1`, `s2`, …) dùng chung dữ liệu → **đổi loại ticket vẫn giữ nội dung đã nhập**.

`Hỗ trợ merchant` gộp 2 loại cũ `Xử lý vấn đề` và `Xử lý yêu cầu` (`request`). Mục nào để trống thì không in. Không có Nguyên nhân / Kết quả riêng (trùng với Đã support / Kết luận). Ticket đang nhập và template cũ của `request` mở bằng `Hỗ trợ merchant`, nội dung các mục giữ nguyên theo key (§14.5).

### 6.2 Nhập một mục

- Mỗi mục là danh sách **ý**, mỗi ý là 1 ô nhập tự giãn chiều cao.
- `Enter`: tạo ý mới ngay dưới. `Shift+Enter`: xuống dòng trong cùng ý. `Backspace` ở ý trống (khi còn > 1 ý): xóa ý đó, nhảy lên ý trước. `Tab`: sang field kế tiếp (các nút phụ và ô dán ảnh không nhận Tab; đứng trong ô nhập của mục rồi Ctrl+V là ảnh vào mục đó).
- Mỗi ý có nút ↑ / ↓ (đổi thứ tự) và × (xóa; nếu chỉ còn 1 ý thì làm trống).
- Nút `+ Thêm ý`, `+ Thêm ảnh (Ctrl+V)`, ô dán ảnh.
- **Tự viết hoa chữ cái đầu mỗi dòng** (`autoCapitalize`), trừ khi từ đầu trông như link/email/đường dẫn/tên file (chứa `/ \ @ : _ .`) hoặc đã có chữ hoa bên trong (vd `iPhone`). Giữ nguyên vị trí con trỏ.

### 6.3 Kết luận

Kết luận khớp trạng thái ticket trên system:

| Giá trị | Gợi ý | Việc cần làm tiếp (`s5`) | Ghi vào nội dung |
|---|---|---|---|
| `Resolved` (mặc định) | Đã xong → Done ticket trên system | **Ẩn** trên form, không in (`hidesAction`) | Không |
| `Pending - Needs to follow up` | Chưa xong → để ticket mở, chờ follow-up | Hiện, không bắt buộc (tạm thời) | **Có** (`Kết luận: Pending - Needs to follow up`) |

- Đổi Pending → Resolved: chữ đã nhập ở Việc cần làm tiếp vẫn giữ (chỉ ẩn), đổi lại Pending là hiện lại.

- Kết luận nào cũng copy được nội dung (không khóa copy theo Kết luận).

- Không còn `Workaround applied` và `Not resolved`. Ticket / template cũ lưu 2 giá trị này (hoặc `Pending` của bản v2026-11-01.3) → mở ra thành `Resolved` (mặc định).
- Cơ chế bắt buộc vẫn còn trong code: đặt `requiresAction: true` cho `Pending - Needs to follow up` trong `config/app.js` thì `Việc cần làm tiếp` hiện nhãn `Bắt buộc` và khóa copy khi trống. Thêm `relaxWhenInitial: true` thì chưa bắt buộc khi còn ở bước đầu (chưa có nội dung ở mục nào ngoài `s1` và Note).

## 7. Nhóm "Setup / Training" (checklist)

### 7.1 Hành vi checklist

- Loại setup có 1 khối checklist (cuộn riêng, header dính trên cùng) đứng **trước** mục Note.
- Header khối: tên checklist + tiến độ `x/y mục có ảnh · n N/A`.
- Checklist chia **nhóm**; mỗi nhóm có ô `N/A cả nhóm` (tự tick khi mọi mục trong nhóm đều N/A).
- Mỗi **mục**: ô tick (done), ô `N/A`, nội dung + link (mở tab mới), danh sách ghi chú con (`sub`), dòng cảnh báo (`warn`, có thể kèm link).
- Mục con (`parent`): hiện tiêu đề cha 1 lần, các mục con thụt vào. Trong nội dung ticket ghi `<cha> – <con>`.
- **Ảnh**: mặc định mỗi mục cần 1 ảnh; `minImages: n` cần n ảnh; `noImage` không cần ảnh (không có nút/ô ảnh).
- Thêm ảnh vào mục → **tự tick done và bỏ N/A**.
- Trạng thái từng mục: `Không áp dụng` / `Không cần ảnh` / `Thiếu ảnh` / `1/2 ảnh, còn thiếu` / `n ảnh`. Mục thiếu ảnh được tô cảnh báo; mục N/A bị gạch ngang.
- `requireImages: true` → còn mục nào chưa N/A mà thiếu ảnh thì **khóa Copy nội dung**.

### 7.2 Checklist hiện có

| Key | Nhãn nút | Thiết bị · Hãng · Quy trình | Tên checklist | Nhóm |
|---|---|---|---|---|
| `newDb` | Tạo DB máy mới | POS · ABC · Ship mới — bước 1: **chuẩn bị trước khi ship**, để máy tới tiệm là dùng được ngay | Tạo DB trắng cho máy mới | Tạo DB trắng · Mở ABC, check setup (đè dữ liệu) · Tạo OneDrive · Upload lên CRM |
| `setup` | Setup POS | POS · ABC · Ship mới — bước 2: setup tại tiệm | Setup POS ABC | Setup Router (nếu có) · Setup Macdesk · Setup terminal · Setup máy POS (làm theo thứ tự) · Check ABC · Chụp checklist |
| `setupPax` | Setup PAX | Terminal · PAX (A920 / A920 Pro / A3700) · Ship mới | Setup PAX | Cần setup |
| `setupTraining` | Setup Training | Terminal · Valor (vd VL550) · Ship mới (có training) | Setup Training tiệm mới | Bước 1 → Bước 5 |
| `setupValor` | Setup Valor | Terminal · Valor · Replace | Setup Valor (Replace thiết bị) | Replace thiết bị (thay máy cũ) |

Mỗi setup đều có 2 quy trình Ship mới và Replace. Chưa có nội dung: POS ABC Replace, PAX Replace, Clover Ship mới, Clover Replace.

- **POS ABC Replace** (máy mới thay máy cũ): phải **backup data máy cũ trước khi chuyển qua máy mới**. Chưa có danh sách bước cụ thể.

Nội dung chi tiết từng bước: xem file config tương ứng (nguồn sự thật là config, không chép lại ở đây).

## 8. Định dạng Nội dung (output)

Các khối cách nhau **1 dòng trống**, theo thứ tự:

1. `Phone: <số>` — loại có ngôn ngữ thì thêm ` - ENG`/` - VIE`. Bỏ nếu không nhập. (Bản mới: ticket setup thêm dòng `Model:` ngay dưới, xem §14.3.)
2. Checklist (nếu có): mỗi nhóm 1 khối. Tên checklist **không** in ra.
   ```
   <Tên nhóm>:
   - [x] <mục đã tick>
   - [ ] <mục chưa tick>
   - [N/A] <mục N/A>
   ```
3. Các mục theo thứ tự cấu hình, bỏ mục trống:
   ```
   <Nhãn mục>:
   - <ý 1>
     <dòng 2 của ý 1>
   - <ý 2>
   ```
   (ý được trim, bỏ dòng trống; dòng tiếp theo thụt 2 khoảng trắng)
4. `Kết luận: <giá trị>` chỉ khi kết luận có `showInBody` (Pending - Needs to follow up), đặt đúng vị trí mục Kết luận.
5. Câu `footer` (nếu loại có).

Không có Phone và không có nội dung nào (checklist chưa đụng tới, các mục trống) → nội dung rỗng, không in footer.

Ví dụ `incident` (Hỗ trợ merchant), kết luận Pending - Needs to follow up:
```
Phone: 0901234567

Vấn đề:
- Terminal không kết nối được
  Từ sáng nay

Đã support:
- Restart router

Kết luận: Pending - Needs to follow up

Việc cần làm tiếp:
- Thay router mới
```

## 9. Khu Kết quả & điều kiện Copy

- Preview cập nhật sau 400ms kể từ lần gõ cuối (hiện `Đang cập nhật…`). Bấm Copy luôn render lại trước khi copy.
- **Copy title**: khóa khi title rỗng.
- **Copy nội dung**: khóa khi (a) nội dung rỗng, (b) thiếu mục đề xuất bắt buộc, hoặc (c) checklist còn mục thiếu ảnh. (b)/(c) hiện dòng cảnh báo vàng nói rõ lý do.
- Copy xong nút đổi thành `Đã copy ✓` trong 1.5s; lỗi thì báo copy tay.
- Phím tắt: `Alt+1` = Copy title, `Alt+2` = Copy nội dung, `Alt+3` = Copy SMS khi khối SMS Promotion đang bật (chữ trên nút có ghi phím). Chạy ở mọi chế độ xem, kể cả `Nhập`. Nút đang khóa → hộp thông báo lý do (title trống / dòng cảnh báo vàng). SMS Shipping không có Title nên `Alt+1` không làm gì.
- **Điền vào trang ticket** (chỉ loại ticket có Title; SMS Shipping không có; tin nhắn SMS Promotion không đi kèm):
  - Nút `Copy để điền` (trên khối Title): copy Title + Nội dung vào clipboard (JSON có đánh dấu của Ticket Writer). Khóa khi Copy title hoặc Copy nội dung đang khóa. Không gửi ảnh.
  - Nút `Cài bookmark "Điền ticket"`: hộp hướng dẫn, có nút `Điền ticket` để kéo lên thanh bookmark (bấm ở Ticket Writer thì không làm gì).
  - Bookmark `Điền ticket` chạy trên tab đang đứng: đọc clipboard (lần đầu Chrome hỏi quyền; bị chặn thì hiện ô để tự dán), rồi:
    1. Điền Title vào `input[name="subject"]`, Nội dung vào `textarea[name="description"]`, `done` vào ô `Comment *` ở khung Checklist (`.checklist .comment input`; ô không có name, placeholder trống, chữ `Comment *` là label đè lên). Phát sự kiện `input` + `change` để form nhận giá trị. Trang không có ô Comment (ticket không có khung Checklist) → bỏ qua ô này, không báo.
    2. Bấm nút có chữ `Upload File(s)` (`p.button-text`, bấm vào button chứa nó).
    - Selector, chữ `done`, chữ trên nút: `ticketFill` trong `config/app.js`.
  - Clipboard không phải dữ liệu `Copy để điền` → báo `Clipboard chưa có ticket…`, không điền. Thiếu Subject / Description / nút Upload → báo thiếu cái nào, **không điền gì** (tránh điền nửa chừng trên nhầm trang).
  - Ticket Writer không tự chuyển tab được (trình duyệt cấm trang web điều khiển tab khác): người dùng tự chuyển. Ảnh: dùng `Copy ảnh` từng ảnh rồi Ctrl+V tay.

## 10. Ảnh

- Thêm ảnh vào một mục (mục ticket hoặc mục checklist) bằng:
  - Nút `+ Thêm ảnh (Ctrl+V)`: đọc ảnh trong clipboard; clipboard không có ảnh / bị từ chối quyền → mở chọn file.
  - Click ô dán ảnh (hoặc focus vào mục) rồi `Ctrl+V`.
  - Kéo thả file ảnh vào mục.
  - Nút `Chụp màn hình kia` (mọi chỗ có ô dán ảnh): chụp 1 khung hình màn hình rồi tự thêm ảnh vào đúng mục đó (như dán ảnh, kể cả tự tick done / bỏ N/A).
    - Lần đầu hiện hộp thoại chọn màn hình của Chrome (mở sẵn tab Toàn màn hình, không cho chọn chính tab Ticket Writer); người dùng tự chọn màn hình. Trình duyệt không cho trang tự chọn sẵn màn hình nào.
    - Sau đó giữ luồng chia sẻ: các lần bấm sau chụp ngay, không hỏi lại. Chrome hiện thanh "Đang chia sẻ màn hình"; bấm "Dừng chia sẻ" hoặc tải lại trang thì lần sau hỏi lại.
    - Nút `⇄` cạnh nút chụp: đổi giữa `Chụp màn hình kia` (mặc định) và `Chụp màn hình này sau 3s` (màn hình đang mở Ticket Writer; chờ 3s sau khi đã chọn màn hình rồi mới chụp, để kịp chuyển sang tab cần chụp). Đổi chung cho mọi mục, chỉ trong phiên (tải lại trang về mặc định). Mỗi bên nhớ màn hình đã chọn riêng.
    - Hủy hộp thoại / trình duyệt không hỗ trợ → nút báo `Chưa chụp được màn hình`, không thêm ảnh.
- Ctrl+V khi không đứng trong mục nào → dán vào mục được focus gần nhất (nếu còn hiển thị), không thì mục đầu tiên. Không bắt Ctrl+V khi đang ở ô nhập text không thuộc mục, khi có dialog mở, hoặc khi clipboard có cả text.
- Đọc nguyên file gốc, không nén.
- Ảnh hiện thumbnail trong ô dán, có × để xóa; ô dán đổi màu `✓ Đã có n ảnh`.
- Khu Kết quả có khối **Ảnh**: liệt kê mọi ảnh theo thứ tự nội dung (checklist trước, rồi các mục), nhãn `<nhóm> – <mục>` (mục ticket: `<mục>`), thêm ` – ảnh n` khi mục có từ 2 ảnh. Nhãn ảnh được rút gọn: bỏ ghi chú trong ngoặc ở tên nhóm / `parent` (vd `(nếu có)`, `(làm theo thứ tự)`); tên mục trùng tên nhóm thì chỉ ghi 1 lần (vd `Setup terminal`). Ngoặc trong tên mục vẫn giữ (vd `Terminal (Dual Pricing)`). Nội dung ticket không đổi. Mỗi ảnh nút `Copy ảnh` (copy PNG vào clipboard) → đánh dấu `✓ Đã copy`, đếm `x/y đã copy`.
- Nút `Tải tất cả (ZIP)` ở đầu khối Ảnh: tải mọi ảnh đang hiện thành 1 file `.zip` (không nén, giữ nguyên file gốc).
  - Tên file ZIP = title ticket; title trống → `anh-ticket.zip`.
  - Tên ảnh bên trong = `<số thứ tự> <nhãn>.<đuôi>`, vd `01 Can setup - Check MID.png`, `03 Setup terminal - anh 1.png`. Số thứ tự theo thứ tự trong khối Ảnh, tối thiểu 2 chữ số.
  - Tên file bỏ dấu, chỉ giữ ASCII (Explorer Windows bản cũ hiện sai tên tiếng Việt trong ZIP); ký tự Windows cấm (`\ / : * ? " < > |`) và ký tự ngoài ASCII (vd `–`) đổi thành `-`; tối đa 80 ký tự.
  - Đuôi theo loại ảnh (`image/jpeg` → `jpg`, còn lại lấy phần sau `image/`).
  - Tải xong nút đổi thành `Đã tải ✓` trong 1.5s; lỗi → `Không tạo được file ZIP`. Không đổi trạng thái `✓ Đã copy` của ảnh.
- Nút `Tải PDF` cạnh nút ZIP: tải mọi ảnh đang hiện thành 1 file `.pdf` để biết ảnh nào của mục nào.
  - Mỗi trang 1 ảnh, theo đúng thứ tự khối Ảnh. Khổ A4; ảnh ngang (rộng > cao) thì trang ngang.
  - Đầu trang ghi nhãn y như khối Ảnh, vd `Cần setup – Check MID` (giữ dấu tiếng Việt). Ngoài nhãn không in gì khác.
  - **Giữ nguyên độ nét**: JPEG nhúng nguyên file gốc; PNG và định dạng khác giữ đủ từng pixel (nén không mất dữ liệu, giữ cả vùng trong suốt). Ảnh không bị thu nhỏ trong file; trang chỉ quyết định cỡ hiển thị, phóng to trong trình xem PDF vẫn nét như ảnh gốc.
  - Ảnh vừa khung trang, không phóng to quá cỡ gốc (1 pixel = 1 point) để ảnh nhỏ không vỡ hạt.
  - Ảnh điện thoại có hướng xoay EXIF hiện đúng chiều như trên trình duyệt.
  - Tên file = ngày giờ tải theo giờ máy dạng `MMDD - HHmm` + ` - ` + tên như ZIP, đuôi `.pdf`: vd `1101 - 1448 - ABC - Loi in.pdf` (01/11 lúc 14:48); title trống → `1101 - 1448 - anh - ticket.pdf`. Title ticket ghi vào thuộc tính Title của file PDF.
  - Tải xong nút đổi thành `Đã tải ✓` trong 1.5s; lỗi (vd ảnh không đọc được) → `Không tạo được file PDF`.
- Bấm thumbnail → xem ảnh lớn: ‹ Trước / Sau › (phím ← →), `Xem kích thước gốc` / `Vừa khung` (hoặc bấm vào ảnh), Esc hoặc bấm nền để đóng.

## 11. Template

- `+ Lưu template`: lưu ticket hiện tại, **tên = title**. Trùng tên → hỏi ghi đè. Chưa có title → báo cần nhập Loại/Tóm tắt.
- Template lưu: loại ticket, Loại, Tóm tắt, Kết luận, các mục (đã bỏ ý trống). (Bản gốc lưu thêm `variant`; bản mới bỏ qua trường này, template cũ vẫn dùng được.) **Không lưu** Phone, trạng thái checklist, ảnh.
- `Template` (`Alt+T`): dialog tìm theo Tóm tắt (phần sau `LOẠI - ` của title, không tìm theo Loại), không phân biệt dấu, khớp mọi từ, sắp theo tên. Enter = dùng kết quả đầu. Mỗi dòng có × xóa (hỏi xác nhận).
- Dùng template: nếu đang có nội dung → hỏi xác nhận; ghi đè mọi thứ trừ Phone; chuyển sang loại của template.
- `Xuất JSON`: tải `ticket-templates.json` gồm `{ templates, categories }` (categories = Loại tự thêm).
- `Nhập JSON`: gộp theo tên (trùng thì ghi đè), bỏ mục không hợp lệ, thêm Loại mới; báo số mới / ghi đè / bỏ qua.

## 12. Lưu trữ (localStorage)

| Key | Nội dung |
|---|---|
| `ticketWriter.v1` | Loại đang chọn, chế độ xem, đổi bên, ticket đang nhập (Loại, Tóm tắt, Phone, ngôn ngữ, variant, kết luận, các mục, tick/N/A checklist), form SMS Promotion (trường `sms`, gồm ô tick `enabled`, ngôn ngữ tin nhắn `lang` và option tự thêm `customOptions`; ảnh không lưu), form SMS Shipping (trường `shipping`), form SMS Xin review (trường `review`: bang `usState`, ngôn ngữ `lang`) |
| `ticketWriter.staff.v1` | Tên nhân viên (form SMS Xin review). Lưu riêng để `Ticket mới` không xóa |
| `ticketWriter.templates.v1` | Danh sách template |
| `ticketWriter.categories.v1` | Loại tự thêm |

- Lưu sau mỗi thay đổi. Dữ liệu hỏng/không hợp lệ → bỏ qua phần đó, dùng mặc định.
- Đọc được format cũ (`data[type]` lưu riêng từng loại).
- localStorage bị chặn → app vẫn chạy, chỉ không lưu (template thì báo lỗi).

## 13. Tính năng có sẵn trong code nhưng chưa dùng

- **`variants` (ô "Trường hợp")**: bản gốc có code cho tính năng này nhưng không loại nào dùng. Bản mới **đã bỏ** (Ship mới / Replace làm bằng file riêng theo §14.2). Dữ liệu `variant` trong state/template cũ được bỏ qua.

## 14. Yêu cầu mới — đợt tách file

### 14.1 Tách file

1. Tách 1 file HTML thành nhiều file nhỏ theo clean architecture, clean code, SOLID (quy ước ở CLAUDE.md). **Hành vi và output giữ nguyên** như mục 1–13, trừ cách chọn loại ticket (14.2), dòng Model (14.3), các bổ sung ở 14.4 và loại Hỗ trợ merchant (14.5).
2. `index.html` là file chính: double-click là chạy, không cần server hay cài đặt. Các file khác nằm cùng folder; gửi đồng nghiệp bằng cách nén cả folder.
3. Phần **Viết ticket** và phần **Setup / Training** tách riêng.
4. **Viết ticket** gồm các loại, mỗi loại 1 file: Hỗ trợ merchant (đã gộp Xử lý vấn đề + Xử lý yêu cầu, §14.5), Chuyển CS/MKT. Chỉ có 2 team nhận chuyển là **CS** và **MKT**; giữ 1 loại `transfer` như hiện tại.
5. **Setup / Training**: mỗi checklist 1 file, đặt theo Thiết bị → Hãng → Quy trình.
6. Dữ liệu đã lưu ở bản cũ (ticket đang nhập, template, Loại tự thêm) vẫn dùng được ở bản mới.

### 14.2 Chọn loại ticket theo cấp (thay hàng nút phẳng)

**Cấp 1 — Nhóm**: `Viết ticket` | `Setup / Training` | `SMS`.

`Setup / Training` đang **tạm ẩn** (`hidden: true` trong `config/app.js`): không hiện nút; phiên đã lưu ở nhóm này mở lại về `Viết ticket`, chữ đã nhập vẫn giữ. Dùng template loại setup thì vẫn mở checklist.

**SMS** → chọn loại tin nhắn: `Shipping` (xem §17) | `Xin review` (xem §18). SMS Promotion nằm trong `Hỗ trợ merchant` (xem §16), không còn tab riêng.

**Viết ticket** → chọn loại: `Hỗ trợ merchant` | `Chuyển CS/MKT`.

**Setup / Training** → chọn lần lượt:

| Cấp | Lựa chọn | Khi nào hiện |
|---|---|---|
| Thiết bị | `POS` · `Terminal` | Luôn |
| Hãng | POS: `ABC` · Terminal: `Valor (VL)`, `PAX`, `Clover` | Luôn |
| Model | Valor: `VL100`, `VL100 Pro`, `VL550` · PAX: `A920`, `A920 Pro`, `A3700` · Clover: `Clover Flex`, `Clover Mini`. Sẽ thêm model trong tương lai | Hãng có model (1 model thì tự chọn) |
| Quy trình | `Ship mới` · `Replace` | Luôn |
| Checklist | Các checklist của nhánh đó theo thứ tự làm, vd POS ABC Ship mới: `Tạo DB máy mới` (chuẩn bị trước khi ship) → `Setup POS` (tại tiệm) | Nhánh có ≥ 2 checklist |

- Mỗi thiết bị/hãng đều có cả 2 quy trình Ship mới và Replace.
- Nhánh chưa có checklist: vẫn chọn được, form báo "Chưa có checklist cho <Thiết bị · Hãng · Model · Quy trình>" kèm đường dẫn file cần tạo; Title/Nội dung trống, không copy được.
- Đổi cấp trên → cấp dưới giữ lựa chọn nếu vẫn hợp lệ ở nhánh mới (vd đổi PAX → Valor vẫn giữ Ship mới), không thì về lựa chọn đầu tiên (vd model A920 không có ở Valor → VL100).
- Nhớ nhánh đang chọn giữa các lần mở (localStorage).
- Danh mục Thiết bị / Hãng / Model khai báo trong `config/setup/catalog.js` (docs/CONFIG.md §2). Thêm model mới chỉ cần sửa file này.

### 14.3 Ghi Model vào nội dung ticket

- Ticket setup của hãng có model: thêm dòng `Model: <model đang chọn>` ngay sau dòng Phone (hoặc là dòng đầu nếu không có Phone), cùng khối với Phone.
- Hãng không có model (POS ABC): không có dòng này.
- Đây là thay đổi output duy nhất so với bản gốc; test golden của loại setup phải tính dòng này.

Ví dụ:
```
Phone: 0901234567
Model: A920 Pro

Cần setup:
- [x] Check QC note
```

### 14.4 Bổ sung so với bản gốc (không đổi Title / Nội dung)

Chỉ thêm thao tác và cách tải ảnh; Title, Nội dung, điều kiện copy vẫn giống hệt bản gốc (test golden không đổi).

| Bổ sung | Chi tiết |
|---|---|
| Con trỏ tự vào ô **Loại** khi mở trang, đổi loại, `Ticket mới`, dùng template | §4 |
| Ô Loại: đang gõ dở mà bấm `Tab` thì thêm mục đang sáng | §4 |
| `Enter` ở Tóm tắt / Phone: sang ô kế tiếp | §4 |
| Ô dán ảnh không nhận `Tab` (Tab đi thẳng từ mục này sang mục kế) | §6.2 |
| `Alt+1` / `Alt+2`: Copy title / Copy nội dung; nút đang khóa thì báo lý do | §9 |
| Nút `Tải PDF`: mọi ảnh thành 1 file PDF, mỗi trang 1 ảnh kèm nhãn mục, giữ nguyên độ nét | §10 |
| Nút `Chụp màn hình kia` / `⇄ Chụp màn hình này` ở mọi ô dán ảnh: chụp rồi tự thêm ảnh vào mục | §10 |
| `Copy để điền` + bookmark `Điền ticket`: điền Subject / Description / Comment ở Checklist (`done`) rồi bấm `Upload File(s)` trên trang ticket | §9 |
| Nhãn ảnh gọn (khối Ảnh, ZIP, PDF): bỏ ghi chú trong ngoặc ở nhóm, không lặp tên nhóm, chỉ đánh số khi ≥ 2 ảnh | §10 |

Đổi config checklist sau bản gốc (Nội dung khác bản gốc đúng ở chỗ này; test golden ghi rõ từng ca trong `CHANGED_SINCE_ORIGINAL`):

| Checklist | Thay đổi |
|---|---|
| Setup POS (`setup`) | Không cần ảnh: Cài Macdesk Client, Xóa các phần mềm remote khác, Xóa OneDrive cũ…, Sync data từ ondrive về, Tải font cho All users, Extract rồi chạy !RUNTHISFIRST, Cần connect máy in…, Nếu là PAX cần check Authorize Payment… |
| Tạo DB máy mới (`newDb`) | Không cần ảnh: Pricing – Admin, Appointment, Tạo OneDrive. Thêm nhóm cuối **Upload lên CRM**: `Upload shop email + naildata lên ticket crm` (không cần ảnh) |
| Setup PAX (`setupPax`) | Không cần ảnh: Check Display / Screen. Thêm bước cuối `Close batch sau khi test sale` (không cần ảnh) |

### 14.5 Gộp Xử lý vấn đề + Xử lý yêu cầu thành Hỗ trợ merchant

Theo góp ý người dùng: viết ticket theo 1 mạch "vấn đề → đã support → kết quả → note", và `Workaround applied` mà vẫn Done ticket thì không hợp lý. **Đây là chỗ duy nhất Nội dung khác hẳn bản gốc** (test golden ghi đè cả nội dung các ca `incident` / `request`).

| Trước | Sau |
|---|---|
| 2 loại `incident` (Xử lý vấn đề), `request` (Xử lý yêu cầu) | 1 loại `incident`, nhãn `Hỗ trợ merchant`; `request` khai báo trong `formerKeys` |
| Hiện trạng / Yêu cầu (`s1`) | Vấn đề |
| Troubleshoot / Action (`s2`) | Đã support |
| Nguyên nhân phát hiện (`s3`) | Bỏ (trùng Đã support); dữ liệu cũ ở mục này không còn hiện / in |
| Hướng khắc phục đề xuất / Hành động đề xuất (`s5`) | Việc cần làm tiếp (không bắt buộc; chỉ hiện khi Pending) |
| Kết luận `Resolved` / `Workaround applied` / `Not resolved` | `Resolved` (mặc định) / `Pending - Needs to follow up` (§6.3) |

Dữ liệu cũ: state đang mở `request` → mở `Hỗ trợ merchant`; template `type: 'request'` vẫn hiện, dùng được, giữ nguyên key trong file lưu. Kết luận cũ không còn → `Resolved` (mặc định).

## 15. Ghi nhận từ bản gốc (chưa sửa, cần xác nhận)

- Chính tả trong checklist: `ondrive` (OneDrive), `systemm_exe250925.exe` vs `system_exe` ở checklist Tạo DB.
- Link Notion của cảnh báo Router và "Setup terminal" trùng nhau (cùng trang Troubleshooting-Methodology) — có thể là link tạm.
- `CLOVER` có trong danh sách Loại nhưng chưa có checklist Clover.

## 16. SMS Promotion

Khối tùy chọn ở cuối form `Viết ticket` → `Hỗ trợ merchant` (cờ `smsPromotion` của loại). Soạn tin nhắn gửi tiệm xác nhận trước khi chạy SMS promotion.

- Có ô tick `SMS Promotion`. Chưa tick: các ô SMS ẩn, ticket như thường. Tick: mở các ô bên dưới và khối SMS ở Kết quả; bỏ tick thì ẩn lại, dữ liệu vẫn giữ.
- Khối ở khu Nhập và khối tin nhắn ở khu Kết quả có màu riêng (`--sms-bg`, `--sms-line`) để tách khỏi phần ticket.
- Không có ở loại khác: đổi sang `Chuyển CS/MKT` thì ẩn khối, về lại `Hỗ trợ merchant` thì hiện như cũ.
- Không phải một phần của ticket: không vào Title, Nội dung, `Copy để điền`; không lưu vào template.
- Bản trước có tab `SMS` → `Promotion` riêng: phiên đã lưu đang ở tab đó mở lại ở `Hỗ trợ merchant` với ô tick đã bật; phiên khác giữ dữ liệu SMS, ô tick tắt.

### 16.1 Form

| Trường | Mô tả |
|---|---|
| **Ngôn ngữ tin nhắn** | Chọn 1: `English` (mặc định) / `Tiếng Việt`. Đổi ngôn ngữ chỉ đổi câu chữ tin nhắn, dữ liệu form giữ nguyên. |
| **Tên tiệm** | Ô text. In ra đúng như gõ (đã trim). |
| **Phone tiệm** | Ô text (bàn phím số điện thoại trên mobile). Số Mỹ 10 số (có thể có `1` / `+1` đầu) gõ kiểu nào cũng in ra `(555) 123-4567`; không đúng dạng đó thì in như đã gõ (đã trim). Ô nhập giữ nguyên chữ đã gõ. |
| **Recipients** | Ô text (bàn phím số trên mobile). |
| **Type Customer** | Chọn nhiều. Mỗi lựa chọn là 1 ô tick kèm ô số sửa được, vd `Last Visit <= [365]`, `Last Visit >= [90]`, `Times visit between [1] - [10000]`; `All customers` chỉ có ô tick, không có ô số. Danh sách + số mặc định ở `config/sms/promotion.js`. Thêm điều kiện khác bằng `+ Thêm option` (ô text tự gõ, có ×; Enter thêm option mới, Backspace ở ô trống xóa option). Option tự thêm chỉ thuộc promotion đang soạn, không thành lựa chọn cố định. Có ảnh như mục ticket (§10): nút `+ Thêm ảnh (Ctrl+V)`, ô dán ảnh, kéo thả; Ctrl+V ảnh khi đang đứng trong khối Type Customer cũng vào đây. |
| **Message** | Ô nhập nhiều dòng. Không tự viết hoa. |
| **Price per SMS** | Chọn 1 trong `0.02` / `0.04` / `0.06` / `0.08`, mặc định `0.02`. |

### 16.2 Tin nhắn (output)

```
Greeting,

Please confirm the details below before we send your SMS promotion:

Recipients: <Recipients> customers
Type Customer:
- <lựa chọn đã tick 1>
- <lựa chọn đã tick 2>
Message:
"<Tên tiệm> <Phone tiệm> <Message> Reply STOP To Optout."
Price per SMS: $<giá>
Estimate Total: $<giá × Recipients>

Please carefully review the content of the Promotion message, and only when you are sure that there are no further changes should you text "OK" to this phone number. Have a nice day.
```

- Type Customer: mục có sẵn đã tick theo thứ tự config (không theo thứ tự tick, số đã trim), rồi tới option tự thêm (bỏ option trống).
- Dòng trong ngoặc kép là tin khách nhận, ghép theo mẫu `promoText` trong config, giống nhau ở cả 2 ngôn ngữ. Message đã có sẵn cặp ngoặc kép bao ngoài thì bỏ cặp đó, chỉ giữ cặp bao cả dòng.
- Chưa nhập gì (Tên tiệm, Phone tiệm, Recipients, Message trống, chưa tick Type Customer) → tin nhắn rỗng.
- **Estimate Total** = Price per SMS × Recipients, 2 số lẻ, có dấu phẩy hàng nghìn (vd `3178` × `0.02` → `$63.56`, `50000` × `0.08` → `$4,000.00`). Recipients gõ `3,178` vẫn tính được. Recipients trống hoặc không phải số nguyên → bỏ dòng này.
- **Tiếng Việt**: cùng bố cục, câu chữ tiếng Việt (vd `Xin chào,`, `Số khách nhận: <Recipients> khách`, `Nhóm khách:`, `Lần ghé gần nhất <= 365 ngày`, `Giá mỗi SMS: $<giá>`, `Tổng chi phí dự kiến: $<tổng>`). Option tự thêm in nguyên văn ở cả 2 ngôn ngữ.
- Câu chữ từng dòng của từng ngôn ngữ nằm trong config (`languages[].lines`), sửa không cần đụng `src/`.

### 16.3 Khu Kết quả & Copy

- Khi tick: khối `SMS Promotion` hiện dưới khối Nội dung, có nút `Copy SMS (Alt+3)` riêng. Title, Nội dung, `Copy title`, `Copy nội dung`, `Copy để điền` giữ nguyên như khi chưa tick.
- **Copy SMS** khóa khi tin nhắn rỗng hoặc còn thiếu: Tên tiệm, Phone tiệm, Recipients, Type Customer (chưa tick mục nào và chưa có option tự thêm, hoặc mục đã tick còn ô số trống), Message. Dòng cảnh báo vàng trong khối SMS: `Còn thiếu: <các trường>. Điền đủ rồi mới copy được.` SMS thiếu trường không khóa các nút copy của ticket.
- Khối **Ảnh**: ảnh Type Customer (nhãn `Type Customer`, từ 2 ảnh thì `Type Customer – ảnh n`) hiện sau ảnh ticket khi đang tick, nên cũng nằm trong `Tải tất cả (ZIP)` và `Tải PDF` (§10). Ảnh không ảnh hưởng điều kiện copy.
- Ctrl+V ảnh khi đứng trong khối Type Customer → vào ảnh Type Customer; không đứng ở ô nào → mục focus gần nhất, không thì mục đầu của ticket.
- `Ticket mới`: hỏi xác nhận → xóa cả ticket, form SMS (kể cả option tự thêm và ảnh Type Customer) và bỏ tick.
- Dùng template không đụng form SMS.


## 17. SMS Shipping

Nhóm `SMS` → `Shipping`. Soạn tin nhắn báo tiệm thiết bị đã gửi đi qua UPS. Không phải loại ticket: không có Title, không lưu template, không có ảnh.

### 17.1 Form

| Trường | Mô tả |
|---|---|
| **Tên merchant** | Ô text, gõ cả cách xưng hô (vd `Ms Terri`). In ra đúng như gõ (đã trim). |
| **Tracking Number** | Ô text. In ra đúng như gõ (đã trim). |
| **Estimated Delivery** | Ô text, dán nguyên nội dung (vd `November 02 , 9:30 A.M. - 12:30 P.M.`). In ra đúng như gõ (đã trim). Bản trước chưa có → để trống; bản trước lưu ngày dạng `YYYY-MM-DD` thì hiện nguyên chuỗi đó. |

### 17.2 Tin nhắn (output)

```
Dear <Tên merchant>,

We wanted to inform you that your equipment has been shipped via UPS. Below are the details for your reference:

Tracking Number: <Tracking Number>
Estimated Delivery: <Estimated Delivery>

Important: Once your equipment arrives, please call us at +1 888-873-7799 at least 24 hours in advance to schedule your setup & training appointment. This allows our technician to prepare and ensures your terminal is ready to use as soon as possible. If you have any questions or need further assistance, please do not hesitate to reach out to us.

Have a good day!
```

- Không có dòng Shipment Date.
- Chưa nhập gì → tin nhắn rỗng.
- Câu chữ từng dòng nằm trong `config/sms/shipping.js` (`lines`), sửa không cần đụng `src/`.

### 17.3 Khu Kết quả & Copy

- Ẩn khối Title; có khối Nội dung + `Copy nội dung`. Không có khối Ảnh; Ctrl+V ảnh không làm gì.
- `Alt+2` = Copy nội dung (§9); `Alt+1` không làm gì vì không có Title.
- **Copy nội dung** khóa khi tin nhắn rỗng hoặc còn thiếu Tên merchant / Tracking Number / Estimated Delivery. Dòng cảnh báo vàng: `Còn thiếu: <các trường>. Điền đủ rồi mới copy được.`
- `+ Lưu template` bị khóa.
- `Ticket mới`: hỏi xác nhận → xóa form SMS Shipping, không đụng ticket và khối SMS Promotion.
- Form SMS Shipping và ticket (kể cả khối SMS Promotion) lưu riêng: chuyển qua lại giữa các nhóm không mất dữ liệu bên nào.


## 18. SMS Xin review

Nhóm `SMS` → `Xin review`. Soạn tin mời merchant đánh giá trên Google, link theo chi nhánh phụ trách bang của merchant. Không phải loại ticket: không có Title, không lưu template, không có ảnh.

### 18.1 Form

| Trường | Mô tả |
|---|---|
| **Bang** | Ô text có gợi ý. Gõ chữ viết tắt của bang (vd `TX`), không phân biệt hoa thường; tên đầy đủ (`Texas`) không nhận. Gợi ý chỉ lọc theo chữ viết tắt bắt đầu bằng phần đã gõ (gõ `t` → `TN`, `TX`; gõ `b` → không có), xếp A→Z, có kèm tên bang để tra. Tìm thấy thì hiện `Chi nhánh: <tên>` ngay dưới ô. |
| **Ngôn ngữ tin nhắn** | Chọn 1: `English` (mặc định) / `Tiếng Việt`. |
| **Tên nhân viên** | Ô text. Nhập 1 lần, lưu riêng trên máy (key `ticketWriter.staff.v1`): F5 hay `Ticket mới` đều không mất, chỉ đổi khi nhân viên tự sửa. Chưa đưa vào tin nhắn; dùng cho nút Copy dòng Excel (§18.4, chưa làm). |

### 18.2 Tin nhắn (output)

```
Greeting,

Thank you for contacting MAC USA. If you have a moment, we’d appreciate hearing about your experience on Google: <link>

Have a nice day!
```

```
Xin chào,

Cảm ơn anh/chị đã liên hệ MAC USA. Nếu có thời gian, anh/chị có thể chia sẻ trải nghiệm của mình trên Google tại đây: <link>

Chúc anh/chị một ngày tốt lành!
```

- `<link>` = link của chi nhánh phụ trách bang đó. Bảng 51 bang (50 bang + DC) → 3 chi nhánh Arlington / Atlanta / Houston, cùng câu mời, nằm trong `config/sms/review.js`, sửa không cần đụng `src/`.
- Chưa nhập bang hoặc bang không có trong danh sách → tin nhắn rỗng.

### 18.3 Khu Kết quả & Copy

- Ẩn khối Title; có khối Nội dung + `Copy nội dung`. Không có khối Ảnh; Ctrl+V ảnh không làm gì.
- `Alt+2` = Copy nội dung (§9); `Alt+1` không làm gì vì không có Title.
- **Copy nội dung** khóa khi tin nhắn rỗng. Gõ bang không có trong danh sách thì có dòng cảnh báo vàng: `Còn thiếu: Bang hợp lệ. Điền đủ rồi mới copy được.`
- `+ Lưu template` bị khóa.
- `Ticket mới`: hỏi xác nhận → xóa form SMS Xin review (giữ Tên nhân viên), không đụng ticket và các form SMS khác.

### 18.4 Kế hoạch (chưa làm): nút Copy dòng Excel

- Mục tiêu: 1 nút ghép thông tin lần xin review thành 1 dòng, các cột cách nhau bằng Tab, copy để dán vào Excel Online (Microsoft) là tự chia vào từng ô.
- Có cột Tên nhân viên (§18.1). Chưa nhập Tên nhân viên → cảnh báo `Còn thiếu: Tên nhân viên` và khóa nút này.
- **Đang chờ manager chốt** danh sách cột và thứ tự cột trong sheet. Cột nào form chưa có (vd Tên tiệm, Phone) thì thêm ô nhập khi chốt.

## 19. Ticket offline (ticket system không vào được)

Lưu ticket ra file trên máy, khi ticket system vào lại được thì mở file, nạp lại vào form rồi dùng `Copy để điền` + bookmark `Điền ticket` (§9) như bình thường. Không lưu gì trong browser: file nằm ở thư mục Downloads, không mất khi xóa dữ liệu Chrome, mang sang máy khác được.

### 19.1 Lưu offline

- Nút `Lưu offline` ở header. Khóa khi không có loại ticket (nhóm SMS, nhánh setup chưa có checklist). Ticket trống (chưa có title lẫn nội dung) → báo, không mở hộp.
- Hộp hỏi: **Business zipcode** và **Ticket type** (ô text, nhân viên tự điền), đều bắt buộc. Có ảnh thì có thêm ô tick `Tải kèm PDF ảnh` (mặc định không tick).
- Bấm `Lưu` → tải **đúng 1 file** (Chrome tự chặn file thứ 2 trở đi trong cùng 1 lần bấm). Mọi file dùng chung **tên gốc** `OFF-YYYYMMDD-HHmmss - <TITLE>` (chỉ ASCII như §10, mã OFF-… theo giờ máy lúc lưu):
  - Không có ảnh → `<tên gốc>.json`.
  - Có ảnh → `<tên gốc>.zip`, bên trong: `<tên gốc>.json`, các ảnh (đặt tên như `Tải tất cả (ZIP)`), và `<tên gốc>.pdf` nếu có tick (giống `Tải PDF`).
- File `.json` gồm: mã, giờ lưu, loại ticket, zipcode, ticket type, title, nội dung, tên file ZIP / PDF, toàn bộ ticket đang nhập (Loại, Tóm tắt, Phone, các mục, Kết luận, tick/N/A checklist).
- Tạo PDF lỗi → ZIP không có PDF, báo. Tạo ZIP lỗi → chỉ tải `.json` (giữ được phần chữ), báo để tự bấm `Tải tất cả (ZIP)` / `Tải PDF`.
- Lưu xong form giữ nguyên; muốn làm ticket khác thì bấm `Ticket mới`.

### 19.2 Mở file offline

- Nút `Mở file offline` → nếu đang có nội dung hoặc ảnh thì hỏi xác nhận → chọn file `.zip` (đọc file `.json` bên trong, không cần giải nén) hoặc file `.json`.
- File đúng → chuyển về đúng loại ticket / nhánh setup trong file, thay toàn bộ ticket đang nhập, bỏ ảnh đang dán; báo mã, Business zipcode, Ticket type, file ZIP chứa ảnh (+ PDF).
- File không phải ticket offline / loại ticket trong file không còn → báo, không đổi gì.
- Ảnh không tự nạp lại: giải nén ZIP rồi dán / kéo thả vào từng mục (tên ảnh trong ZIP ghi mục nào).
