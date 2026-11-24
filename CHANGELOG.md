# Changelog

Mỗi lần tăng `version` trong `config/app.js` thì thêm 1 dòng ở đầu ngày tương ứng: version · đổi gì (người dùng thấy gì) · mục REQUIREMENTS liên quan. Bản cũ hơn 2026-11-12 chưa ghi version, tóm tắt theo commit.

## 2026-11-24

- `v2026-11-24.6` · Chuyển case CS: theo mẫu group CS (Link Ticket, `Tên tiệm ZIP`, `MID:`, `CBN: Phone - Tên - Vai trò`, Issue có ảnh, `Thanks team !`); bỏ Note, bắt buộc mọi trường trừ Vai trò; tag ca 1-3 8:00 PM – 5:00 AM (`@xuanthor_cs @joyce_cs`), ca 2 5:00 AM – 8:00 PM (`@ThuTranCS`). §22
- `v2026-11-24.5` · Chuyển case Tech: theo mẫu group Tech (Link Lead, `🔥🔥🔥 URGENT!!` khi tick GẤP, Tên tiệm, `CBN: Phone - Tên - Vai trò`, Issue, `Thanks team !`); bỏ Cần FaceTime? / System / FRT đã làm / Callback Time và ô Tình trạng thực tế; bắt buộc mọi trường trừ Vai trò; tag ca 1-3 8:00 PM – 4:00 AM, ca 2 4:00 AM – 8:00 PM. Bỏ hẳn trường Package (không team nào dùng). §22
- `v2026-11-24.4` · Chuyển case: form xếp Tên tiệm + ZIP Code chung 1 hàng, CBN + Tên người liên hệ + Vai trò tại tiệm chung 1 hàng. §22
- `v2026-11-24.3` · Chuyển case: MKT bắt buộc mọi trường trừ Vai trò tại tiệm. Issue (MKT, Tech) có ô dán ảnh / Thêm ảnh / Chụp màn hình, ảnh vào khối Ảnh (copy, ZIP, PDF), F5 không mất; Ticket mới ở Chuyển case chỉ xóa ảnh Chuyển case. §22
- `v2026-11-24.2` · Chuyển case: Vai trò tại tiệm thêm lựa chọn `Partner`. §22
- `v2026-11-24.1` · Chuyển case MKT: theo mẫu group MKT (Link Lead, `Tên tiệm ZIP`, `MID:`, `CBN: Phone - Tên - Vai trò`, Issue, `Thanks team !`); bỏ Package / Note, thêm Link Lead ★ và Issue ★; tag ca đêm 8:00 PM – 6:00 AM, ca 2 6:00 AM – 8:00 PM (`@Sarah_Pham_AM @josie_am`). §22

## 2026-11-17

- `v2026-11-17.6` · SMS Promotion: sửa 2 nút copy bị ngược. `Copy Confirm SMS (Alt+4)` copy toàn bộ tin gửi tiệm; `Copy SMS (Alt+3)` chỉ copy nội dung Message (bỏ tên tiệm, phone, Reply STOP). §16
- `v2026-11-17.5` · Chuyển case: cuối tin thêm `Many thanks team!`, dòng dưới tag lead / sublead (Sales luôn tag; MKT theo ca giờ VN 8:00 PM – 8:30 AM / 8:30 AM – 12:00 PM). §22
- `v2026-11-17.4` · `Chuyển CS/MKT` thành `Chuyển case`: chọn team Sales / MKT / CS / Tech, form theo team, ra tin nhắn group (không Title), khóa Copy khi thiếu trường bắt buộc, Tech có ô GẤP, CS / Tech có khung lưu ý. §22
- `v2026-11-17.3` · Bảng màu Castorice: tím melrose làm màu chính, xanh anakiwa làm màu phụ (nút đã copy, khung SMS), chữ xanh tarawera; cả Sáng và Tối.
- `v2026-11-17.1` · SMS Promotion: SMS không gửi được xuống dòng → Message xuống dòng thành 1 space (bỏ `\n`) ở cả tin gửi tiệm, mục Đã support và Copy Confirm SMS. §16

## 2026-11-16

- `v2026-11-16.11` · Đổi tên nút `Copy tin SMS (Alt+4)` thành `Copy Confirm SMS (Alt+4)`. §16
- `v2026-11-16.10` · Kéo thumbnail sang mục khác (vd Vấn đề ↔ Đã support): thả lên 1 ảnh => chèn đúng chỗ, thả vào ô dán ảnh => thêm cuối. §10
- `v2026-11-16.9` · Gợi ý ô Loại và ô Tóm tắt: chỉ hiện mục **bắt đầu bằng** chữ đang gõ (trước: chứa ở bất kỳ đâu), xếp theo bảng chữ cái. §4 §12
- `v2026-11-16.8` · SMS Promotion: chi tiết in vào mục Đã support của ticket bỏ 2 dòng `Price per SMS` và `Estimate Total` (vẫn có trong tin gửi tiệm). §16
- `v2026-11-16.7` · Tài liệu: vẽ lại sơ đồ architecture (Clipboard có tin SMS) và sequence (chi tiết SMS vào mục Đã support). Không đổi hành vi.
- `v2026-11-16.6` · Refactor, không đổi hành vi: helper combo tách ra file mới `ui/combo.js`; `ui/dom.js` thêm `labeledField`, `textInput`, 4 form (ticket, SMS Promotion, Shipping, Xin review) dùng chung; hàm > 3 tham số đổi sang object (`level`, `tool`) hoặc bớt tham số (`syncItem`, `onKeydown`); tách phần gắn sự kiện của `template-dialog`, `category-combo`.
- `v2026-11-16.5` · Refactor, không đổi hành vi: gom helper trùng (`isBlank`, `asString`, `pad2`) vào `domain/text.js`; `formatPhone` của SMS dùng lại `formatPhoneInput`; ô Loại và ô Tóm tắt dùng chung helper listbox trong `ui/dom.js` (`comboList`, `comboOption`, `showComboList`, `scrollToActive`).
- `v2026-11-16.4` · Bảng màu mới chàm · xanh dừa cạn · lavender · hồng phấn (light + dark) thay hồng + cyan, chữ đạt tương phản WCAG AA. Chỉ đổi `styles/tokens.css`.
- `v2026-11-16.3` · Tài liệu: ghi kế hoạch đếm SMS segment (chưa làm, chờ chốt 3 điểm). Không đổi hành vi. §16.4
- `v2026-11-16.2` · SMS Promotion: chi tiết Recipients → Estimate Total tự in cuối mục Đã support của nội dung ticket; tin promo có `.` sau Phone tiệm; tin gửi tiệm giữ xuống dòng của Message; nút mới `Copy tin SMS (Alt+4)` copy riêng tin khách nhận trên 1 dòng (xuống dòng thành `\n`, không ngoặc kép). §16
- `v2026-11-16.1` · Ô Phone (ticket) và Phone tiệm (SMS Promotion) chỉ nhận số, tự format `(111) 111-1111`; thêm ô Tên merchant cạnh Phone, in ra `Phone: (111) 111-1111 - Mr. Vương`. §4 §8

## 2026-11-13

- `v2026-11-13.9` · Ô Tóm tắt: danh sách gợi ý mới (giống ô Loại), mỗi gợi ý có `×` để xóa gợi ý không muốn giữ (vd `T` gõ nhầm); gõ không dấu vẫn ra gợi ý có dấu. §12
- `v2026-11-13.8` · Tài liệu: README ghi rõ Nhận ảnh iOS đang tạm ẩn + cách bật lại; JSDoc `ScreenCapture.capture` thêm `delayMs`. Không đổi hành vi.
- `v2026-11-13.7` · Tài liệu: `docs/ONBOARDING.md` (thứ tự đọc code cho bạn mới). Không đổi hành vi.
- `v2026-11-13.6` · Tool: `tests/tools/generate_diagrams.py`, `generate_tree.py` sinh lại sơ đồ trong `docs/diagrams/`. Không đổi hành vi.
- `v2026-11-13.5` · Tài liệu: sơ đồ cây thư mục `docs/diagrams/tree.html` (tổng quan, `src/`, `config/`). Không đổi hành vi.
- `v2026-11-13.4` · `.gitignore` bỏ qua `.agents/`, `.claude/skills/` (skill cài lại bằng `npx skills` từ `skills-lock.json`). Không đổi hành vi.
- `v2026-11-13.3` · Tài liệu: 4 sơ đồ trong `docs/diagrams/` (architecture lúc chạy, dependency giữa layer, UML class port KeyValueStore, sequence gõ Tóm tắt → Kết quả). Không đổi hành vi.
- `v2026-11-13.2` · Gợi ý Tóm tắt lưu IN HOA (giống title), gõ thường hay hoa đều ra 1 mục. §12
- `v2026-11-13.1` · Ô Tóm tắt gợi ý các Tóm tắt đã dùng (lưu trên máy, key `ticketWriter.summaries.v1`); tạm ẩn nút Nhận ảnh iOS. §12 §21

## 2026-11-12

- `v2026-11-12.15` · Tài liệu: README, SECURITY, REVIEW, CHANGELOG; sửa tham chiếu bản gốc trong CLAUDE.md; mục lục REQUIREMENTS. Không đổi hành vi.
- `v2026-11-12.14` · Kéo thả thumbnail để đổi thứ tự ảnh trong 1 mục; nút `Xóa hết ảnh` ở khối Ảnh (giữ nội dung ticket). §10
- `v2026-11-12.13` · Ô Loại chỉ chọn 1 loại, chọn xong con trỏ sang Tóm tắt; chọn loại khác thì thay. §4, §5
- `v2026-11-12.12` · Nhận ảnh iOS: iPad quét **mã QR** trên Ticket Writer; mã iPad hết hạn sau 12 tiếng, nút `Đổi mã ngay`; mã máy tính chỉ nhận từ chính máy đó; sửa kẹt ~15s do kết nối dự phòng của trình duyệt. §21
- `v2026-11-12.11` · Bỏ icon 📱, đổi tên nút thành `Nhận ảnh iOS`. §21
- `v2026-11-12.10` · Mã phone-upload chuyển ra `%LOCALAPPDATA%\TicketWriter\` (nén folder không mang mã theo), tự chuyển mã cũ. §21.1
- `v2026-11-12.9` · (tăng version, không ghi lại nội dung)
- `v2026-11-12.8` · Nhận ảnh từ iPhone / iPad qua LAN (`phone-upload/phone-upload.bat` + nút ở header); ảnh vào mục như Ctrl+V. §21
- `v2026-11-12.7` · Nút Copy / Tải ZIP / PDF nền cyan nhạt, nút đã copy màu mint (light mode). 
- `v2026-11-12.6` · Nút đang chọn (Chia đôi, Viết ticket…) nhạt hơn ở light mode.
- `v2026-11-12.5` · Nút giao diện `◐ Tự động` / `☀ Sáng` / `☾ Tối`, lưu riêng trên máy. §2, §3, §12
- `v2026-11-12.4` · Bảng màu hồng + cyan (light + dark), chữ đạt tương phản WCAG AA.
- `v2026-11-12.3` · Bảng màu kem + xanh mòng két (thay sau đó ở `.4`).
- `v2026-11-12.2` · Thanh cảnh báo lưu trữ (`config/notifications.js`): không lưu được nội dung / ảnh, bộ nhớ sắp đầy. §20
- `v2026-11-12.1` · Ảnh lưu IndexedDB: F5 / đóng Chrome không mất ảnh. §2, §10, §12

## 2026-11-10

- Bản `v2026-11-10.3` (bản cuối ngày). SMS: thêm tên nhân viên (Xin review); thêm Ticket offline (`Lưu offline` / `Mở file offline`). §18, §19
- Bỏ Type ở Chuyển CS/MKT; chụp "màn hình này" chờ ~3s trước khi chụp. §6, §10

## 2026-11-07

- Sửa câu chữ SMS Promotion; thêm SMS Xin review. §16, §18
- Gộp SMS Promotion vào Viết ticket (khối SMS trong Hỗ trợ merchant), thêm Type `All`. §16
- Tạm ẩn nhóm Setup / Training. §14.2

## 2026-11-02

- SMS Shipping: sửa ngày. Đổi tên file PDF xuất ra. §10, §17

## 2026-11-01

- Thêm Ticket Writer (bản tách file từ bản gốc 1 file `v2026-10-16.1`).
- Bookmark *Điền ticket*: điền Subject, Description, bấm Upload File(s). §9
- Tên file PDF có ngày giờ tải. §10
