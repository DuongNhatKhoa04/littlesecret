// config/setup/pos/abc/new/create-db.js — POS ABC · Ship mới · bước 1: chuẩn bị trước khi ship (tạo DB) để máy tới tiệm là dùng được ngay.
(function (registry) {
  'use strict';

  const { addSetup, NOTE } = registry;

  addSetup('newDb', {
    label: 'Tạo DB máy mới', tag: 'New DB',
    meta: { device: 'pos', brand: 'abc', flow: 'new', models: [], order: 1 },
    sections: [NOTE],
    checklist: {
      title: 'Tạo DB trắng cho máy mới', requireImages: true,
      groups: [
        { title: 'Tạo DB trắng cho máy mới', items: [
          { id: 'new-dbgen',   text: 'Dùng DB gen để tạo DB trắng',
            sub: ['Cần nhập đầy đủ info, info viết HOA',
                  'License email = tên tiệm + MID@outlook.com (outlook viết thường)',
                  'Mật khẩu = tên tiệm + MID (viết HOA)',
                  'Ký tự đặc biệt cần chuyển sang ngôn ngữ tự nhiên'] },
          { id: 'new-import',  noImage: true, text: 'Copy → Import menu (nếu có) → tick Clear Database file → Submit' }
        ] },
        { title: 'Mở ABC, check setup (đè dữ liệu)', items: [
          { id: 'new-prop',     text: 'Đè shop_email trong Prop' },
          { id: 'new-nail',     text: 'Đè nail_data trong Storage', sub: ['Thông tin tiệm'] },
          { id: 'new-discount', parent: 'Pricing (trong Setup)', text: 'Discount', sub: ['Card surcharge'] },
          { id: 'new-admin',    parent: 'Pricing (trong Setup)', noImage: true, text: 'Admin', sub: ['Sale gift without checkout'] },
          { id: 'new-terminal', parent: 'Pricing (trong Setup)', text: 'Terminal (Dual Pricing)', sub: ['Use credit card terminal', 'Print card pay price', 'Show item price'] },
          { id: 'new-feedback', text: 'Feedback: tắt demo mode' },
          { id: 'new-appt',     noImage: true, text: 'Appointment', sub: ['Auto confirm appointment', '5 phần send sms'] }
        ] },
        { title: 'Tạo OneDrive', items: [
          { id: 'new-onedrive', noImage: true, text: 'Tạo OneDrive', sub: ['Dùng Strong VPN + ẩn danh', 'Tạo mail outlook như license đã tạo ở trên'] },
          { id: 'new-vpnoff',   noImage: true, text: 'Tắt Strong VPN sau khi tạo xong' },
          { id: 'new-upload',   text: 'Tải file system_exe lên OneDrive' }
        ] },
        { title: 'Upload lên CRM', items: [
          { id: 'new-crm',      noImage: true, text: 'Upload shop email + naildata lên ticket crm' }
        ] }
      ]
    }
  });
})(window.TW.registry);
