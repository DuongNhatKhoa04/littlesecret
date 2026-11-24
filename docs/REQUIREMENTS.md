# Ticket Writer — Requirements

Tài liệu này mô tả **hành vi hiện có** của tool, tới từng câu chữ. Đổi hành vi → sửa tài liệu trong cùng lần sửa code.

- Tool được viết lại từ bản 1 file `ticket-writer.html` (version `v2026-10-16.1`). Bản gốc **không nằm trong repo**; output chuẩn của nó được chụp lại trong `tests/golden-expected.js` (xem CLAUDE.md).
- **Không đánh số lại các mục**: code, test và tài liệu khác tham chiếu theo số (vd §14.3). Mục mới đánh số tiếp theo.
- Lịch sử thay đổi theo version: [CHANGELOG.md](../CHANGELOG.md). Rủi ro bảo mật: [SECURITY.md](SECURITY.md).

## Mục lục

| § | Nội dung | Trạng thái |
|---|---|---|
| 1–3 | Mục đích, ràng buộc kỹ thuật, bố cục giao diện | Hiện hành |
| 4–5 | Trường chung (Loại, Tóm tắt, Phone…), Title | Hiện hành |
| 6 | Nhóm Viết ticket (Hỗ trợ merchant, Chuyển case), Kết luận | Hiện hành |
| 7 | Nhóm Setup / Training (checklist) | Hiện hành, **nhóm đang tạm ẩn** (§14.2) |
| 8–9 | Định dạng Nội dung, khu Kết quả & điều kiện Copy, Điền ticket | Hiện hành |
| 10 | Ảnh: dán, chụp, đổi thứ tự, ZIP, PDF, xóa hết | Hiện hành |
| 11–12 | Template, lưu trữ (localStorage + IndexedDB) | Hiện hành |
| 13 | Tính năng bản gốc đã bỏ (`variants`) | Ghi chú lịch sử |
| 14 | Thay đổi trong đợt tách file so với bản gốc (chọn loại theo cấp, dòng Model, gộp Hỗ trợ merchant…) | **Vẫn hiện hành**; tên mục là lịch sử |
| 15 | Ghi nhận từ bản gốc | **Chờ người phụ trách xác nhận** |
| 16–18 | SMS Promotion, Shipping, Xin review | Hiện hành; §16.4, §18.4 **kế hoạch, chưa làm** |
| 19 | Ticket offline | Hiện hành |
| 20 | Cảnh báo lưu trữ | Hiện hành |
| 21 | Nhận ảnh iPad / iPhone (phone-upload) | Hiện hành; rủi ro ở SECURITY.md §3 |
| 22 | Chuyển case (pass case cho Sales / MKT / CS / Tech), lấy thông tin tiệm từ trang ticket / Lead (§22.4); Tech Assign (§22.5) đã bỏ | Hiện hành |
| 23 | Sao lưu / khôi phục dữ liệu | Hiện hành |

---

## 1. Mục đích

Công cụ web 1 trang cho nhân viên support/tech:

1. **Viết ticket**: nhập theo mục → tool ghép ra **Title** và **Nội dung** đúng chuẩn để copy dán vào hệ thống ticket.
2. **Setup / Training thiết bị**: làm theo checklist từng bước, mỗi bước có tick / N/A / ảnh bằng chứng. Tool ghép checklist thành nội dung ticket và gom ảnh để copy từng ảnh.

Mục tiêu: ticket đồng nhất format, không quên bước, không thiếu ảnh bằng chứng.

## 2. Ràng buộc kỹ thuật

- HTML + CSS + JS thuần, không thư viện ngoài, không cần server, mở bằng trình duyệt (Chrome/Edge).
- Dữ liệu lưu trong `localStorage` của trình duyệt trên máy người dùng. Không gửi đi đâu.
- Ảnh lưu trong **IndexedDB** của trình duyệt (§12): tải lại trang / mở lại Chrome vẫn còn. `Ticket mới` và `Mở file offline` xóa ảnh. IndexedDB bị chặn/đầy → ảnh chỉ giữ trong bộ nhớ như trước, không báo lỗi.
- Giao diện sáng / tối: nút ở header xoay vòng `◐ Tự động` (theo hệ điều hành, mặc định) → `☀ Sáng` → `☾ Tối`. Lựa chọn lưu riêng trên máy (§12), giữ qua F5 và `Ticket mới`.
- Hỗ trợ gõ tiếng Việt bằng IME (Unikey…): không xử lý phím Enter/Backspace, không viết hoa khi đang gõ dấu.
- Hiện `version` cạnh tên app để biết đang mở đúng bản mới.

## 3. Bố cục giao diện

**Header**: tên app + version · các nút chọn **loại ticket** (bản mới: chọn theo cấp, xem §14.2) · chế độ xem (`Chia đôi` / `Nhập` / `Kết quả`) · `Template` · `+ Lưu template` · `Lưu offline` · `Mở file offline` (§19) · `Sao lưu` · `Khôi phục` (§23) · `⇄ Đổi bên` · `Nhận ảnh iOS` (§21) · nút giao diện (`◐ Tự động` / `☀ Sáng` / `☾ Tối`) · `Ticket mới`.

**Chế độ xem**
- `Chia đôi`: trái Nhập, phải Kết quả. `⇄ Đổi bên` đảo trái/phải (chỉ bật ở Chia đôi).
- `Nhập` / `Kết quả`: chỉ hiện 1 bên.
- Màn hình hẹp (< 800px): không có Chia đôi, tự chuyển thành `Nhập`; ẩn nút Chia đôi và Đổi bên.
- `Alt+M`: xoay vòng chế độ.

**Ticket mới**: hỏi xác nhận → xóa toàn bộ nội dung ticket và ảnh. Giữ loại ticket, chế độ xem, template, danh sách Loại.

## 4. Trường chung (mọi loại ticket)

| Trường | Mô tả |
|---|---|
| **Loại** | Không có ở loại có `noCategory` (Chuyển CS/MKT). Ô chọn **1 loại** (hiện thành thẻ chip). Danh sách có sẵn: `ABC`, `CLOVER`, `PAX`, `INTERNET`, `VALOR`. Gõ để lọc: chỉ giữ loại **bắt đầu bằng** chữ đang gõ (khớp lần lượt từ ký tự đầu, không phân biệt dấu / hoa thường), danh sách xếp theo bảng chữ cái. ↑/↓ chọn, Enter / bấm chuột chọn (đang gõ dở mà bấm Tab cũng chọn mục đang sáng). **Chọn xong con trỏ tự sang ô Tóm tắt.** Chọn loại khác → thay loại cũ. Backspace khi ô trống / × trên thẻ = bỏ loại, Esc đóng. Ticket / template cũ đã có nhiều loại vẫn hiện đủ và vào title như cũ; chọn loại mới thì thay hết bằng 1 loại. Gõ tên chưa có → `+ Thêm "…"` → lưu vào danh sách riêng trên máy (viết HOA, gộp khoảng trắng, bỏ ` - `). Loại tự thêm có nút × để xóa khỏi danh sách; loại có sẵn thì không. |
| **Tóm tắt** | Đưa vào title. `Enter`: sang ô kế tiếp (như Tab). |
| **Phone** | Ô text (bàn phím số trên mobile), **chỉ nhận số**, tối đa 10 số, gõ / dán tới đâu tự format tới đó thành `(111) 111-1111` (dán `+1 …` 11 số thì bỏ số `1` đầu). `Enter`: sang ô kế tiếp (như Tab). |
| **Tên merchant** | Cạnh ô Phone, không bắt buộc (vd `Mr. Vương`). `Enter`: sang ô kế tiếp. |
| **Vai trò tại tiệm** | Cùng hàng Phone + Tên merchant (màn hình hẹp thì xuống hàng), không bắt buộc: `Owner` / `Manager` / `Staff` / `Partner` (`roles` trong `config/app.js`). Bấm lại lựa chọn đang chọn là bỏ chọn. Là nút phụ: `Enter` ở Tên merchant vẫn sang thẳng ý đầu tiên. State bản trước chưa có → chưa chọn. |
| **Ngôn ngữ merchant** | Chỉ ở loại có `showLang` (Chuyển CS/MKT). Chọn `ENG` / `VIE`, mặc định `ENG`. |

- Con trỏ tự vào ô **Loại** (loại không có ô Loại thì ô **Tóm tắt**) khi mở trang, đổi loại ticket, bấm `Ticket mới` hoặc dùng template (ở nhóm Viết ticket và Setup).

## 5. Title

- Có Loại: `<LOẠI> - <Tóm tắt>` (ticket / template cũ có nhiều loại: `<LOẠI 1> - <LOẠI 2> - <Tóm tắt>`); không có Loại: `<Tóm tắt>`.
- Loại không có ô Loại (Chuyển CS/MKT): title luôn chỉ là `<Tóm tắt>`. Loại đã chọn ở loại khác vẫn giữ, đổi lại thì hiện như cũ.
- Toàn bộ viết HOA. Bỏ dấu `-`/khoảng trắng thừa ở cuối phần Loại.
- Có Loại mà chưa có Tóm tắt: dấu nối vẫn hiện sẵn, vd `ABC - `.
- Ví dụ: Loại `ABC` + Tóm tắt `mất kết nối` → `ABC - MẤT KẾT NỐI`.

## 6. Nhóm "Viết ticket"

### 6.1 Các loại

| Key | Nhãn nút | Các mục (theo thứ tự) |
|---|---|---|
| `incident` | Hỗ trợ merchant | Vấn đề (`s1`) · Đã support (`s2`) · **Kết luận** · Việc cần làm tiếp (`s5`, chỉ hiện khi Pending) · Note (`s6`). Cuối form có khối tùy chọn **SMS Promotion** (§16) |
| `transfer` | Chuyển case | Không còn form ticket: hiện form + tin nhắn Chuyển case (§22). Định nghĩa ticket cũ (Yêu cầu `s1`, không có ô Loại, Ngôn ngữ merchant, câu cuối `Nhờ team help merchant ạ. Many thanks team!`) vẫn giữ trong config để template cũ mở được và test golden so với bản gốc. |

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

1. `Phone: <số>` — có Tên merchant thì thêm ` - <tên>`, có Vai trò thì thêm ` - <vai trò>` (vd `Phone: (111) 111-1111 - Mr. Vương - Owner`); loại có ngôn ngữ thì thêm ` - ENG`/` - VIE`. Bỏ nếu không nhập Phone, Tên merchant lẫn Vai trò. (Bản mới: ticket setup thêm dòng `Model:` ngay dưới, xem §14.3.)
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
- Phím tắt: `Alt+1` = Copy title, `Alt+2` = Copy nội dung, `Alt+3` = Copy SMS (chỉ Message), `Alt+4` = Copy Confirm SMS (toàn bộ tin gửi tiệm) khi khối SMS Promotion đang bật (chữ trên nút có ghi phím). Chạy ở mọi chế độ xem, kể cả `Nhập`. Nút đang khóa → hộp thông báo lý do (title trống / dòng cảnh báo vàng). SMS Shipping không có Title nên `Alt+1` không làm gì.
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
- Ảnh hiện thumbnail trong ô dán, có × để xóa; ô dán đổi màu `✓ Đã có n ảnh` (1 ảnh thêm `, kéo ảnh sang mục khác`; từ 2 ảnh thêm `, kéo ảnh để đổi thứ tự hoặc sang mục khác`).
- **Đổi thứ tự**: kéo thả thumbnail trong cùng 1 mục (thả lên ảnh nào thì chiếm chỗ ảnh đó). Thứ tự mới được lưu (IndexedDB) và là thứ tự trong khối Ảnh, nhãn `ảnh n`, file ZIP, file PDF. Kéo thumbnail không bị tính là thả file ảnh mới.
- **Chuyển sang mục khác** (vd `Vấn đề` ↔ `Đã support`; mọi ô ảnh đang hiện đều nhận, kể cả mục checklist và Type Customer của SMS): kéo thumbnail rồi thả lên 1 ảnh của mục kia → chèn vào đúng chỗ ảnh đó; thả vào khoảng trống của ô dán ảnh (ô hiện viền nét đứt) → thêm vào cuối. Ảnh giữ nguyên (cả `✓ Đã copy`), cả 2 mục được lưu lại. Thả vào mục checklist thì tự tick mục đó như khi dán ảnh; mục cũ không tự bỏ tick.
- Khu Kết quả có khối **Ảnh**: liệt kê mọi ảnh theo thứ tự nội dung (checklist trước, rồi các mục), nhãn `<nhóm> – <mục>` (mục ticket: `<mục>`), thêm ` – ảnh n` khi mục có từ 2 ảnh. Nhãn ảnh được rút gọn: bỏ ghi chú trong ngoặc ở tên nhóm / `parent` (vd `(nếu có)`, `(làm theo thứ tự)`); tên mục trùng tên nhóm thì chỉ ghi 1 lần (vd `Setup terminal`). Ngoặc trong tên mục vẫn giữ (vd `Terminal (Dual Pricing)`). Nội dung ticket không đổi. Mỗi ảnh nút `Copy ảnh` (copy PNG vào clipboard) → đánh dấu `✓ Đã copy`, đếm `x/y đã copy`.
- Nút `Xóa hết ảnh` ở đầu khối Ảnh (cạnh ZIP / PDF): hỏi xác nhận (`Xóa hết n ảnh của ticket này? …`) → xóa mọi ảnh của mọi mục, cả bản lưu IndexedDB. Nội dung ticket, tick / N/A checklist giữ nguyên.
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

## 12. Lưu trữ (localStorage, IndexedDB)

| Key | Nội dung |
|---|---|
| `ticketWriter.v1` | Loại đang chọn, chế độ xem, đổi bên, ticket đang nhập (Loại, Tóm tắt, Phone, ngôn ngữ, variant, kết luận, các mục, tick/N/A checklist), form SMS Promotion (trường `sms`, gồm ô tick `enabled`, ngôn ngữ tin nhắn `lang` và option tự thêm `customOptions`; ảnh lưu ở IndexedDB), form SMS Shipping (trường `shipping`), form SMS Xin review (trường `review`: bang `usState`, ngôn ngữ `lang`) |
| `ticketWriter.images.v1` | **IndexedDB** (không phải localStorage), object store `images`: mỗi bản ghi = danh sách ảnh `{ blob, copied }` của 1 mục, key = key mục. Ảnh gốc, không nén. Nạp lại khi mở trang, giữ cả trạng thái `✓ Đã copy` |
| `ticketWriter.theme.v1` | Giao diện đã chọn: `auto` / `light` / `dark`. Lưu riêng để `Ticket mới` không đổi; giá trị lạ → `auto` |
| `ticketWriter.phone.v1` | Nhận ảnh iOS (§21): `{ link, enabled }` — link phone-upload đã dán và lần trước có đang bật không |
| `ticketWriter.staff.v1` | Tên nhân viên (form SMS Xin review). Lưu riêng để `Ticket mới` không xóa |
| `ticketWriter.templates.v1` | Danh sách template |
| `ticketWriter.categories.v1` | Loại tự thêm |
| `ticketWriter.summaries.v1` | Tóm tắt đã dùng, lưu IN HOA như title (tối đa 300, mới nhất đầu, không trùng). Lưu khi rời ô Tóm tắt; gõ ô Tóm tắt thì hiện danh sách gợi ý **bắt đầu bằng** chữ đang gõ (không phân biệt dấu / hoa thường; vd gõ `ket` ra `KẾT NỐI WIFI` nhưng không ra `MẤT KẾT NỐI`), xếp theo bảng chữ cái (lưu vẫn theo mới nhất đầu để giới hạn 300 bỏ mục cũ nhất): ↓/↑ chọn, Enter điền vào ô, Esc đóng, `×` xóa gợi ý đó. Chưa chọn gợi ý thì Enter vẫn sang ô kế tiếp. `Ticket mới` không xóa |
| `ticketWriter.passTags.v1` | Tên tag đã thêm tay ở Chuyển case (§22), **riêng từng team** (`{ sales: [...], mkt: [...], … }`), lưu dạng `@tên` (mỗi team tối đa 300, mới nhất đầu, không trùng), lưu lúc bấm Thêm. Bản `v2026-11-24.14` lưu 1 danh sách chung (mảng) → mỗi team nhận 1 bản. Gõ ô Thêm tag thì gợi ý như ô Tóm tắt (gõ thiếu `@` vẫn ra; người đang có trong danh sách tag thì không gợi ý); chọn gợi ý = thêm luôn. `Ticket mới` không xóa |

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
4. **Viết ticket** gồm các loại, mỗi loại 1 file: Hỗ trợ merchant (đã gộp Xử lý vấn đề + Xử lý yêu cầu, §14.5), Chuyển case. Giữ 1 loại `transfer`; từ `v2026-11-17.4` chuyển cho 4 team Sales / MKT / CS / Tech bằng tin nhắn group (§22).
5. **Setup / Training**: mỗi checklist 1 file, đặt theo Thiết bị → Hãng → Quy trình.
6. Dữ liệu đã lưu ở bản cũ (ticket đang nhập, template, Loại tự thêm) vẫn dùng được ở bản mới.

### 14.2 Chọn loại ticket theo cấp (thay hàng nút phẳng)

**Cấp 1 — Nhóm**: `Viết ticket` | `Setup / Training` | `SMS`.

`Setup / Training` đang **tạm ẩn** (`hidden: true` trong `config/app.js`): không hiện nút; phiên đã lưu ở nhóm này mở lại về `Viết ticket`, chữ đã nhập vẫn giữ. Dùng template loại setup thì vẫn mở checklist.

**SMS** → chọn loại tin nhắn: `Shipping` (xem §17) | `Xin review` (xem §18). SMS Promotion nằm trong `Hỗ trợ merchant` (xem §16), không còn tab riêng.

**Viết ticket** → chọn loại: `Hỗ trợ merchant` | `Chuyển case`.

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
| Ô Loại: đang gõ dở mà bấm `Tab` thì chọn mục đang sáng; chỉ 1 loại, chọn xong sang Tóm tắt | §4 |
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
- Không vào Title, không lưu vào template. Khi tick: phần chi tiết (từ dòng Recipients tới hết dòng tin trong ngoặc kép, không có giá, theo ngôn ngữ tin nhắn) in thêm cuối mục **Đã support** của Nội dung (mục theo `ticketSection` trong config), nên cũng vào `Copy nội dung`, `Copy để điền` (§16.3).
- Bản trước có tab `SMS` → `Promotion` riêng: phiên đã lưu đang ở tab đó mở lại ở `Hỗ trợ merchant` với ô tick đã bật; phiên khác giữ dữ liệu SMS, ô tick tắt.

### 16.1 Form

| Trường | Mô tả |
|---|---|
| **Ngôn ngữ tin nhắn** | Chọn 1: `English` (mặc định) / `Tiếng Việt`. Đổi ngôn ngữ chỉ đổi câu chữ tin nhắn, dữ liệu form giữ nguyên. |
| **Tên tiệm** | Ô text. In ra đúng như gõ (đã trim). |
| **Phone tiệm** | Ô text (bàn phím số điện thoại trên mobile). Số Mỹ 10 số (có thể có `1` / `+1` đầu) gõ kiểu nào cũng in ra `(555) 123-4567`; không đúng dạng đó thì in như đã gõ (đã trim). Ô nhập chỉ nhận số và tự format như ô Phone (§4). |
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
"<Tên tiệm> <Phone tiệm>. <Message> Reply STOP To Optout."
Price per SMS: $<giá>
Estimate Total: $<giá × Recipients>

Please carefully review the content of the Promotion message, and only when you are sure that there are no further changes should you text "OK" to this phone number. Have a nice day.
```

- Type Customer: mục có sẵn đã tick theo thứ tự config (không theo thứ tự tick, số đã trim), rồi tới option tự thêm (bỏ option trống).
- Dòng trong ngoặc kép là tin khách nhận, ghép theo mẫu `promoText` trong config, giống nhau ở cả 2 ngôn ngữ. Message đã có sẵn cặp ngoặc kép bao ngoài thì bỏ cặp đó, chỉ giữ cặp bao cả dòng. SMS không gửi được xuống dòng → Message có xuống dòng thì nối thành 1 dòng: mỗi chỗ xuống dòng (kể cả dòng trống, khoảng trắng quanh đó) thành 1 space, ở cả tin gửi tiệm và Copy SMS.
- Chưa nhập gì (Tên tiệm, Phone tiệm, Recipients, Message trống, chưa tick Type Customer) → tin nhắn rỗng.
- **Estimate Total** = Price per SMS × Recipients, 2 số lẻ, có dấu phẩy hàng nghìn (vd `3178` × `0.02` → `$63.56`, `50000` × `0.08` → `$4,000.00`). Recipients gõ `3,178` vẫn tính được. Recipients trống hoặc không phải số nguyên → bỏ dòng này.
- **Tiếng Việt**: cùng bố cục, câu chữ tiếng Việt (vd `Xin chào,`, `Số khách nhận: <Recipients> khách`, `Nhóm khách:`, `Lần ghé gần nhất <= 365 ngày`, `Giá mỗi SMS: $<giá>`, `Tổng chi phí dự kiến: $<tổng>`). Option tự thêm in nguyên văn ở cả 2 ngôn ngữ.
- Câu chữ từng dòng của từng ngôn ngữ nằm trong config (`languages[].lines`), sửa không cần đụng `src/`.

### 16.3 Khu Kết quả & Copy

- Khi tick: khối `SMS Promotion` hiện dưới khối Nội dung, có nút `Copy Confirm SMS (Alt+4)` và `Copy SMS (Alt+3)` riêng. Title, điều kiện copy của ticket giữ nguyên như khi chưa tick.
- **Copy Confirm SMS (Alt+4)**: copy toàn bộ tin nhắn gửi tiệm xác nhận (như khung SMS Promotion).
- **Copy SMS (Alt+3)**: chỉ copy nội dung Message, trên 1 dòng, không tên tiệm / phone / `Reply STOP To Optout`, không ngoặc kép, vd `dòng 1 dòng 2`. Khóa / mở cùng lúc với Copy Confirm SMS.
- Nội dung ticket: chi tiết SMS cập nhật theo form, in cuối mục Đã support (sau các ý, không gạch đầu dòng). Đã support trống thì mục chỉ có chi tiết SMS. Chưa nhập gì vào SMS thì không in gì. Bỏ tick thì bỏ khỏi Nội dung.
  ```
  Đã support:
  - <ý đã support>
  Recipients: <Recipients> customers
  Type Customer:
  - <lựa chọn đã tick>
  Message:
  "<Tên tiệm> <Phone tiệm>. <Message> Reply STOP To Optout."
  ```
  **Không** in `Price per SMS` và `Estimate Total` vào ticket: 2 dòng này chỉ có trong tin gửi tiệm.
- **Copy SMS** khóa khi tin nhắn rỗng hoặc còn thiếu: Tên tiệm, Phone tiệm, Recipients, Type Customer (chưa tick mục nào và chưa có option tự thêm, hoặc mục đã tick còn ô số trống), Message. Dòng cảnh báo vàng trong khối SMS: `Còn thiếu: <các trường>. Điền đủ rồi mới copy được.` SMS thiếu trường không khóa các nút copy của ticket.
- Khối **Ảnh**: ảnh Type Customer (nhãn `Type Customer`, từ 2 ảnh thì `Type Customer – ảnh n`) hiện sau ảnh ticket khi đang tick, nên cũng nằm trong `Tải tất cả (ZIP)` và `Tải PDF` (§10). Ảnh không ảnh hưởng điều kiện copy.
- Ctrl+V ảnh khi đứng trong khối Type Customer → vào ảnh Type Customer; không đứng ở ô nào → mục focus gần nhất, không thì mục đầu của ticket.
- `Ticket mới`: hỏi xác nhận → xóa cả ticket, form SMS (kể cả option tự thêm và ảnh Type Customer) và bỏ tick.
- Dùng template không đụng form SMS.

### 16.4 Kế hoạch (chưa làm): đếm SMS segment

- Mục tiêu: biết tin promo tốn mấy segment, giống trang Twilio Message Segment Calculator (https://twiliodeved.github.io/message-segment-calculator/).
- Không gọi trang đó: không có API, tool chạy `file://` không gọi mạng, và không gửi nội dung merchant ra ngoài (SECURITY.md). Tự đếm trong `src/domain/` (hàm thuần, ~30 dòng, có test so với ví dụ lấy từ trang Twilio).
- Cách đếm:
  - **GSM-7**: 160 ký tự / 1 segment; dài hơn thì 153 ký tự / segment. Ký tự mở rộng `^ { } [ ] ~ \ | €` tính 2.
  - **UCS-2**: có bất kỳ ký tự ngoài GSM-7 (tiếng Việt có dấu, emoji, nháy cong `’`) → 70 ký tự / 1 segment; dài hơn thì 67 / segment.
- **Đang chờ chốt**:
  1. Hiện ở đâu. Đề xuất: 1 dòng dưới ô Message, vd `245 ký tự · 2 segment · GSM-7`; rơi vào UCS-2 thì chỉ ra ký tự gây ra.
  2. ~~`\n` trong bản `Copy Confirm SMS`~~: đã chốt, SMS không có xuống dòng, Message nối thành 1 dòng (§16).
  3. Estimate Total có nhân số segment không (giá × Recipients × segment).


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

- Nút `Lưu offline` ở header. Khóa khi không có loại ticket (nhóm SMS, nhánh setup chưa có checklist) và ở **Chuyển case** (tin nhắn group, không phải ticket). Ticket trống (chưa có title lẫn nội dung) → báo, không mở hộp.
- Hộp hỏi: **Business zipcode**, **Ticket type** (ô text, nhân viên tự điền) và **Tier** (chọn `0.5` / `1` / `1.5` / `2` / `2.5` / `3`, `offlineTiers` trong `config/app.js`), đều bắt buộc. Có ảnh thì có thêm ô tick `Tải kèm PDF ảnh` (mặc định không tick).
- Bấm `Lưu` → tải **đúng 1 file** (Chrome tự chặn file thứ 2 trở đi trong cùng 1 lần bấm). Mọi file dùng chung **tên gốc** `OFF-YYYYMMDD-HHmmss - <TITLE>` (chỉ ASCII như §10, mã OFF-… theo giờ máy lúc lưu):
  - Không có ảnh → `<tên gốc>.json`.
  - Có ảnh → `<tên gốc>.zip`, bên trong: `<tên gốc>.json`, các ảnh (đặt tên như `Tải tất cả (ZIP)`), và `<tên gốc>.pdf` nếu có tick (giống `Tải PDF`).
- File `.json` gồm: mã, giờ lưu, loại ticket, zipcode, ticket type, tier, title, nội dung, tên file ZIP / PDF, toàn bộ ticket đang nhập (Loại, Tóm tắt, Phone, các mục, Kết luận, tick/N/A checklist).
- Tạo PDF lỗi → ZIP không có PDF, báo. Tạo ZIP lỗi → chỉ tải `.json` (giữ được phần chữ), báo để tự bấm `Tải tất cả (ZIP)` / `Tải PDF`.
- Lưu xong form giữ nguyên; muốn làm ticket khác thì bấm `Ticket mới`.

### 19.2 Mở file offline

- Nút `Mở file offline` khóa ở **Chuyển case**. Loại khác → nếu đang có nội dung hoặc ảnh thì hỏi xác nhận → chọn file `.zip` (đọc file `.json` bên trong, không cần giải nén) hoặc file `.json`.
- File đúng → chuyển về đúng loại ticket / nhánh setup trong file, thay toàn bộ ticket đang nhập, bỏ ảnh đang dán; báo mã, Business zipcode, Ticket type, Tier (file lưu trước khi có Tier → `(chưa có)`), file ZIP chứa ảnh (+ PDF).
- File không phải ticket offline / loại ticket trong file không còn → báo, không đổi gì.
- Ảnh không tự nạp lại: giải nén ZIP rồi dán / kéo thả vào từng mục (tên ảnh trong ZIP ghi mục nào).

## 20. Cảnh báo lưu trữ

Danh sách cảnh báo, câu chữ và ngưỡng nằm trong **`config/notifications.js`** (docs/CONFIG.md §6).

- Hiện thành thanh dưới header, mỗi cảnh báo 1 dòng: `error` nền đỏ, `warn` nền vàng. Không chặn thao tác (không dùng hộp alert).
- Tự hiện khi gặp sự cố, tự ẩn khi hết sự cố. Bấm `×` → ẩn cho tới khi sự cố hết rồi gặp lại.

| id | Level | Khi nào hiện | Khi nào ẩn |
|---|---|---|---|
| `sessionSaveFailed` | error | Ghi ticket đang nhập / form SMS vào localStorage lỗi (đầy hoặc bị chặn) | Lần lưu sau thành công |
| `imageSaveFailed` | error | Ghi ảnh của 1 mục vào IndexedDB lỗi | Mọi mục lỗi đã lưu lại được (thêm / xóa / copy ảnh ở mục đó), hoặc `Ticket mới` / `Mở file offline` |
| `storageNearlyFull` | warn | Dung lượng trình duyệt cho phép đã dùng ≥ `nearlyFullRatio` (mặc định 80%), kèm `{percent}%`. Kiểm tra khi mở trang và mỗi lần ảnh thay đổi | Xuống dưới ngưỡng |

- Trình duyệt không cho biết dung lượng → không hiện `storageNearlyFull`.
- Lưu template lỗi vẫn báo bằng hộp alert như cũ (§11), vì người dùng vừa bấm nút và cần biết ngay.

## 21. Nhận ảnh từ iPad / iPhone (phone-upload)

> **Tạm ẩn** (`phoneUpload.hidden` trong `config/app.js`, đang dùng Send Anywhere): không hiện nút, không tự bật lại. Xóa `hidden` là dùng lại như dưới.

Chụp màn hình trên iPad / iPhone (vd lúc FaceTime) rồi gửi thẳng vào ticket qua mạng LAN. iPad **dùng chung** nhiều người: iPad mở trang gửi ảnh bằng cách quét mã QR trên Ticket Writer, mã tự hết hạn. Hướng dẫn cho người dùng: `phone-upload/README.md`.

Trang `file://` không tự mở port được, nên có thêm chương trình nhỏ `phone-upload/phone-upload.bat` (PowerShell có sẵn của Windows) chạy trên cùng máy:

```
iPad (Safari) ──LAN──► phone-upload (port 8765) ◄── Ticket Writer gọi http://127.0.0.1:8765/<mã máy tính>/...
   └ quét QR do Ticket Writer vẽ: http://<IP LAN>:8765/u/<mã iPad>
```

### 21.1 phone-upload

- Nghe port `8765` trên mọi card mạng. IP cho iPad: card có default gateway, không thấy thì mọi IPv4.
- **2 mã bí mật**, 12 ký tự (`a-z`, `2-9`, bỏ chữ dễ nhầm), sinh bằng RNG mật mã, lưu ở `%LOCALAPPDATA%\TicketWriter\` — **ngoài folder dự án** để nén folder gửi đồng nghiệp không mang mã theo:
  - **Mã máy tính** (`phone-upload-token.txt`): cố định, Ticket Writer dán 1 lần. Đường dẫn dùng mã này **chỉ nhận request từ chính máy đó** (loopback): iPad / máy khác biết mã cũng không lấy được ảnh. Bản đầu lưu ở `phone-upload/token.txt`: gặp file này thì chuyển mã sang chỗ mới rồi xóa.
  - **Mã iPad** (`phone-upload-session.txt`, dạng `<mã> <giờ hết hạn Unix>`): **hết hạn sau 12 tiếng** thì tự sinh mã mới; tắt / mở lại cửa sổ trong hạn thì giữ mã. Đổi được ngay bằng `rotate`.
- Khi chạy: copy sẵn link máy tính `http://127.0.0.1:8765/<mã máy tính>` vào clipboard, ghi rõ link này chỉ dùng trên máy tính; iPad thì quét QR trên Ticket Writer.
- Đường dẫn:

| Request | Ai gọi | Kết quả |
|---|---|---|
| `GET /<mã máy tính>/next` | Ticket Writer (chỉ loopback) | Ảnh cũ nhất kèm header `X-File-Name`, xóa khỏi hàng chờ; trống → 204 |
| `GET /<mã máy tính>/info` | Ticket Writer (chỉ loopback) | `{ urls: ["http://<IP>:8765/u/<mã iPad>"], expiresAt: "<ISO UTC>" }` |
| `POST /<mã máy tính>/rotate` | Ticket Writer (chỉ loopback) | Đổi mã iPad ngay, trả như `info` |
| `GET /u/<mã bất kỳ>` | iPad | Trang gửi ảnh (`upload.html`); trang tự hỏi `/check` |
| `GET /u/<mã iPad>/check` | iPad | 200; mã sai / hết hạn → 410 |
| `POST /u/<mã iPad>/upload` | iPad | Nhận 1 ảnh (chỉ `image/*`, tối đa 50 MB) vào hàng chờ; mã sai / hết hạn → 410 |
| Khác / sai mã / không phải loopback | | 404, không cho biết gì thêm |

- Hàng chờ chỉ trong bộ nhớ: tắt cửa sổ là mất ảnh chưa lấy (ảnh gốc còn trên iPad).
- Xử lý 1 request 1 lúc, nhưng **không chờ kết nối để không**: Safari / Chrome hay mở sẵn kết nối dự phòng. Chỉ xử lý kết nối đã có dữ liệu gửi tới; để không quá 15s thì đóng. (Bản đầu chờ kết nối đó → mỗi lần tải lại trang iPad kẹt ~15s.)
- Trang iPad: mở trang → hỏi `/check`, mã hết hạn thì báo `Mã đã hết hạn hoặc đã đổi… quét lại mã QR` và khóa nút chọn ảnh. Chọn nhiều ảnh, gửi lần lượt, mỗi ảnh hiện `✓ Đã gửi` hoặc lý do lỗi; gửi gặp 410 cũng báo hết hạn.

### 21.2 Ticket Writer

- Nút `Nhận ảnh iOS` ở header, 3 trạng thái: `Nhận ảnh iOS` (tắt) · `Đang nhận ảnh` · `Mất kết nối`.
- Bấm khi tắt / mất kết nối → hộp hỏi link máy tính (điền sẵn link đã lưu) → link đúng dạng `http://<host>:<port>/<mã 12 ký tự>` thì bật và mở hộp mã QR; sai (kể cả dán nhầm link iPad `/u/…`) → báo.
- Bấm khi đang nhận → **hộp Nhận ảnh iOS**: hướng dẫn quét, **mã QR** của link iPad (luôn đen trên trắng, cả giao diện tối), link dạng chữ, giờ hết hạn `HH:mm dd/MM`. Nút `Đổi mã ngay` (hỏi xác nhận) · `Tắt nhận ảnh` · `Đóng`. Không gọi được phone-upload → báo trong hộp, nút chuyển `Mất kết nối`. Máy không có IP LAN → báo.
- Mã QR tự vẽ (`src/domain/qr-code.js`, không thư viện): chế độ byte, mức sửa lỗi M, phiên bản 1–6 (tối đa 106 byte; link iPad ~45 ký tự → phiên bản 3–4), chọn mask theo điểm phạt chuẩn.
- Đang nhận: hỏi `/next` mỗi `phoneUpload.pollMs` (1.5s); có ảnh thì hỏi tiếp ngay tới khi hết. Mỗi ảnh vào **đúng mục Ctrl+V sẽ dán** (mục focus gần nhất, không thì mục đầu), giống hệt dán ảnh: tự tick checklist, lưu IndexedDB. Nút nháy `Đã nhận ảnh ✓`.
- Màn hình không có mục nhận ảnh (vd SMS Shipping / Xin review) → không lấy ảnh, để chờ ở phone-upload.
- Gọi phone-upload lỗi (chưa chạy / đã tắt / sai mã) → `Mất kết nối`, **ngừng hỏi** (không ghi lỗi đỏ liên tục vào Console). Bấm nút để thử lại.
- Mở trang: lần trước đang bật thì tự bật lại (thử 1 lần).

## 22. Chuyển case

`Viết ticket` → `Chuyển case` (key `transfer`). FRT soạn tin pass case cho team khác, copy dán vào group của team đó. Không phải ticket: không có Title, không lưu template; ảnh chỉ gắn ở trường Issue (MKT, CS, Tech). Câu chữ, trường, trường bắt buộc, lưu ý của từng team nằm trong `config/tickets/pass-case.js`, sửa không cần đụng `src/`.

### 22.1 Form

- **Team nhận**: `Sales` (mặc định) · `MKT` · `CS` · `Tech`. Đổi team giữ chữ đã nhập (trường cùng tên dùng chung giữa các team).
- Trường theo team (★ = bắt buộc):

| Team | Trường |
|---|---|
| Sales | Tên tiệm ★ · ZIP Code ★ · MID · CBN ★ · Tên người liên hệ · Vai trò tại tiệm · Note |
| MKT | Link Lead ★ · Tên tiệm ★ · ZIP Code ★ · MID ★ · CBN ★ · Tên người liên hệ ★ · Vai trò tại tiệm · Issue ★ |
| CS | Link Ticket ★ · Tên tiệm ★ · ZIP Code ★ · MID ★ · CBN ★ · Tên người liên hệ ★ · Vai trò tại tiệm · Issue ★ |
| Tech | Link Lead ★ · Tên tiệm ★ · CBN ★ · Tên người liên hệ ★ · Vai trò tại tiệm · Issue ★ |

- Xếp chung 1 hàng (mọi team có các trường này): **Tên tiệm + ZIP Code**; **CBN + Tên người liên hệ + Vai trò tại tiệm** (màn hình hẹp thì Vai trò xuống hàng). Khai báo ở `rows` trong config.
- **CBN**: ô Phone, tự format như §4. **Vai trò tại tiệm**: `Owner` / `Manager` / `Staff` / `Partner`, bấm lại lựa chọn đang chọn là bỏ chọn. **Issue**, **Note**: ô nhiều dòng.
- **Issue** (MKT, CS, Tech) có ô dán ảnh + `+ Thêm ảnh (Ctrl+V)` + nút chụp màn hình, giống mục ticket (§10): Ctrl+V ảnh khi đang gõ trong Issue cũng vào ảnh Issue. Đổi qua lại MKT / CS / Tech giữ ảnh (cùng trường Issue).
- Mọi team có ô tick **GẤP**, nằm ngay dưới ô Issue (Sales: dưới Note) để viết xong mô tả là tick luôn. Đổi team vẫn giữ tick.
- **CS** và **Tech** có khung lưu ý (kiểm tra ticket, Proof, Dispute, quá tải cuộc gọi / phạm vi FRT, Reconnect Terminal, case khẩn cấp) theo thông báo pass case.

### 22.2 Tin nhắn (output)

Sales:

```
🔥🔥🔥 URGENT!!                     (chỉ khi tick GẤP)
LEAD: <Tên tiệm> – <ZIP> – <MID>
CBN: <Phone> – <Tên> (<Vai trò>)
NOTE: <Note>
Many thanks team!
<tag>
```

MKT, CS, Tech theo mẫu riêng của group từng team:

```
MKT / CS                            Tech
<Link Lead> / <Link Ticket>         <Link Lead>
🔥🔥🔥 URGENT!!                      🔥🔥🔥 URGENT!!        (chỉ khi tick GẤP)
<Tên tiệm> <ZIP>                    <Tên tiệm>
MID: <MID>
CBN: <Phone> - <Tên> - <Vai trò>    CBN: <Phone> - <Tên> - <Vai trò>

<Issue>                             <Issue>

Thanks team !                       Thanks team !
<tag theo ca>                       <tag theo ca>
```

- MKT, CS, Tech: dòng trống giữ nguyên; dòng bị bỏ (vd không có Issue) thì không để lại 2 dòng trống liền nhau.

- **Tag** (cách nhau 1 space):
  - Sales: `@Stella_SalesAdmin @Kyo_SaleAdmin`.
  - MKT, theo giờ VN lúc tạo tin: 8:00 PM – 6:00 AM (C1-3) → `@Chris_MKTSupport_Leader @Trivu_MarketingSupport @lucas_mktsupport`; 6:00 AM – 8:00 PM (MKT/AM ca 2) → `@Sarah_Pham_AM @josie_am`.
  - CS, theo giờ VN: 8:00 PM – 5:00 AM (ca 1-3) → `@xuanthor_cs @joyce_cs`; 5:00 AM – 8:00 PM (ca 2) → `@ThuTranCS`.
  - Tech, theo giờ VN: 8:00 PM – 4:00 AM (ca 1-3) → `@vinny_tech @brian_technical`; 4:00 AM – 8:00 PM (ca 2) → `@dustin_tech`.
  - **Chỉnh tay trên form** (ô Tag, dưới các trường): hiện người của ca đang trực, mỗi người 1 ô tick; bỏ tick = hôm nay nghỉ, không tag. Ô Thêm (Enter hoặc nút Thêm) thêm người support thêm cho team: tự bỏ khoảng trắng thừa, khoảng trắng giữa thành `_`, thiếu `@` thì thêm; người thêm tay được tag ở **mọi ca**, đứng sau người của ca, có nút × để bỏ. Trùng người của ca thì không lặp.
  - Tag chỉnh tay lưu theo từng team (`passCase.tags`: `off` = bỏ tick, `extra` = thêm tay), F5 vẫn giữ. **Ticket mới** bỏ người thêm tay (mọi team), giữ người chính theo ca và ô tick của họ.
  - Tên đã thêm tay lưu riêng theo team (`ticketWriter.passTags.v1`, §12) để gõ ô Thêm tag ra gợi ý của team đang chọn như ô Tóm tắt: ↓/↑ chọn, Enter thêm, Esc đóng, `×` xóa gợi ý.
  - Dán vào app chat chỉ ra chữ `@tên`; có app phải gõ `@` chọn lại người thì mới thành tag thật.

- Giá trị đã trim. Phần nào trống thì bỏ phần đó (vd không có MID → `LEAD: <Tên tiệm> – <ZIP>`); cả dòng trống thì bỏ dòng. Ô nhiều dòng giữ xuống dòng.
- Chỉ in trường của team đang chọn. Chưa nhập trường nào của team → tin nhắn rỗng.

### 22.3 Khu Kết quả & Copy

- Giống §17: ẩn Title, có Nội dung + `Copy nội dung` (`Alt+2`).
- **Khối Ảnh**: chỉ ảnh Issue của Chuyển case (nhãn `Issue`, `Issue – ảnh N`), copy từng ảnh / tải ZIP / PDF như ticket. Ảnh lưu như ảnh ticket (IndexedDB): F5 không mất. Ctrl+V ảnh ngoài ô nhập → vào Issue; team không có Issue (Sales) → không làm gì. Tin nhắn không ghi gì về ảnh.
- **Copy nội dung** khóa khi tin nhắn rỗng hoặc còn trường bắt buộc trống; cảnh báo `Còn thiếu: <các trường>. Điền đủ rồi mới copy được.`
- `+ Lưu template` bị khóa.
- `Ticket mới`: hỏi xác nhận → xóa form Chuyển case (về team Sales) và ảnh Issue, không đụng ticket, ảnh ticket và các form SMS. `Ticket mới` ở Viết ticket xóa hết ảnh, kể cả ảnh Chuyển case (cùng 1 cuộc gọi).
- Form lưu riêng (`passCase` trong `storageKey`): F5 không mất, chuyển qua lại với Hỗ trợ merchant không mất dữ liệu bên nào. State bản trước chưa có → form trống.

### 22.4 Lấy thông tin tiệm từ trang ticket / Lead

- Bookmark **Lấy thông tin tiệm**: kéo từ hộp `Cài bookmark "Điền ticket"` (cùng hộp với bookmark Điền ticket, §9). Bấm ở Ticket Writer thì không làm gì.
- Chạy trên tab portal đang đứng. Trang có dòng tiêu đề ticket `Ticket #… for <Tên tiệm> / <MID>` (`shopGrab.ticketHeader`) là **trang ticket**, lấy:
  - **Link Ticket** = địa chỉ trang đang mở (kể cả `?bucket=…&rank=…#`). Đây cũng là link mà app chat in trong ngoặc khi copy dòng tiêu đề, vì MID trên trang là link `href="#"`.
  - **Tên tiệm**, **MID**: tách dòng tiêu đề bằng `shopGrab.ticketPattern`; Tên tiệm có `/` vẫn đúng (MID = phần sau dấu ` / ` cuối).
  - **Nội dung** ticket (`shopGrab.description`, thẻ `.description-text`) → ô **Issue**: giữ xuống dòng, 3 dòng trống trở lên gộp còn 1 dòng trống, tối đa 3000 ký tự. Không có thì báo `Không thấy: Nội dung`, vẫn copy phần còn lại.
- Không có dòng đó → **trang Lead**, lấy:
  - **Link Lead** = địa chỉ trang đang mở.
  - **DBA**, **MID**: ô theo selector `shopGrab.shop`, `shopGrab.mid` (`config/app.js`).
  - **Business ZIP**: ô chọn không có name cố định → lấy mọi ô `shopGrab.zip` có giá trị, giữ giá trị dạng ZIP (`shopGrab.zipPattern`: 5 số, hoặc 5 số + `-` + 4 số). Có từ 2 giá trị ZIP khác nhau → bỏ trống ZIP (không đoán).
- Không thấy trường nào → báo `không thấy Tên tiệm, MID. Mở đúng trang ticket / Lead rồi bấm lại.`, không đụng clipboard. Thấy một phần → vẫn copy, báo đã copy gì (`+ link ticket` / `+ link lead`) và `Không thấy: …`.
- Copy JSON có đánh dấu `ticket-writer-shop` (không phải chữ để đọc); Clipboard API bị chặn → dùng cách copy dự phòng; vẫn không được → hiện ô chứa chữ để tự Ctrl+C.
- Ở Chuyển case (mọi team) có nút **Dán thông tin tiệm** + nút `?` (mở hộp hướng dẫn bookmark), ngay dưới Team nhận:
  - Đọc clipboard (Chrome hỏi quyền; Ticket Writer chạy `file://` nên Chrome có thể hỏi lại mỗi lần). Cạnh nút luôn ghi `hoặc Ctrl+V ở trang này (không cần cho phép)`. Có dữ liệu của bookmark → điền các trường lấy được (**Link Ticket** hoặc **Link Lead**, **Tên tiệm**, **MID**, **ZIP Code**, **Issue**): trường lấy được thì ghi đè, trường không lấy được giữ nguyên chữ cũ. Báo cạnh nút `Đã điền: <các trường>`.
  - Trường điền vào là dữ liệu chung của form (§22.1): team đang chọn không có trường đó (vd CS không có Link Lead, Sales không có Link Ticket) thì không hiện, đổi team mới thấy.
  - Clipboard không phải dữ liệu của bookmark → báo `Clipboard chưa có thông tin tiệm: …`, không đổi form. Chrome chặn đọc clipboard → báo `Chrome chặn đọc clipboard: bấm Ctrl+V ở trang này.`
  - **Ctrl+V** chữ của bookmark ở bất kỳ đâu trên trang khi đang mở Chuyển case (trong ô nhập hay không) → điền như bấm nút, không dán chữ thô vào ô; không cần quyền clipboard nên Chrome không bao giờ hỏi. Chữ khác dán như thường.
- Dữ liệu từ clipboard: chỉ nhận chuỗi, đã trim, tối đa 300 ký tự mỗi trường (Issue 3000).
- Trang Lead đổi giao diện (đổi `name` ô) → bookmark báo không thấy; sửa `shopGrab` trong `config/app.js` rồi mọi người kéo lại bookmark.

### 22.5 Tech: Assign (đã bỏ)

Có từ `v2026-11-24.26` tới `v2026-11-24.30`, bỏ ở `v2026-11-24.31` vì giao case tay nhanh hơn. Ô tick Assign, mẫu tin `Tên tiệm / MID (link)` · Issue · `Thank you @tech`, nhóm tag `techAssign` và copy kèm HTML (link nhúng vào MID) đều đã gỡ. State / gợi ý tag lưu từ các bản đó (`assign`, `techAssign`) được bỏ qua khi đọc. Bookmark Lấy thông tin tiệm trên trang ticket (§22.4) vẫn giữ.

## 23. Sao lưu / khôi phục dữ liệu (chuyển máy / trình duyệt)

Dữ liệu lưu trong trình duyệt (§12) không tự theo sang máy khác, trình duyệt khác hay profile Chrome khác. Đổi folder / file app (vd sang bản gộp `release/ticket-writer.html`) thì **không** cần: Chrome cho mọi trang `file://` chung 1 kho.

- Nút `Sao lưu` ở header → tải **1 file** `ticket-writer-backup-YYYYMMDD-HHmm.json` (giờ máy). Gồm các key trong `backupKeys` (`config/app.js`), key chưa có dữ liệu thì không ghi:
  - `ticketWriter.summaries.v1`: gợi ý Tóm tắt (Viết ticket, §12).
  - `ticketWriter.passTags.v1`: gợi ý tên người support thêm của Chuyển case, riêng Sales / MKT / CS / Tech (§22).
  - `ticketWriter.templates.v1`: template (§11).
  - **Không** có: ticket / form đang nhập (thông tin merchant), Loại tự thêm, tên nhân viên, giao diện, ảnh đang dán, link Nhận ảnh iOS (mã gắn với từng máy).
- Nút `Khôi phục` → hỏi xác nhận (dữ liệu trong file **thay** dữ liệu đang có trên máy này) → chọn file sao lưu:
  - Đúng file → ghi đè từng key có trong file; key file không có thì giữ nguyên; key ngoài `backupKeys` trong file thì bỏ. Rồi **tải lại trang** để mọi phần dùng dữ liệu mới. Ticket đang nhập, ảnh đang dán không đổi.
  - Không phải file sao lưu (vd file ticket offline, file template) → báo, không đổi gì.
  - Bộ nhớ trình duyệt đầy / bị chặn → báo có dữ liệu không ghi được, phần đã ghi vẫn giữ.
- File sao lưu không chứa ticket đang nhập; template có thể có câu chữ nội bộ: xem SECURITY.md §1.
