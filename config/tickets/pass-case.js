// config/tickets/pass-case.js — Chuyển case: tin nhắn pass case cho Sales / MKT / CS / Tech (dán vào group của team nhận).
(function (registry) {
  'use strict';

  const { setPassCase } = registry;

  setPassCase({
    labels: { team: 'Team nhận', urgent: 'GẤP', urgentNote: 'Tình trạng thực tế, vd Tiệm có khách đang chờ tính tiền' },

    // Mọi trường của form. Đổi team vẫn giữ chữ đã nhập (trường cùng id = cùng ý nghĩa). id lưu trong state => không đổi id đang có.
    // kind: text (mặc định) | phone (tự format) | choice (options) | multiline.
    fields: {
      ticket: { label: 'Ticket', ph: 'Số ticket' },
      lead: { label: 'Link Lead', ph: 'https://…' },
      shop: { label: 'Tên tiệm' },
      zip: { label: 'ZIP Code', inputMode: 'numeric' },
      mid: { label: 'MID' },
      packageName: { label: 'Package', ph: 'Nếu có' },
      phone: { label: 'CBN', kind: 'phone', ph: 'Số gọi lại' },
      contact: { label: 'Tên người liên hệ', ph: 'Nếu có, vd Mr. Vương' },
      role: { label: 'Vai trò tại tiệm', kind: 'choice', options: ['Owner', 'Manager', 'Staff'] },
      facetime: { label: 'Cần FaceTime?', kind: 'choice', options: ['Có', 'Không'] },
      system: { label: 'System', ph: 'Hệ thống tiệm đang dùng' },
      issue: { label: 'Issue', kind: 'multiline', ph: 'Vấn đề cần hỗ trợ' },
      done: { label: 'FRT đã làm', kind: 'multiline', ph: 'Các bước đã thực hiện' },
      callback: { label: 'Callback Time', ph: 'Giờ đã hẹn gọi lại tiệm' },
      note: { label: 'Note', kind: 'multiline', ph: 'Tùy chọn' }
    },

    // Team đầu là mặc định. id lưu trong state => không đổi id đang có.
    // fields: thứ tự trên form · required: thiếu thì khóa Copy · urgent: có ô tick GẤP · tips: lưu ý hiện trên form.
    // tags: người cần tag ở dòng cuối; có from/to (giờ VN, HH:MM) thì chỉ tag trong ca đó, from > to = ca qua đêm. Ngoài mọi ca => không tag.
    // lines: từng dòng tin nhắn. {leadInfo} = Tên tiệm – ZIP – MID, {cbn} = Phone – Tên (Vai trò); dòng có {…} mà mọi chỗ đều trống thì bỏ dòng.
    teams: [
      {
        id: 'sales', label: 'Sales',
        fields: ['shop', 'zip', 'mid', 'phone', 'contact', 'role', 'note'],
        required: ['shop', 'zip', 'phone'],
        lines: ['LEAD: {leadInfo}', 'CBN: {cbn}', 'NOTE: {note}'],
        tags: [{ names: ['@Stella_SalesAdmin', '@Kyo_SaleAdmin'] }]
      },
      {
        id: 'mkt', label: 'MKT',
        fields: ['shop', 'zip', 'mid', 'packageName', 'phone', 'contact', 'role', 'note'],
        required: ['shop', 'zip', 'phone'],
        lines: ['LEAD: {leadInfo}', 'PACKAGE: {packageName}', 'CBN: {cbn}', 'NOTE: {note}'],
        tags: [
          { from: '20:00', to: '08:30', names: ['@Chris_MKTSupport_Leader', '@Trivu_MarketingSupport', '@lucas_mktsupport'] },
          { from: '08:30', to: '12:00', names: ['@Tina_Am_Leader', '@Sarah_Pham_AM', '@josie_am'] }
        ]
      },
      {
        id: 'cs', label: 'CS',
        fields: ['ticket', 'shop', 'zip', 'mid', 'phone', 'contact', 'role', 'note'],
        required: ['ticket', 'shop', 'zip', 'mid', 'phone'],
        lines: ['TICKET: {ticket}', 'LEAD: {leadInfo}', 'CBN: {cbn}', 'NOTE: {note}'],
        tips: [
          'Kiểm tra Ticket: xem lại lịch sử ticket trước khi tạo mới để tránh trùng lặp; xem Notes của CS để chủ động cập nhật thông tin cho MC.',
          'Proof: với các case Check Fee, Missing Tip, Double Charge, hỗ trợ MC cung cấp Proof để CS kiểm tra.',
          'Dispute: cố gắng lấy hình Dispute Letter và Receipt có chữ ký (nếu có, không bắt buộc).',
          'Quá tải cuộc gọi: không chờ được MC gửi Proof thì post lên group nhờ team Tech hỗ trợ thu thập.'
        ]
      },
      {
        id: 'tech', label: 'Tech', urgent: true,
        fields: ['lead', 'phone', 'contact', 'role', 'facetime', 'system', 'issue', 'done', 'callback'],
        required: ['lead', 'phone', 'facetime', 'system', 'issue', 'done', 'callback'],
        lines: ['LINK LEAD: {lead}', 'CBN: {cbn}', 'FACETIME: {facetime}', 'SYSTEM: {system}', 'ISSUE: {issue}', 'FRT ĐÃ LÀM: {done}', 'CALLBACK TIME: {callback}'],
        tips: [
          'FRT chủ động xử lý các case Basic, không mất nhiều thời gian.',
          'Ưu tiên case Reconnect Terminal, đặc biệt khi tiệm đang có khách chờ thanh toán.',
          'Case khẩn cấp: tick GẤP và mô tả tình trạng thực tế để Tech ưu tiên xử lý.'
        ]
      }
    ],

    // Dòng đầu tin khi tick GẤP. Không ghi tình trạng thì chỉ còn chữ GẤP.
    urgentLine: 'GẤP: {urgentNote}',
    urgentOnly: 'GẤP',

    thanks: 'Many thanks team!',   // dòng cuối mọi tin; dòng tag (nếu có) nằm ngay dưới
    tagUtcOffsetMinutes: 7 * 60    // giờ VN = UTC+7, không có giờ mùa hè
  });
})(window.TW.registry);
