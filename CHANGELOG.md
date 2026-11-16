# Changelog

Mỗi lần tăng `version` trong `config/app.js` thì thêm 1 dòng ở đầu ngày tương ứng: version · đổi gì (người dùng thấy gì) · mục REQUIREMENTS liên quan. Bản cũ hơn 2026-11-12 chưa ghi version, tóm tắt theo commit.

## 2026-11-16

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
