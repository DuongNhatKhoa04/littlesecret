// config/setup/terminal/valor/replace/setup.js — Terminal Valor · Replace (thay máy cũ).
(function (registry) {
  'use strict';

  const { addSetup, NOTE } = registry;

  addSetup('setupValor', {
    label: 'Setup Valor', tag: 'Setup Valor',
    meta: { device: 'terminal', brand: 'valor', flow: 'replace', models: [], order: 1 },
    sections: [NOTE],
    checklist: {
      title: 'Setup Valor (Replace thiết bị)', requireImages: true,
      groups: [
        { title: 'Replace thiết bị (thay máy cũ)', items: [
          { id: 'valor-b-wifi',     noImage: true, text: 'Connect WiFi cho máy mới' },
          { id: 'valor-b-oldbatch', text: 'Đóng Batch trên máy cũ', sub: ['Favorites → Settlement', 'Chụp ảnh xác nhận đã đóng batch máy cũ'] },
          { id: 'valor-b-epi',      text: 'Chụp EPI trong màn hình Batch Settle (trên máy mới)' },
          { id: 'valor-b-sale',     text: 'Test Sale trên máy mới', sub: ['Chụp ảnh'] },
          { id: 'valor-b-newbatch', text: 'Đóng Batch trên máy mới sau khi test sale xong', sub: ['Chụp ảnh'] }
        ] }
      ]
    }
  });
})(window.TW.registry);
