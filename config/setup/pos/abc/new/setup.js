// config/setup/pos/abc/new/setup.js — POS ABC · Ship mới · bước 2: setup tại tiệm.
(function (registry) {
  'use strict';

  const { addSetup, NOTE } = registry;

  const TROUBLESHOOTING_URL = 'https://app.notion.com/p/Troubleshooting-Methodology-3c1cfea820a1807e84f2d494aef6de98?pvs=21';

  addSetup('setup', {
    label: 'Setup POS', tag: 'Setup',
    meta: { device: 'pos', brand: 'abc', flow: 'new', models: [], order: 2 },
    sections: [NOTE],
    checklist: {
      title: 'Setup POS ABC', requireImages: true,
      groups: [
        { title: 'Setup Router (nếu có)', items: [
          { id: 'router',      text: 'Connect LAN modem tiệm → WAN Router mình cấp',
            warn: 'Nếu setup sai sẽ bị AP Isolation',
            warnLink: { label: 'xem thêm', url: TROUBLESHOOTING_URL } },
          { id: 'connect-pos', noImage: true, text: 'Connect POS vào router: Ethernet hoặc WiFi' }
        ] },
        { title: 'Setup Macdesk (nếu chưa có thì làm ngay sau khi connect)', items: [
          { id: 'macdesk',    noImage: true, text: 'Cài Macdesk Client và chọn Install sau khi đã cài để có quyền cao nhất. Cần đảm bảo User POS đang là Administrator.',
            links: [{ label: 'link tải', url: 'https://drive.google.com/drive/folders/148IEtrXotJFskquRntAv4fI0ZUyk4KhS' }],
            warn: 'Nếu không có quyền admin và chưa Install, khi remote vào sẽ có lỗi' },
          { id: 'remote-del', noImage: true, text: 'Xóa các phần mềm remote khác' }
        ] },
        { title: 'Setup terminal', items: [
          { id: 'terminal',   text: 'Setup terminal',
            links: [{ label: 'xem lại cách setup tại đây', url: TROUBLESHOOTING_URL }] }
        ] },
        { title: 'Setup máy POS (làm theo thứ tự)', items: [
          { id: 'win-ver',    text: 'Check Version Window + Chip', sub: ['Settings → check version chipset'] },
          { id: 'services',   text: 'Check Services BitLocker + Window Update', minImages: 2,
            sub: ['Disable và chọn Take no action toàn bộ', 'Cần 2 ảnh'] },
          { id: 'datetime',   text: 'Check Date & time' },
          { id: 'java',       text: 'Download Java 321', noImage: true, links: [{ label: 'link', url: 'https://macmarketing.us/java' }] },
          { id: 'onedrive',   noImage: true, text: 'Xóa OneDrive cũ, tải OneDrive mới và cài lại',
            sub: ['Khi tải về: Ctrl+A rồi chọn Always keep on this device'] },
          { id: 'fw-in',      parent: 'Check Firewall', text: 'Advanced Inbound',
            sub: ['Enable File & Sharing ECHO', 'Có tới 4 mục ECHO'] },
          { id: 'fw-out',     parent: 'Check Firewall', text: 'Advanced Outbound',
            sub: ['Tương tự Inbound (enable File & Sharing ECHO, 4 mục ECHO)'] },
          { id: 'fw-java',    parent: 'Check Firewall', text: 'Allow App JAVA private public' },
          { id: 'ctrlpanel',  text: 'Check Control Panel', sub: ['Java 321 & tắt Update'] },
          { id: 'sync',       noImage: true, text: 'Sync data từ ondrive về',
            sub: ['Phải xóa OneDrive cũ và tải OneDrive mới trước (bước OneDrive ở trên)'],
            warn: 'Nếu ondrive lỗi thì cài lại ondrive' },
          { id: 'sysexe',     text: 'Tải systemm_exe250925.exe', noImage: true, warn: 'Chỉ cài khi máy chưa có và không có ondrive' },
          { id: 'fonts',      noImage: true, text: 'Tải font cho All users' },
          { id: 'runfirst',   noImage: true, text: 'Extract rồi chạy !RUNTHISFIRST' },
          { id: 'printer',    noImage: true, text: 'Cần connect máy in, có giấy mới ở được cash drawer' }
        ] },
        { title: 'Check ABC', items: [
          { id: 'license',    text: 'Check License', sub: ['File > Prop > Shop email = Ondrive'] },
          { id: 'shopinfo',   text: 'Check Shop info' },
          { id: 'booking',    text: 'Điền link booking lên lead', sub: ['Điền link booking trên lead trong Marketing service'] },
          { id: 'conn',       text: 'Check Connection với Terminal' },
          { id: 'printer-qr', text: 'Check Printer / Scan QR / Cashier', sub: ['Test Sale Charge rồi đóng Batch'] },
          { id: 'cd',         text: 'Check CD', sub: ['Nếu có DP cần chụp “print item”, “print card pay price” trong Terminal'] },
          { id: 'pax',        noImage: true, text: 'Nếu là PAX cần check Authorize Payment trong Terminal' },
          { id: 'menu',       text: 'Xin menu + Setup Menu cho tiệm' }
        ] },
        { title: 'Chụp checklist', items: [
          { id: 'shot',       text: 'Chụp checklist' }
        ] }
      ]
    }
  });
})(window.TW.registry);
