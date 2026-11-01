// config/tickets/incident.js — Viết ticket: Hỗ trợ merchant (gộp Xử lý vấn đề + Xử lý yêu cầu).
(function (registry) {
  'use strict';

  const { addTicket, NOTE } = registry;

  addTicket('incident', {
    label: 'Hỗ trợ merchant', tag: 'Incident',
    formerKeys: ['request'],   // loại "Xử lý yêu cầu" đã gộp vào đây: state / template cũ của nó mở bằng loại này
    sections: [
      { key: 's1', label: 'Vấn đề',            ph: 'Merchant cần support gì: lỗi gì / yêu cầu gì, từ khi nào…' },
      { key: 's2', label: 'Đã support',        ph: 'Đã kiểm tra / làm những gì…' },
      { key: 'c',  label: 'Kết luận', kind: 'conclusion' },
      { key: 's5', label: 'Việc cần làm tiếp', ph: 'Việc còn lại cần follow-up (chỉ hiện khi Pending)…', actionFor: true },
      NOTE
    ]
  });
})(window.TW.registry);
