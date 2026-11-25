// tests/domain.test.js — Quy tắc nghiệp vụ: chữ, title, checklist, dòng Model, template.
(function (TW) {
  'use strict';

  const { test, assert, assertEqual } = TW.tests;
  const D = TW.domain;
  const context = TW.application.context.createContext(TW.registry);

  test('viết hoa đầu dòng, bỏ qua link/email/tên file/iPhone', () => {
    assertEqual(D.text.capitalizeLine('restart router'), 'Restart router');
    assertEqual(D.text.capitalizeLine('  đổi dây'), '  Đổi dây');
    assertEqual(D.text.capitalizeLines('a\nb'), 'A\nB');
    ['iPhone lỗi', 'http://x.com', 'abc@mail.com', 'file.txt', 'c:\\temp', 'shop_email'].forEach(s =>
      assertEqual(D.text.capitalizeLine(s), s, s));
  });

  test('tên người: viết hoa chữ đầu mỗi từ (sau khoảng trắng), giữ phần còn lại, không đổi độ dài', () => {
    assertEqual(D.text.capitalizeWords('nguyễn văn  an'), 'Nguyễn Văn  An');
    assertEqual(D.text.capitalizeWords('mr. đức McDonald '), 'Mr. Đức McDonald ');
    assertEqual([D.text.capitalizeWords(''), D.text.capitalizeWords('ß')], ['', 'ß']);
  });

  test('gạch đầu dòng: dòng sau thụt 2 khoảng trắng, bỏ dòng trống', () => {
    assertEqual(D.text.bulletize('  a \n\n b  '), '- a\n  b');
  });

  test('tìm kiếm không phân biệt dấu', () => {
    assertEqual(D.text.normalizeForSearch('Đổi Giá'), 'doi gia');
  });

  test('Loại: tách / nối / làm sạch', () => {
    assertEqual(D.title.parseCategories('abc - Clover -  '), ['ABC', 'CLOVER']);
    assertEqual(D.title.joinCategories(['ABC', 'PAX']), 'ABC - PAX');
    assertEqual(D.text.cleanCategory('  new   - cat '), 'NEW CAT');
  });

  test('checklist: số ảnh cần, nhãn mục con, tiến độ', () => {
    assertEqual(D.checklist.requiredImages({ noImage: true }), 0);
    assertEqual(D.checklist.requiredImages({ minImages: 2 }), 2);
    assertEqual(D.checklist.requiredImages({}), 1);
    assertEqual(D.checklist.itemLabel({ parent: 'Cha', text: 'Con' }), 'Cha – Con');
    const checklist = { groups: [{ title: 'G', items: [{ id: 'a' }, { id: 'b', noImage: true }, { id: 'c' }] }] };
    assertEqual(D.checklist.progress(checklist, { c: { na: true } }, { 'chk:a': 1 }), { required: 1, ok: 1, na: 1 });
  });

  test('dòng Model nằm ngay dưới Phone, cùng khối', () => {
    const type = context.typeOf('setupPax');
    const ticket = D.ticket.sanitizeTicket({ phone: '0901', chk: { 'pax-qc': { done: true } } }, context);
    const body = D.body.buildBody({ type, ticket, imageCounts: {}, model: 'A920 Pro', app: context.app });
    assert(body.startsWith('Phone: 0901\nModel: A920 Pro\n\nCần setup:\n- [x] Check QC note'), body);
  });

  test('dòng Model là dòng đầu khi không có Phone; không có nội dung thì rỗng', () => {
    const type = context.typeOf('setupPax');
    const touched = D.ticket.sanitizeTicket({ chk: { 'pax-qc': { na: true } } }, context);
    assert(D.body.buildBody({ type, ticket: touched, imageCounts: {}, model: 'A920', app: context.app }).startsWith('Model: A920\n\nCần setup:'));
    const empty = D.ticket.sanitizeTicket({}, context);
    assertEqual(D.body.buildBody({ type, ticket: empty, imageCounts: {}, model: 'A920', app: context.app }), '');
  });

  test('ô Phone: chỉ giữ số, format (111) 111-1111 khi đang gõ / dán', () => {
    const f = D.text.formatPhoneInput;
    assertEqual(['', 'abc', '1', '111', '1111', '111111', '1111111', '11111111111', '+1 (555) 123-4567', '555.123.4567 ext 9'].map(f),
      ['', '', '(1', '(111', '(111) 1', '(111) 111', '(111) 111-1', '(111) 111-1111', '(555) 123-4567', '(555) 123-4567']);
  });

  test('gợi ý: chỉ mục bắt đầu bằng chữ đang gõ (không dấu, không hoa thường), sắp theo bảng chữ cái', () => {
    const items = ['PAX', 'MẤT KẾT NỐI', 'ABC', 'KẾT NỐI WIFI', 'ĐỔI GIÁ', 'CLOVER', 'MÁY IN'];
    const s = D.text.searchSuggestions;
    assertEqual(s(items, ''), ['ABC', 'CLOVER', 'ĐỔI GIÁ', 'KẾT NỐI WIFI', 'MÁY IN', 'MẤT KẾT NỐI', 'PAX']);
    assertEqual(s(items, 'ket'), ['KẾT NỐI WIFI']);   // "MẤT KẾT NỐI" chứa "ket" ở giữa: không khớp
    assertEqual(s(items, ' ma'), ['MÁY IN', 'MẤT KẾT NỐI']);
    assertEqual(s(items, 'do'), ['ĐỔI GIÁ']);
    assertEqual(items[0], 'PAX');   // không sửa mảng gốc
  });

  test('dòng Phone kèm Tên merchant, Vai trò nếu có', () => {
    const type = context.typeOf('incident');
    const body = (ticket) => D.body.buildBody({ type, ticket: D.ticket.sanitizeTicket(ticket, context), imageCounts: {}, model: '', app: context.app });
    assertEqual(body({ phone: '(111) 111-1111', merchant: ' Mr. Vương ' }), 'Phone: (111) 111-1111 - Mr. Vương');
    assertEqual(body({ phone: '(111) 111-1111' }), 'Phone: (111) 111-1111');
    assertEqual(body({ merchant: 'Mr. Vương' }), 'Phone: Mr. Vương');
    assertEqual(body({ phone: '(111) 111-1111', merchant: 'Mr. Vương', role: 'Owner' }), 'Phone: (111) 111-1111 - Mr. Vương - Owner');
    assertEqual([body({ role: 'Partner' }), body({ phone: '1', role: 'Boss' })], ['Phone: Partner', 'Phone: 1']);   // vai trò lạ => bỏ
  });

  test('sanitize: bỏ dữ liệu hỏng, giữ phần hợp lệ', () => {
    const ticket = D.ticket.sanitizeTicket({ phone: 5, summary: 'x', lang: 'FR', conclusion: '??', blocks: { s1: [1] }, chk: { a: { done: 'yes' } } }, context);
    assertEqual([ticket.phone, ticket.summary, ticket.lang, ticket.conclusion, ticket.blocks.s1, ticket.chk.a],
      ['', 'x', 'ENG', 'Resolved', [''], { done: false, na: false }]);
  });

  test('Hỗ trợ merchant: Việc cần làm tiếp chỉ in khi Pending, Resolved thì bỏ (chữ vẫn giữ)', () => {
    const type = context.typeOf('incident');
    const body = (conclusion) => D.body.buildBody({
      type, ticket: D.ticket.sanitizeTicket({ conclusion, blocks: { s1: ['A'], s5: ['Gọi lại'] } }, context),
      imageCounts: {}, model: '', app: context.app
    });
    assertEqual(type.sections.map(s => s.label), ['Vấn đề', 'Đã support', 'Kết luận', 'Việc cần làm tiếp', 'Note']);
    assertEqual(body('Resolved'), 'Vấn đề:\n- A');
    assertEqual(body('Pending - Needs to follow up'), 'Vấn đề:\n- A\n\nKết luận: Pending - Needs to follow up\n\nViệc cần làm tiếp:\n- Gọi lại');
  });

  test('template: không lưu phone; áp vào giữ phone, ngôn ngữ, checklist', () => {
    const ticket = D.ticket.sanitizeTicket({ category: 'ABC ', summary: 'x', phone: '1', blocks: { s1: [' a ', ''] } }, context);
    const template = D.template.createTemplate({ name: 'ABC - X', typeKey: 'incident', ticket, blockKeys: context.blockKeys, now: 1 });
    assertEqual(template.ticket.phone, undefined);
    assertEqual(template.ticket.blocks.s1, ['a']);
    const target = D.ticket.sanitizeTicket({ phone: '9', lang: 'VIE', chk: { a: { done: true } } }, context);
    const applied = D.template.applyTemplate(target, template, context);
    assertEqual([applied.phone, applied.lang, applied.chk.a.done, applied.category, applied.blocks.s1], ['9', 'VIE', true, 'ABC', ['a']]);
  });

  test('template: chỉ tìm trong Tóm tắt theo từng từ, gộp khi nhập', () => {
    const list = [
      { name: 'PAX - ĐỔI GIÁ MỚI', ticket: { category: 'PAX', summary: 'Đổi giá mới' } },
      { name: 'ABC - LỖI PAX', ticket: { category: 'ABC', summary: 'Lỗi PAX' } }
    ];
    assertEqual(D.template.searchTemplates(list, 'moi doi').map(t => t.name), ['PAX - ĐỔI GIÁ MỚI']);
    assertEqual(D.template.searchTemplates(list, 'pax').map(t => t.name), ['ABC - LỖI PAX']);
    assertEqual(D.template.searchTemplates(list, '').length, 2);
    const valid = (t) => ({ name: t, type: 'incident', ticket: {} });
    const merged = D.template.mergeTemplates([valid('A')], [valid('A'), valid('B'), { name: '' }], key => key === 'incident');
    assertEqual([merged.list.length, merged.added, merged.replaced, merged.skipped], [2, 1, 1, 1]);
  });

  test('bỏ dấu tiếng Việt, giữ hoa/thường', () => {
    assertEqual(D.text.removeDiacritics('Đổi dây ĐIỆN'), 'Doi day DIEN');
  });

  test('tên ảnh: bỏ ghi chú trong ngoặc ở nhóm/parent, không lặp tên nhóm', () => {
    const labelsOf = (key) => D.imageSlots.imageSlots(context.setups.find(s => s.key === key)).map(slot => slot.label);
    const pos = labelsOf('setup');
    assert(pos.includes('Setup Router – Connect LAN modem tiệm → WAN Router mình cấp'), 'bỏ (nếu có)');
    assert(pos.includes('Setup terminal'), 'không lặp "Setup terminal – Setup terminal"');
    assert(pos.includes('Setup máy POS – Check Firewall – Advanced Inbound'), 'bỏ (làm theo thứ tự), giữ parent');
    assert(labelsOf('newDb').includes('Mở ABC, check setup – Pricing – Terminal (Dual Pricing)'), 'giữ ngoặc trong tên mục');
    assert(labelsOf('setupTraining').includes('Bước 1: Xác định tiệm và kiểm tra thiết bị – Check SN (Serial Number) trên máy'), 'giữ ngoặc trong tên mục');
    assert(context.setups.every(s => labelsOf(s.key).every(label => !/\(nếu|  |^ | $/.test(label))), 'không còn "(nếu…" / khoảng trắng thừa');
  });

  test('tên ảnh: mục chỉ có 1 ảnh thì không đánh số', () => {
    const slot = { key: 's1', label: 'Hiện trạng' };
    assertEqual(D.imageSlots.imageLabel(slot, 0, 1), 'Hiện trạng');
    assertEqual([D.imageSlots.imageLabel(slot, 0, 2), D.imageSlots.imageLabel(slot, 1, 2)], ['Hiện trạng – ảnh 1', 'Hiện trạng – ảnh 2']);
  });

  test('ZIP ảnh: tên file ASCII an toàn, đánh số theo thứ tự, đuôi theo loại ảnh', () => {
    const png = { blob: new Blob([], { type: 'image/png' }) };
    const jpg = { blob: new Blob([], { type: 'image/jpeg' }) };
    const archive = D.imageArchive.buildImageArchive({
      title: 'ABC - Lỗi in: "bill"?',
      images: [{ image: png, label: 'Cần setup – Check MID – ảnh 1' }, { image: jpg, label: 'Ghi chú/ảnh – ảnh 1' }]
    });
    assertEqual(archive.fileName, 'ABC - Loi in- -bill--.zip');
    assertEqual(archive.entries.map(e => e.name), ['01 Can setup - Check MID - anh 1.png', '02 Ghi chu-anh - anh 1.jpg']);
    assert(archive.entries[0].blob === png.blob, 'giữ nguyên file gốc');
  });

  test('ZIP ảnh: title trống => tên mặc định; >99 ảnh => số 3 chữ số', () => {
    const image = { blob: new Blob([], { type: 'image/png' }) };
    const archive = D.imageArchive.buildImageArchive({ title: '', images: Array(100).fill({ image, label: 'x' }) });
    assertEqual([archive.fileName, archive.entries[0].name, archive.entries[99].name], ['anh-ticket.zip', '001 x.png', '100 x.png']);
  });

  test('PDF ảnh: tên file ASCII, nhãn giữ tiếng Việt, giữ nguyên file gốc theo thứ tự', () => {
    const png = { blob: new Blob([], { type: 'image/png' }) };
    const jpg = { blob: new Blob([], { type: 'image/jpeg' }) };
    const now = new Date(2026, 10, 1, 14, 8);
    const { fileName, report } = D.imageArchive.buildImageReport({
      title: 'ABC - Lỗi in: "bill"?',
      images: [{ image: png, label: 'Cần setup – Check MID – ảnh 1' }, { image: jpg, label: 'Hiện trạng – ảnh 1' }],
      now
    });
    assertEqual(fileName, '1101 - 1408 - ABC - Loi in- -bill--.pdf');
    assertEqual(report.title, 'ABC - Lỗi in: "bill"?');
    assertEqual(report.entries.map(e => e.label), ['Cần setup – Check MID – ảnh 1', 'Hiện trạng – ảnh 1']);
    assert(report.entries[0].blob === png.blob && report.entries[1].blob === jpg.blob, 'giữ nguyên file gốc');
    assertEqual(D.imageArchive.buildImageReport({ title: '', images: [], now: new Date(2026, 0, 9, 5, 3) }).fileName,
      '0109 - 0503 - anh - ticket.pdf');
  });
})(window.TW);
