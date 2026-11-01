// config/app.js — Cấu hình chung. Sửa chuẩn ticket ở đây, không cần đụng src/.
(function (registry) {
  'use strict';

  const { setApp } = registry;

  setApp({
    version: 'v2026-11-01.4',     // hiện cạnh tên app để biết đang mở đúng bản mới
    autoCapitalize: true,         // tự viết hoa chữ cái đầu mỗi dòng (bỏ qua link, email, tên file, chữ như iPhone)
    debounceMs: 400,              // độ trễ cập nhật Kết quả (ms)

    // Key localStorage — KHÔNG ĐỔI, đổi là mất dữ liệu đã lưu của người dùng
    storageKey: 'ticketWriter.v1',
    templateKey: 'ticketWriter.templates.v1',
    categoryKey: 'ticketWriter.categories.v1',

    // Loại có sẵn trong ô Loại. Người dùng gõ thêm loại mới thì lưu riêng trên máy họ.
    categories: ['ABC', 'CLOVER', 'PAX', 'INTERNET', "VALOR"],

    marks: { done: '[x]', todo: '[ ]', na: '[N/A]' },   // ký hiệu từng dòng checklist trong nội dung
    langs: ['ENG', 'VIE'],                               // ngôn ngữ merchant (loại có showLang)
    defaultConclusion: 'Resolved',

    // requiresAction: bắt buộc có mục actionFor · showInBody: ghi dòng Kết luận vào nội dung
    // relaxWhenInitial: mới ở bước đầu (chỉ có mục đầu + Note) thì chưa bắt buộc mục actionFor
    conclusions: [
      { value: 'Resolved', hint: 'Đã xong → Done ticket trên system', requiresAction: false },
      { value: 'Pending - Needs to follow up', hint: 'Chưa xong → để ticket mở, chờ follow-up', requiresAction: false, showInBody: true }
    ],

    groups: [
      { id: 'ticket', label: 'Viết ticket' },
      { id: 'setup',  label: 'Setup / Training' },
      { id: 'sms',    label: 'SMS' }
    ],

    // Cấp con của nhóm SMS, thứ tự = thứ tự nút, mục đầu là mặc định. id lưu trong state => không đổi id đang có.
    smsKinds: [
      { id: 'promotion', label: 'Promotion' },
      { id: 'shipping',  label: 'Shipping' }
    ],

    labels: {
      category: 'Loại', summary: 'Tóm tắt (đưa vào title)', lang: 'Ngôn ngữ merchant',
      phone: 'Phone', phoneOut: 'Phone',     // phoneOut = nhãn dòng SĐT trong nội dung ticket
      modelOut: 'Model',                     // nhãn dòng Model trong nội dung ticket setup
      device: 'Thiết bị', brand: 'Hãng', model: 'Model', flow: 'Quy trình', checklist: 'Checklist'
    }
  });
})(window.TW.registry);
