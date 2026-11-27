// config/app.js — Cấu hình chung. Sửa chuẩn ticket ở đây, không cần đụng src/.
(function (registry) {
  'use strict';

  const { setApp } = registry;

  setApp({
    version: 'v2026-11-27.2',      // hiện cuối menu Khác để biết đang mở đúng bản mới
    autoCapitalize: true,         // tự viết hoa chữ cái đầu mỗi dòng (bỏ qua link, email, tên file, chữ như iPhone)
    debounceMs: 400,              // độ trễ cập nhật Kết quả (ms)
    offlineTiers: ['0.5', '1', '1.5', '2', '2.5', '3'],   // Tier trong hộp Lưu ticket ra file (chọn 1, bắt buộc)

    // Key localStorage — KHÔNG ĐỔI, đổi là mất dữ liệu đã lưu của người dùng
    storageKey: 'ticketWriter.v1',
    templateKey: 'ticketWriter.templates.v1',
    categoryKey: 'ticketWriter.categories.v1',
    staffKey: 'ticketWriter.staff.v1',         // tên nhân viên (form SMS Xin review), lưu riêng để Ticket mới không xóa
    themeKey: 'ticketWriter.theme.v1',         // giao diện sáng / tối / tự động, lưu riêng để Ticket mới không đổi
    paletteKey: 'ticketWriter.palette.v1',     // màu giao diện (Tím / Hồng…), lưu riêng như themeKey
    telegramTokenKey: 'ticketWriter.telegram.v1',   // token bot Telegram, mỗi máy tự dán. KHÔNG đưa vào backupKeys (file Sao lưu không được mang token)
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

    // Bookmark "Lấy thông tin tiệm" (portal). Đổi ở đây thì phải kéo lại bookmark.
    // Trang ticket: dòng tiêu đề `Ticket #… for <Tên tiệm> / <MID>` (ticketHeader, tách bằng ticketPattern), nội dung ticket (description);
    //   Link Ticket = địa chỉ trang đang mở.
    // Trang Lead: ô DBA, MID, Business ZIP; Link Lead = địa chỉ trang đang mở.
    // ZIP là ô chọn (react-select) không có name cố định => lấy mọi ô chọn có giá trị, giữ ô có dạng ZIP; trùng nhiều ô khác nhau thì bỏ ZIP.
    shopGrab: {
      ticketHeader: '.last-item-display .mid', ticketPattern: '^for (.+) / (\\S+)$',
      description: '.description-text',   // trang ticket: nội dung ticket => ô Issue
      shop: 'input[name="lf_3901"]',
      mid: 'input[name="lf_3548"]',
      zip: '.react-select__input-container[data-value]', zipPattern: '^\\d{5}(-\\d{4})?$'
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
      { id: 'auto',  label: 'Tự động' },
      { id: 'light', label: 'Sáng' },
      { id: 'dark',  label: 'Tối' }
    ],

    // Gửi Chuyển case vào group bằng bot Telegram (cả team dùng chung 1 bot). ID group của từng team: chatId trong config/tickets/pass-case.js.
    // apiBase: địa chỉ DUY NHẤT app được gọi ra Internet (docs/SECURITY.md §6). senderLine: dòng người chuyển cuối tin, {name} = tên nhân viên.
    telegram: {
      hidden: true,   // TẠM ẨN nút Gửi Telegram + Alt+G (code giữ nguyên): xóa dòng này là hiện lại
      apiBase: 'https://api.telegram.org',
      senderLine: 'FRT: {name}',
      texts: {
        notReady: 'Tin chưa đủ trường bắt buộc: điền đủ như khi Copy nội dung.',
        noGroup: 'Team này chưa có group Telegram trong config (chatId).',
        noToken: 'Máy này chưa có token bot: dán token (hỏi trưởng nhóm) vào ô bên dưới.',
        noName: 'Nhập tên của bạn để cuối tin ghi người chuyển case.',
        network: 'Không gọi được Telegram (mạng / proxy chặn). Tin CHƯA gửi: dùng Copy nội dung.',
        badToken: 'Token sai hoặc đã đổi (revoke): bấm Đổi token, dán token mới.',
        noChat: 'Bot không gửi được vào group này (bot chưa ở trong group, bị xóa, hoặc ID group sai). Báo trưởng nhóm.',
        tooMany: 'Telegram báo gửi quá nhanh: chờ {seconds} giây rồi gửi lại.',
        other: 'Telegram báo lỗi: {detail}'
      }
    },

    // Màu giao diện, chọn ở menu Khác (dùng chung với Sáng / Tối ở trên). Mục đầu là mặc định = màu trong styles/tokens.css.
    // Mục khác: data-palette="<id>" trên <html>, màu ở styles/palette-<id>.css (nhớ thêm <link> vào index.html). id lưu trên máy => không đổi id.
    palettes: [
      { id: 'castorice', label: 'Tím',  swatch: '#c9b3ff' },   // swatch: màu tô ô tròn để chọn
      { id: 'pink',      label: 'Hồng', swatch: '#fea2ba' }
    ],

    // Thứ tự = thứ tự tab ở header. Nhóm ticket / SMS không có tab riêng: mỗi loại của nhóm là 1 tab; nhóm Setup là 1 tab.
    groups: [
      { id: 'ticket', label: 'Viết ticket' },
      { id: 'setup',  label: 'Setup / Training', hidden: true },   // tạm ẩn: xóa hidden là hiện lại
      { id: 'sms',    label: 'SMS' }
    ],

    // Loại SMS, mỗi loại 1 tab, thứ tự = thứ tự tab, mục đầu là mặc định. id lưu trong state => không đổi id đang có.
    smsKinds: [
      { id: 'shipping',  label: 'SMS Shipping' },
      { id: 'review',    label: 'Xin review' }
    ],

    labels: {
      category: 'Loại', summary: 'Tóm tắt (đưa vào title)', lang: 'Ngôn ngữ merchant',
      phone: 'Phone', merchant: 'Tên merchant', role: 'Vai trò tại tiệm', phoneOut: 'Phone',     // phoneOut = nhãn dòng SĐT trong nội dung ticket
      modelOut: 'Model',                     // nhãn dòng Model trong nội dung ticket setup
      callSection: 'Cuộc gọi', callHint: 'Loại và Tóm tắt thành title',   // mục đầu form ticket (Loại, Tóm tắt, Phone…)
      device: 'Thiết bị', brand: 'Hãng', model: 'Model', flow: 'Quy trình', checklist: 'Checklist'
    }
  });
})(window.TW.registry);
