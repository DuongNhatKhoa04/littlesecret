// config/tickets/pass-case.js — Chuyển case: tin nhắn pass case cho Sales / MKT / CS / Tech (dán vào group của team nhận).
(function (registry) {
  'use strict';

  const { setPassCase } = registry;

  setPassCase({
    labels: {
      team: 'Team nhận', urgent: 'GẤP',
      tags: 'Tag (bỏ tick người hôm nay nghỉ)', tagAdd: 'Thêm', tagPh: '@tên người support thêm', tagRemove: 'Bỏ'
    },

    // Mọi trường của form. Đổi team vẫn giữ chữ đã nhập (trường cùng id = cùng ý nghĩa). id lưu trong state => không đổi id đang có.
    // kind: text (mặc định) | phone (tự format) | choice (options) | multiline.
    // images: true => có ô dán ảnh / chụp màn hình dưới trường, ảnh lưu như ảnh ticket (key ảnh theo id trường => không đổi id).
    fields: {
      ticket: { label: 'Link Ticket', ph: 'https://…' },
      lead: { label: 'Link Lead', ph: 'https://…' },
      shop: { label: 'Tên tiệm' },
      zip: { label: 'ZIP Code', inputMode: 'numeric' },
      mid: { label: 'MID' },
      phone: { label: 'CBN', kind: 'phone', ph: 'Số gọi lại' },
      contact: { label: 'Tên người liên hệ', ph: 'Nếu có, vd Mr. Vương' },
      role: { label: 'Vai trò tại tiệm', kind: 'choice', options: ['Owner', 'Manager', 'Staff', 'Partner'] },
      issue: { label: 'Issue', kind: 'multiline', ph: 'Vấn đề cần hỗ trợ', images: true },
      note: { label: 'Note', kind: 'multiline', ph: 'Tùy chọn' }
    },

    // Trường chung 1 hàng trên form (chỉ đổi cách xếp, không đổi tin nhắn). Team có từ 2 trường của hàng thì mới xếp chung.
    rows: [['shop', 'zip'], ['phone', 'contact', 'role']],

    // Team đầu là mặc định. id lưu trong state => không đổi id đang có.
    // fields: thứ tự trên form · required: thiếu thì khóa Copy · tips: lưu ý hiện trên form.
    // urgent: có ô tick GẤP; tick thì chữ này vào chỗ {urgent} trong lines (không tick => bỏ dòng).
    // tags: người cần tag ở dòng cuối; có from/to (giờ VN, HH:MM) thì chỉ tag trong ca đó, from > to = ca qua đêm. Ngoài mọi ca => không tag.
    // lines: từng dòng tin nhắn. {leadInfo} = Tên tiệm – ZIP – MID, {cbn} = Phone – Tên (Vai trò), {shopZip} = Tên tiệm ZIP, {caller} = Phone - Tên - Vai trò.
    //   Dòng có {…} mà mọi chỗ đều trống thì bỏ dòng. '' = dòng trống (2 dòng trống liền nhau / ở đầu tin chỉ giữ 1 / bỏ).
    // thanks: thay câu cảm ơn chung (thanks bên dưới) cho riêng team này.
    teams: [
      {
        id: 'sales', label: 'Sales',
        fields: ['shop', 'zip', 'mid', 'phone', 'contact', 'role', 'note'],
        required: ['shop', 'zip', 'phone'],
        lines: ['LEAD: {leadInfo}', 'CBN: {cbn}', 'NOTE: {note}'],
        tags: [{ names: ['@Stella_SalesAdmin', '@Kyo_SaleAdmin'] }]
      },
      {
        id: 'mkt', label: 'MKT', thanks: 'Thanks team !',
        fields: ['lead', 'shop', 'zip', 'mid', 'phone', 'contact', 'role', 'issue'],
        required: ['lead', 'shop', 'zip', 'mid', 'phone', 'contact', 'issue'],
        lines: ['{lead}', '{shopZip}', 'MID: {mid}', 'CBN: {caller}', '', '{issue}', ''],
        tags: [
          { from: '20:00', to: '06:00', names: ['@Chris_MKTSupport_Leader', '@Trivu_MarketingSupport', '@lucas_mktsupport'] },
          { from: '06:00', to: '20:00', names: ['@Sarah_Pham_AM', '@josie_am'] }
        ]
      },
      {
        id: 'cs', label: 'CS', thanks: 'Thanks team !',
        fields: ['ticket', 'shop', 'zip', 'mid', 'phone', 'contact', 'role', 'issue'],
        required: ['ticket', 'shop', 'zip', 'mid', 'phone', 'contact', 'issue'],
        lines: ['{ticket}', '{shopZip}', 'MID: {mid}', 'CBN: {caller}', '', '{issue}', ''],
        tags: [
          { from: '20:00', to: '05:00', names: ['@xuanthor_cs', '@joyce_cs'] },
          { from: '05:00', to: '20:00', names: ['@ThuTranCS'] }
        ],
        tips: [
          'Kiểm tra Ticket: xem lại lịch sử ticket trước khi tạo mới để tránh trùng lặp; xem Notes của CS để chủ động cập nhật thông tin cho MC.',
          'Proof: với các case Check Fee, Missing Tip, Double Charge, hỗ trợ MC cung cấp Proof để CS kiểm tra.',
          'Dispute: cố gắng lấy hình Dispute Letter và Receipt có chữ ký (nếu có, không bắt buộc).',
          'Quá tải cuộc gọi: không chờ được MC gửi Proof thì post lên group nhờ team Tech hỗ trợ thu thập.'
        ]
      },
      {
        id: 'tech', label: 'Tech', thanks: 'Thanks team !', urgent: '🔥🔥🔥 URGENT!!',
        fields: ['lead', 'shop', 'phone', 'contact', 'role', 'issue'],
        required: ['lead', 'shop', 'phone', 'contact', 'issue'],
        lines: ['{lead}', '{urgent}', '{shop}', 'CBN: {caller}', '', '{issue}', ''],
        tips: [
          'FRT chủ động xử lý các case Basic, không mất nhiều thời gian.',
          'Ưu tiên case Reconnect Terminal, đặc biệt khi tiệm đang có khách chờ thanh toán.',
          'Case khẩn cấp: tick GẤP và mô tả tình trạng thực tế để Tech ưu tiên xử lý.'
        ],
        tags: [
          { from: '20:00', to: '04:00', names: ['@vinny_tech', '@brian_technical'] },
          { from: '04:00', to: '20:00', names: ['@dustin_tech', '@NancyNguyen_Tech'] }
        ]
      }
    ],

    thanks: 'Many thanks team!',   // dòng cuối mọi tin; dòng tag (nếu có) nằm ngay dưới
    tagUtcOffsetMinutes: 7 * 60    // giờ VN = UTC+7, không có giờ mùa hè
  });
})(window.TW.registry);
