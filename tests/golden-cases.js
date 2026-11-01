// tests/golden-cases.js — Dữ liệu nhập mẫu. Output chuẩn sinh từ bản gốc ../ticket-writer.html (xem tests/README.md).
(function (TW) {
  'use strict';

  TW.tests.goldenCases = [
    { name: 'incident đủ mục, Workaround, ý nhiều dòng', type: 'incident', ticket: {
      category: 'ABC - CLOVER', summary: 'mất kết nối', phone: '0901234567', conclusion: 'Workaround applied',
      blocks: { s1: ['Terminal không kết nối được\nTừ sáng nay', ''], s2: ['Restart router', '  Đổi dây LAN  '], s3: ['Router lỗi'], s5: ['Thay router mới'], s6: ['Gọi lại sau 2h'] } } },
    { name: 'incident Not resolved bước đầu (Phone + Hiện trạng)', type: 'incident', ticket: {
      category: 'PAX', summary: 'không in được', phone: '123', conclusion: 'Not resolved',
      blocks: { s1: ['Máy in không ra giấy'], s6: ['note'] } } },
    { name: 'incident Not resolved đã troubleshoot, thiếu đề xuất', type: 'incident', ticket: {
      category: '', summary: 'lỗi', phone: '', conclusion: 'Not resolved',
      blocks: { s1: ['A'], s2: ['B'] } } },
    { name: 'incident Resolved, không phone', type: 'incident', ticket: {
      category: 'INTERNET', summary: 'wifi chập chờn', phone: '', conclusion: 'Resolved',
      blocks: { s1: ['Wifi rớt'], s2: ['Đổi kênh'], s3: ['Nhiễu sóng'] } } },
    { name: 'request Workaround thiếu hành động đề xuất', type: 'request', ticket: {
      category: 'ABC', summary: 'đổi giá', phone: '555', conclusion: 'Workaround applied',
      blocks: { s1: ['Đổi giá dịch vụ'], s2: ['Đã đổi 1 phần'] } } },
    { name: 'request Resolved đủ', type: 'request', ticket: {
      category: 'ABC - INTERNET', summary: 'thêm nhân viên', phone: '777', conclusion: 'Resolved',
      blocks: { s1: ['Thêm 2 nhân viên'], s2: ['Đã thêm'], s5: ['x'], s6: ['Line 1\n\n  Line 2  '] } } },
    { name: 'transfer có phone + VIE', type: 'transfer', ticket: {
      category: 'CLOVER', summary: 'hỏi marketing', phone: '0909', lang: 'VIE', conclusion: 'Not resolved',
      blocks: { s1: ['Merchant muốn chạy quảng cáo'] } } },
    { name: 'transfer rỗng', type: 'transfer', ticket: {
      category: '', summary: '', phone: '', lang: 'ENG', conclusion: 'Not resolved', blocks: {} } },
    { name: 'title chỉ có Loại, dấu - thừa cuối', type: 'incident', ticket: {
      category: 'ABC - ', summary: '', phone: '', conclusion: 'Resolved', blocks: {} } },
    { name: 'setup POS: tick, N/A, thiếu ảnh, Firewall có cha', type: 'setup', ticket: {
      category: 'ABC', summary: 'setup tiệm mới', phone: '111', conclusion: 'Not resolved',
      blocks: { s6: ['Tiệm đóng cửa 8pm'] },
      chk: { router: { done: true, na: false }, 'connect-pos': { done: true, na: false }, macdesk: { done: false, na: true },
             services: { done: true, na: false }, 'fw-in': { done: true, na: false }, 'fw-out': { done: false, na: false } } },
      images: { 'chk:router': 1, 'chk:services': 1, 'chk:fw-in': 1 } },
    { name: 'setupPax: mọi mục N/A', type: 'setupPax', ticket: {
      category: 'PAX', summary: 'a920', phone: '', conclusion: 'Not resolved', blocks: {},
      chk: { 'pax-qc': { done: false, na: true }, 'pax-mid': { done: false, na: true }, 'pax-conn': { done: false, na: true },
             'pax-cd': { done: false, na: true }, 'pax-sn': { done: false, na: true }, 'pax-close': { done: false, na: true },
             'pax-demo': { done: false, na: true }, 'pax-tz': { done: false, na: true }, 'pax-display': { done: false, na: true },
             'pax-reboot': { done: false, na: true }, 'pax-sleep': { done: false, na: true }, 'pax-sale': { done: false, na: true } } } },
    { name: 'setupPax: chưa đụng gì, chỉ phone', type: 'setupPax', ticket: {
      category: '', summary: '', phone: '222', conclusion: 'Not resolved', blocks: {} } },
    { name: 'newDb: Pricing có cha, đủ ảnh 1 phần', type: 'newDb', ticket: {
      category: 'ABC', summary: 'db', phone: '', conclusion: 'Not resolved', blocks: {},
      chk: { 'new-dbgen': { done: true, na: false }, 'new-import': { done: true, na: false }, 'new-discount': { done: true, na: false },
             'new-admin': { done: false, na: true } } },
      images: { 'chk:new-dbgen': 2, 'chk:new-discount': 1 } },
    { name: 'setupValor replace: đủ ảnh', type: 'setupValor', ticket: {
      category: '', summary: 'replace', phone: '333', conclusion: 'Not resolved', blocks: {},
      chk: { 'valor-b-wifi': { done: true, na: false } } },
      images: { 'chk:valor-b-oldbatch': 1, 'chk:valor-b-epi': 1, 'chk:valor-b-sale': 1, 'chk:valor-b-newbatch': 1 } },
    { name: 'setupTraining: có note, tip N/A', type: 'setupTraining', ticket: {
      category: 'CLOVER', summary: 'training', phone: '444', conclusion: 'Not resolved',
      blocks: { s6: ['MC hiểu hết'] },
      chk: { 'trn-shop': { done: true, na: false }, 'trn-tip': { done: false, na: true } } },
      images: { 'chk:trn-epi': 1 } }
  ];
})(window.TW);
