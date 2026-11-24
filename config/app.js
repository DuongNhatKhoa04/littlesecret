// config/app.js — Cấu hình chung. Sửa chuẩn ticket ở đây, không cần đụng src/.
(function (registry) {
  'use strict';

  const { setApp } = registry;

  setApp({
    version: 'v2026-11-24.22',      // hiện cạnh tên app để biết đang mở đúng bản mới
    autoCapitalize: true,         // tự viết hoa chữ cái đầu mỗi dòng (bỏ qua link, email, tên file, chữ như iPhone)
    debounceMs: 400,              // độ trễ cập nhật Kết quả (ms)
    offlineTiers: ['0.5', '1', '1.5', '2', '2.5', '3'],   // Tier trong hộp Lưu offline (chọn 1, bắt buộc)

    // Key localStorage — KHÔNG ĐỔI, đổi là mất dữ liệu đã lưu của người dùng
    storageKey: 'ticketWriter.v1',
    templateKey: 'ticketWriter.templates.v1',
    categoryKey: 'ticketWriter.categories.v1',
    staffKey: 'ticketWriter.staff.v1',         // tên nhân viên (form SMS Xin review), lưu riêng để Ticket mới không xóa
    themeKey: 'ticketWriter.theme.v1',         // giao diện sáng / tối / tự động, lưu riêng để Ticket mới không đổi
    summaryKey: 'ticketWriter.summaries.v1',   // Tóm tắt đã dùng, gợi ý khi gõ ô Tóm tắt
    tagKey: 'ticketWriter.passTags.v1',        // tên tag đã thêm tay ở Chuyển case theo team, gợi ý khi gõ ô Thêm tag
    // Key đưa vào file Sao lưu (tên trường ở trên): gợi ý Tóm tắt, gợi ý tên người support thêm (Chuyển case), template.
    // Không có ticket đang nhập (thông tin merchant), ảnh, mã phone-upload (gắn với từng máy).
    backupKeys: ['summaryKey', 'tagKey', 'templateKey'],
    phoneKey: 'ticketWriter.phone.v1',         // link phone-upload + đang bật nhận ảnh iOS hay không
    imageDbName: 'ticketWriter.images.v1',     // tên database IndexedDB chứa ảnh đang dán (KHÔNG ĐỔI)

    // Bookmark "Điền ticket" trên trang ticket: ô cần điền, chữ điền vào ô Comment ở khung Checklist, nút bấm sau khi điền.
    // Đổi ở đây thì phải kéo lại bookmark.
    ticketFill: {
      subject: 'input[name="subject"]',
      description: 'textarea[name="description"]',
      comment: '.checklist .comment input', commentText: 'done',   // ô Comment ở khung Checklist: không có name / placeholder
      uploadLabel: 'p.button-text', uploadText: 'Upload File(s)'                        // nút tìm theo chữ trên nút
    },

    // Loại có sẵn trong ô Loại. Người dùng gõ thêm loại mới thì lưu riêng trên máy họ.
    categories: ['ABC', 'CLOVER', 'PAX', 'INTERNET', "VALOR"],

    marks: { done: '[x]', todo: '[ ]', na: '[N/A]' },   // ký hiệu từng dòng checklist trong nội dung
    roles: ['Owner', 'Manager', 'Staff', 'Partner'],     // Vai trò tại tiệm (Viết ticket), bấm lại = bỏ chọn
    langs: ['ENG', 'VIE'],                               // ngôn ngữ merchant (loại có showLang)
    defaultConclusion: 'Resolved',

    // requiresAction: bắt buộc có mục actionFor · showInBody: ghi dòng Kết luận vào nội dung
    // relaxWhenInitial: mới ở bước đầu (chỉ có mục đầu + Note) thì chưa bắt buộc mục actionFor
    // hidesAction: ẩn mục actionFor trên form và không in vào nội dung (chữ đã nhập vẫn giữ, đổi kết luận là hiện lại)
    conclusions: [
      { value: 'Resolved', hint: 'Đã xong → Done ticket trên system', requiresAction: false, hidesAction: true },
      { value: 'Pending - Needs to follow up', hint: 'Chưa xong → để ticket mở, chờ follow-up', requiresAction: false, showInBody: true }
    ],

    // Nhận ảnh iOS / iPad qua phone-upload (phone-upload/phone-upload.bat): bao lâu hỏi 1 lần khi hàng chờ trống
    phoneUpload: { pollMs: 1500, hidden: true },   // tạm ẩn (đang dùng Send Anywhere): xóa hidden là hiện lại

    // Nút giao diện ở header: bấm để sang mục kế tiếp. Mục đầu là mặc định. id lưu trên máy => không đổi id.
    // auto = theo hệ điều hành (Windows đang sáng/tối thì app theo)
    themes: [
      { id: 'auto',  label: '◐ Tự động' },
      { id: 'light', label: '☀ Sáng' },
      { id: 'dark',  label: '☾ Tối' }
    ],

    groups: [
      { id: 'ticket', label: 'Viết ticket' },
      { id: 'setup',  label: 'Setup / Training', hidden: true },   // tạm ẩn: xóa hidden là hiện lại
      { id: 'sms',    label: 'SMS' }
    ],

    // Cấp con của nhóm SMS, thứ tự = thứ tự nút, mục đầu là mặc định. id lưu trong state => không đổi id đang có.
    smsKinds: [
      { id: 'shipping',  label: 'Shipping' },
      { id: 'review',    label: 'Xin review' }
    ],

    labels: {
      category: 'Loại', summary: 'Tóm tắt (đưa vào title)', lang: 'Ngôn ngữ merchant',
      phone: 'Phone', merchant: 'Tên merchant', role: 'Vai trò tại tiệm', phoneOut: 'Phone',     // phoneOut = nhãn dòng SĐT trong nội dung ticket
      modelOut: 'Model',                     // nhãn dòng Model trong nội dung ticket setup
      device: 'Thiết bị', brand: 'Hãng', model: 'Model', flow: 'Quy trình', checklist: 'Checklist'
    }
  });
})(window.TW.registry);
