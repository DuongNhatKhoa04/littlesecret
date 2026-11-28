# Changelog

Mỗi lần tăng `version` trong `config/app.js` thì thêm 1 dòng ở đầu ngày tương ứng: version · đổi gì (người dùng thấy gì) · mục REQUIREMENTS liên quan. Bản cũ hơn 2026-11-12 chưa ghi version, tóm tắt theo commit.

## 2026-11-28

- `v2026-11-28.2` · SMS Promotion: tự đếm **segment** của tin khách nhận như Twilio Message Segment Calculator (GSM-7 160/153, UCS-2 70/67); dưới ô Message hiện `<số> ký tự · <số> segment · GSM-7`, UCS-2 thì chỉ ra ký tự gây ra (tô màu cảnh báo, không tự sửa). Tin gửi tiệm thêm dòng `Segments per SMS`, **Estimate Total = giá × Recipients × segment**. §16.2 §16.4
- `v2026-11-28.1` · SMS Promotion: bỏ dấu `.` cuối câu `Reply STOP To Optout` (tin gửi tiệm, mục Đã support, Copy Confirm SMS). §16

## 2026-11-27

- `v2026-11-27.4` · Bookmark **Lấy thông tin tiệm**: chạy được trên trang **My Merchant** (Tên tiệm + MID từ dòng `<Tên tiệm> / <MID>`, link trang vào ô Link Lead); **không lấy Business ZIP** nữa ở mọi trang (FRT tự hỏi). Trang Lead vẫn lấy DBA + MID. Phải kéo lại bookmark. §22.4
- `v2026-11-27.3` · Chuyển case: dòng link có nhãn `Link Lead: …` (MKT, Tech) / `Link Ticket: …` (CS). §22.2
- `v2026-11-27.2` · Chuyển case: tin ghi rõ từng dòng `Tên tiệm: …` / `Zipcode: …` / `MID: …` (Sales thay dòng `LEAD: …`, MKT / CS thay dòng `Tên tiệm ZIP`; Tech chỉ có `Tên tiệm: …`). Tạm ẩn nút **Gửi Telegram** + `Alt+G` (`telegram.hidden`). §22.2 §24
- `v2026-11-27.1` · Chuyển case: **Gửi Telegram** gửi vào group riêng của từng team (`test sale` / `test mkt` / `test cs` / `test tech`), không còn gửi chung 1 group test. §24

## 2026-11-26

- `v2026-11-26.4` · Chuyển case (mọi team): dưới hàng CBN có nút **CBN / FT** (`Alt+C`) và **VIE / ENG** (`Alt+X`), mặc định CBN + VIE. FT → dòng `FT: …` thay `CBN: …`; ENG → thêm ` - ENG` cuối dòng. Ticket mới về mặc định. §22.1 §22.2
- `v2026-11-26.3` · Chuyển case: **Tên người liên hệ** tự viết hoa chữ đầu mỗi từ (`nguyễn văn an` → `Nguyễn Văn An`), **Issue** tự viết hoa đầu dòng như ô ticket. §22.1
- `v2026-11-26.2` · Chuyển case: phím tắt **Alt+G** = Gửi Telegram (mở hộp xem trước; đã có token + tên thì Enter là gửi). Nút ghi `Gửi Telegram (Alt+G)`. §24
- `v2026-11-26.1` · Chuyển case: team mặc định là **Tech** (bấm `Ticket mới` hoặc mở lần đầu thì form về Tech, trước đây về Sales). Thứ tự team trên form không đổi. §22.1

## 2026-11-25

- `v2026-11-25.10` · Chuyển case: nút **Gửi Telegram** (bot dùng chung `@frt_transfer_bot`): xem trước rồi gửi tin + ảnh Issue vào group của team, cuối tin `FRT: <tên>`. Token mỗi máy tự dán, không nằm trong file. Tạm thời cả 4 team gửi vào group test. Gọi `api.telegram.org` là đường duy nhất ra Internet. §24, SECURITY §6
- `v2026-11-25.9` · Màu giao diện (menu Khác): chọn bằng ô tròn tô màu, dòng `Đã chọn: <tên màu>`, ô đang chọn có vòng viền; bấm ô tròn menu vẫn mở. §2
- `v2026-11-25.8` · Màu Hồng (Sáng): khu Kết quả dịu hơn (mận hồng tro #6a4664 thay mận đậm). Nút giao diện bỏ icon, chỉ ghi `Tự động` / `Sáng` / `Tối`. §2
- `v2026-11-25.7` · **Màu giao diện** (menu Khác): chọn `Tím` (mặc định) hoặc `Hồng` (bảng hồng + cyan của bản 2026-11-12, khu Kết quả khối mận), dùng được cả Sáng / Tối, lưu trên máy. Màu Tím không đổi. §2 §12
- `v2026-11-25.6` · Phím tắt **Alt+N** = Ticket mới (vẫn hỏi xác nhận, Enter là đồng ý); xóa xong con trỏ vào ô nhập đầu tiên. §3
- `v2026-11-25.5` · Sửa lỗi của bản .4: mục **Việc cần làm tiếp** hiện cả khi Kết luận là Resolved (CSS mới của mục đè lên trạng thái ẩn); màn hình hẹp vẫn hiện nút icon Chia đôi. Giờ chỉ hiện khi chọn Pending. §6
- `v2026-11-25.4` · Giao diện mới: header 1 hàng (tên app, dưới là Developed by Ryan; tab Hỗ trợ merchant / Chuyển case / SMS Shipping / Xin review thay 2 tầng Nhóm → loại; 3 nút icon chế độ xem; menu **Khác** gom Lưu template, Lưu / mở file offline, Sao lưu / Khôi phục, Đổi bên, version). Đổi tên: `Lưu ticket làm template`, `Lưu ticket ra file`, `Mở file đã lưu`, `Sao lưu gợi ý và template`, `Khôi phục từ file sao lưu`. Khu Nhập thành 1 tờ phiếu (tên mục ở cột trái, mục đầu `Cuộc gọi`), khu Kết quả là khối tím đậm, `Copy để điền` ghim ở đáy. Font Be Vietnam Pro (có sẵn trong `styles/fonts/`, bản 1 file nhúng sẵn). §2 §3 §14.2 §19 §22.1 §23
- `v2026-11-25.3` · Hỗ trợ merchant: nút **Chuyển case CS →** dưới hàng Phone, bấm là sang Chuyển case team CS, mang theo Phone / Tên merchant / Vai trò (ô trống giữ chữ cũ), khỏi gõ lại. §22.1
- `v2026-11-25.2` · Chuyển case: hàng CBN + Tên người liên hệ + Vai trò lên đầu form mọi team (hỏi số, tên, vai trò rồi mới tới Lead / tiệm / Issue, Note). Tin nhắn không đổi, cảnh báo `Còn thiếu` theo thứ tự mới. §22.1
- `v2026-11-25.1` · Chuyển case Sales: tag thêm `@daisy_sale_leader` → `@daisy_sale_leader @Kyo_SaleAdmin @Stella_SalesAdmin`, mọi giờ (không theo ca). §22.2

## 2026-11-24

- `v2026-11-24.31` · Chuyển case: bỏ tính năng Tech **Assign** (giao case tay nhanh hơn): bỏ ô tick, mẫu tin, ô Tech nhận case, copy kèm HTML. Bookmark Lấy thông tin tiệm trên trang ticket vẫn giữ (Link Ticket, Tên tiệm, MID, nội dung → Issue). §22.5
- `v2026-11-24.30` · Bookmark Lấy thông tin tiệm trên trang ticket: lấy thêm nội dung ticket (`.description-text`) vào ô Issue (giữ xuống dòng, tối đa 3000 ký tự). Phải kéo lại bookmark. §22.4
- `v2026-11-24.29` · Chuyển case Tech Assign: thêm ô CBN (Phone, không bắt buộc), in dòng riêng giữa Issue và `Thank you`. §22.5
- `v2026-11-24.28` · Chuyển case Tech Assign: Copy nội dung copy kèm bản HTML có Link Ticket nhúng vào MID → dán vào Telegram Desktop MID là link (bản chữ thường vẫn có `(link)`). §22.5
- `v2026-11-24.27` · Chuyển case Tech Assign: câu cảm ơn viết hoa `Thank you @tech`. §22.5
- `v2026-11-24.26` · Chuyển case Tech: ô tick **Assign** (supervisor giao case): form Link Ticket / Tên tiệm / MID / Issue, tin `Tên tiệm / MID (link ticket)` · Issue · `thank you @tech` (tech gõ tay ở ô **Tech nhận case**, gợi ý riêng). Bookmark Lấy thông tin tiệm chạy được trên trang ticket: lấy Link Ticket + Tên tiệm + MID từ dòng `Ticket #… for …`. Phải kéo lại bookmark. §22.4 §22.5
- `v2026-11-24.25` · Chuyển case: Ctrl+V chữ của bookmark Lấy thông tin tiệm ở bất kỳ đâu trên trang (không cần bấm vào ô) là điền, không bị Chrome hỏi quyền clipboard; cạnh nút Dán thông tin tiệm ghi gợi ý `hoặc Ctrl+V ở trang này`. §22.4
- `v2026-11-24.24` · Chuyển case: bookmark mới **Lấy thông tin tiệm** (hộp Cài bookmark) chạy trên trang Lead, copy Link Lead, DBA, MID, Business ZIP; nút **Dán thông tin tiệm** trên form điền Link Lead, Tên tiệm, MID, ZIP Code (ghi đè, trường không lấy được giữ nguyên); Chrome chặn đọc clipboard thì Ctrl+V vào ô bất kỳ của form. Selector ở `shopGrab` (`config/app.js`). §22.4
- `v2026-11-24.23` · Tài liệu: bản nháp báo cáo dự án `docs/PROJECT-REPORT.md` (tình hình, đề xuất, lợi ích, chi phí, rủi ro). Không đổi hành vi.
- `v2026-11-24.22` · Sao lưu chỉ gồm gợi ý Tóm tắt (Viết ticket), gợi ý tên người support thêm (Chuyển case, theo team) và template; bỏ ticket đang nhập, Loại, tên nhân viên, giao diện. §23
- `v2026-11-24.21` · Nút **Sao lưu** / **Khôi phục** ở header: tải 1 file JSON chứa ticket đang nhập, template, gợi ý tag người support thêm, gợi ý Tóm tắt, Loại, tên nhân viên, giao diện; máy mới chọn file đó để nạp lại (ghi đè, tải lại trang). Không gồm ảnh và link Nhận ảnh iOS. §23
- `v2026-11-24.20` · Thêm `tests/tools/build_release.py`: gộp app thành 1 file `release/ticket-writer.html` (bỏ comment) để gửi đồng nghiệp không kèm source; `smoke_ui.py` chạy được trên trang bất kỳ.
- `v2026-11-24.19` · Viết ticket: thêm **Vai trò tại tiệm** (Owner / Manager / Staff / Partner, không bắt buộc, bấm lại = bỏ chọn) cùng hàng Phone + Tên merchant; in `Phone: <SĐT> - <Tên> - <Vai trò>`. §4 §8
- `v2026-11-24.18` · Header: thêm `· Developed by Ryan` cạnh version.
- `v2026-11-24.17` · Chuyển case: khóa cả nút Mở file offline. §19
- `v2026-11-24.16` · Lưu offline: thêm ô **Tier** bắt buộc (0.5 / 1 / 1.5 / 2 / 2.5 / 3), lưu vào file và báo khi mở lại (file cũ chưa có Tier vẫn mở được); khóa Lưu offline ở Chuyển case. §19
- `v2026-11-24.15` · Chuyển case: gợi ý tên tag lưu riêng từng team (Sales / MKT / CS / Tech); danh sách chung của bản .14 chép sang mọi team. §12 §22
- `v2026-11-24.14` · Chuyển case: Ticket mới bỏ người support thêm tay, giữ người chính theo ca; tên đã thêm tay lưu trên máy (`ticketWriter.passTags.v1`), gõ ô Thêm tag hiện gợi ý như ô Tóm tắt (↓/↑, Enter, Esc, × xóa gợi ý). §22
- `v2026-11-24.13` · Chuyển case: ô GẤP chưa tick có nền đỏ chìm (thay màu xanh SMS), tick thì đỏ đậm như cũ. §22
- `v2026-11-24.12` · Chuyển case: ô GẤP có nền xanh khung SMS Promotion khi chưa tick (tick vẫn đỏ). §22
- `v2026-11-24.11` · Chuyển case: ô GẤP chuyển xuống ngay dưới Issue (Sales: dưới Note); tick không dựng lại form. §22
- `v2026-11-24.10` · Chuyển case: ô GẤP có ở cả Sales / MKT / CS (🔥🔥🔥 URGENT!! đầu tin Sales, dưới link lead / link ticket ở MKT / CS); ô tick nằm cạnh Team nhận ở đầu form. §22
- `v2026-11-24.9` · Chuyển case Tech ca 2: chỉ tag `@dustin_tech`, bỏ `@NancyNguyen_Tech`; bỏ `optional` trong config tag. §22
- `v2026-11-24.8` · Chuyển case Tech ca 2: `@dustin_tech` cố định, `@NancyNguyen_Tech` optional (mặc định không tick, tick khi đi làm); config tag có thêm `optional`. §22
- `v2026-11-24.7` · Chuyển case: ô Tag trên form: bỏ tick người hôm nay nghỉ, thêm người support thêm (tự thêm `@`, tag mọi ca, có × để bỏ); lưu theo team, F5 và Ticket mới vẫn giữ. §22
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
