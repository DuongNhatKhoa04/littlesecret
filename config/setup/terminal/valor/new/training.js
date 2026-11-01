// config/setup/terminal/valor/new/training.js — Terminal Valor · Ship mới: setup + training tiệm mới.
(function (registry) {
  'use strict';

  const { addSetup, NOTE } = registry;

  // Mục có ảnh = bắt buộc 1 ảnh (hoặc N/A); mục noImage chỉ cần tick.
  addSetup('setupTraining', {
    label: 'Setup Training', tag: 'Setup Training',
    meta: { device: 'terminal', brand: 'valor', flow: 'new', models: [], order: 1 },
    sections: [NOTE],
    checklist: {
      title: 'Setup Training tiệm mới (ví dụ: VL550)', requireImages: true,
      groups: [
        { title: 'Bước 1: Xác định tiệm và kiểm tra thiết bị', items: [
          { id: 'trn-shop',  noImage: true, text: 'Ghi Tên tiệm + MID vào ticket' },
          { id: 'trn-epi',   text: 'Check EPI trên máy' },
          { id: 'trn-sn',    text: 'Check SN (Serial Number) trên máy' },
          { id: 'trn-box',   text: 'Check box ship ra', sub: ['Đối chiếu thiết bị và phụ kiện trong hộp có đủ không'] }
        ] },
        { title: 'Bước 2: Connect WiFi', items: [
          { id: 'trn-wifi',  noImage: true, text: 'Connect WiFi cho máy',
            sub: ['Vào menu 3 gạch (☰), chọn mục WiFi', 'Chọn SSID của tiệm, nhập password rồi connect'] }
        ] },
        { title: 'Bước 3: Test Sale', items: [
          { id: 'trn-sale',  noImage: true, text: 'Thực hiện 1 giao dịch test' },
          { id: 'trn-rcpt',  text: 'Check thông tin trên receipt', sub: ['Tên tiệm, MID, ngày giờ, số tiền, Authcode'] }
        ] },
        { title: 'Bước 4: Training MC các thao tác sau Sale (trong menu 3 gạch ☰)', items: [
          { id: 'trn-void',   noImage: true, text: 'Void' },
          { id: 'trn-refund', noImage: true, text: 'Refund' },
          { id: 'trn-tip',    noImage: true, text: 'Adjust Tip', sub: ['Nếu tiệm có dùng tip trên terminal, không dùng thì chọn N/A'] }
        ] },
        { title: 'Bước 5: Settlement', items: [
          { id: 'trn-settle', text: 'Đóng batch (Settlement) sau khi test và training xong',
            warn: 'Để giao dịch test không lẫn vào batch thật đầu tiên của merchant' }
        ] }
      ]
    }
  });
})(window.TW.registry);
