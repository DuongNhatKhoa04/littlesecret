// tests/pass-case.test.js — Chuyển case: ghép tin theo team, GẤP, tag theo ca, trường bắt buộc, đọc/lưu state, Kết quả không có title.
(function (TW) {
  'use strict';

  const { test, assertEqual } = TW.tests;
  const D = TW.domain;
  const A = TW.application;
  const context = A.context.createContext(TW.registry);
  const config = context.passCase;

  const VALUES = {
    ticket: ' 12345 ', lead: 'https://crm/lead/9', shop: ' ARIA NAIL BAR ', zip: '75001', mid: '8800123',
    phone: '(555) 123-4567', contact: 'Mr. Vương', role: 'Owner', issue: 'Terminal mất kết nối', note: ''
  };
  const passCase = (team, values = VALUES, extra = {}) => D.passCase.sanitizePassCase({ team, values, ...extra }, config);
  /** Thời điểm hh:mm giờ VN (UTC+7). */
  const vn = (hours, minutes = 0) => new Date(Date.UTC(2026, 10, 17) + ((hours * 60 + minutes - 7 * 60 + 1440) % 1440) * 60000);
  const buildAt = (now, ...args) => D.passCaseMessage.buildPassCaseMessage({ passCase: passCase(...args), config, now });
  const build = (...args) => buildAt(vn(10), ...args);
  const missing = (...args) => D.passCaseMessage.missingPassCaseFields({ passCase: passCase(...args), config });
  const SALES_END = '\nMany thanks team!\n@Stella_SalesAdmin @Kyo_SaleAdmin';
  const MKT_NIGHT = '@Chris_MKTSupport_Leader @Trivu_MarketingSupport @lucas_mktsupport';
  const MKT_DAY = '@Sarah_Pham_AM @josie_am';
  const TECH_NIGHT = '@vinny_tech @brian_technical';
  const TECH_DAY = '@dustin_tech @NancyNguyen_Tech';

  test('pass case: Sales / CS chỉ in trường của team, đã trim, Note trống thì bỏ dòng; cuối tin Many thanks team! + tag', () => {
    assertEqual(build('sales'), 'LEAD: ARIA NAIL BAR – 75001 – 8800123\nCBN: (555) 123-4567 – Mr. Vương (Owner)' + SALES_END);
    assertEqual(build('cs'), 'TICKET: 12345\nLEAD: ARIA NAIL BAR – 75001 – 8800123\nCBN: (555) 123-4567 – Mr. Vương (Owner)\nMany thanks team!');
  });

  test('pass case: MKT theo mẫu group MKT: link lead, Tên tiệm ZIP, MID, CBN Phone - Tên - Vai trò, dòng trống, Issue, Thanks team !', () => {
    assertEqual(build('mkt'), [
      'https://crm/lead/9', 'ARIA NAIL BAR 75001', 'MID: 8800123', 'CBN: (555) 123-4567 - Mr. Vương - Owner', '',
      'Terminal mất kết nối', '', 'Thanks team !', MKT_DAY
    ].join('\n'));
    assertEqual(build('mkt', { shop: 'A', phone: '1', role: 'Staff' }), ['A', 'CBN: 1 - Staff', '', 'Thanks team !', MKT_DAY].join('\n'));
    assertEqual(build('mkt', { issue: 'x' }), ['x', '', 'Thanks team !', MKT_DAY].join('\n'));
    assertEqual(missing('mkt', { shop: 'A', role: '' }), ['Link Lead', 'ZIP Code', 'MID', 'CBN', 'Tên người liên hệ', 'Issue']);
  });

  test('pass case: MKT tag theo ca giờ VN: 8:00 PM – 6:00 AM ca đêm (qua 0h), 6:00 AM – 8:00 PM ca 2', () => {
    const tagLine = (now) => buildAt(now, 'mkt').split('\n').pop();
    assertEqual([vn(20), vn(23, 59), vn(0), vn(5, 59), vn(6), vn(12), vn(19, 59)].map(tagLine),
      [MKT_NIGHT, MKT_NIGHT, MKT_NIGHT, MKT_NIGHT, MKT_DAY, MKT_DAY, MKT_DAY]);
  });

  test('pass case: Tech theo mẫu group Tech: link lead, Tên tiệm, CBN Phone - Tên - Vai trò, dòng trống, Issue, Thanks team !', () => {
    assertEqual(build('tech'), [
      'https://crm/lead/9', 'ARIA NAIL BAR', 'CBN: (555) 123-4567 - Mr. Vương - Owner', '',
      'Terminal mất kết nối', '', 'Thanks team !', TECH_DAY
    ].join('\n'));
    assertEqual(missing('tech', { lead: 'x', role: '' }), ['Tên tiệm', 'CBN', 'Tên người liên hệ', 'Issue']);
  });

  test('pass case: GẤP chỉ ở team có urgent: tick => 🔥🔥🔥 URGENT!! ngay dưới link lead', () => {
    const urgent = (team) => build(team, VALUES, { urgent: true }).split('\n').slice(0, 3);
    assertEqual([urgent('tech'), urgent('sales')], [
      ['https://crm/lead/9', '🔥🔥🔥 URGENT!!', 'ARIA NAIL BAR'],
      ['LEAD: ARIA NAIL BAR – 75001 – 8800123', 'CBN: (555) 123-4567 – Mr. Vương (Owner)', 'Many thanks team!']
    ]);
  });

  test('pass case: Tech tag theo ca giờ VN: 8:00 PM – 4:00 AM ca 1-3 (qua 0h), 4:00 AM – 8:00 PM ca 2', () => {
    const tagLine = (now) => buildAt(now, 'tech').split('\n').pop();
    assertEqual([vn(20), vn(0), vn(3, 59), vn(4), vn(12), vn(19, 59)].map(tagLine),
      [TECH_NIGHT, TECH_NIGHT, TECH_NIGHT, TECH_DAY, TECH_DAY, TECH_DAY]);
  });

  test('pass case: CBN / LEAD ghép phần nào có thì in phần đó', () => {
    assertEqual(build('sales', { shop: 'A', mid: '9', role: 'Staff' }), 'LEAD: A – 9\nCBN: Staff' + SALES_END);
    assertEqual(build('sales', { phone: '(555) 123-4567', contact: 'Ms Lan' }), 'CBN: (555) 123-4567 – Ms Lan' + SALES_END);
  });

  test('pass case: chưa nhập trường nào của team => rỗng; trường bắt buộc còn thiếu theo thứ tự form', () => {
    assertEqual([build('sales', {}), build('sales', { issue: 'ABC' })], ['', '']);
    assertEqual(missing('sales', { shop: 'A' }), ['ZIP Code', 'CBN']);
    assertEqual(missing('cs', { shop: 'A', zip: '1', phone: '2' }), ['Ticket', 'MID']);
    assertEqual(['sales', 'mkt', 'cs', 'tech'].map(team => missing(team)), [[], [], [], []]);
  });

  test('pass case: sanitize bỏ team / trường lạ, dữ liệu hỏng', () => {
    const clean = D.passCase.sanitizePassCase({ team: 'xx', urgent: 'yes', values: { shop: 'A', zip: 5, hack: 'x' } }, config);
    assertEqual([clean.team, clean.urgent, clean.values.shop, clean.values.zip, 'hack' in clean.values], ['sales', false, 'A', '', false]);
    assertEqual(D.passCase.sanitizePassCase(null, config), D.passCase.createEmptyPassCase(config));
  });

  function setup(saved) {
    const data = saved ? { [context.app.storageKey]: saved } : {};
    const storage = { data, read: (key) => key in data ? JSON.parse(JSON.stringify(data[key])) : null, write: (key, value) => { data[key] = value; return true; } };
    const repository = A.sessionRepository.createSessionRepository({ storage, context });
    const store = A.store.createStore(repository.load());
    const session = A.session.createSession({ context, store });
    const images = A.imageService.createImageService({ files: { readAsDataUrl: async () => 'data:image/png;base64,' }, onChecklistImage: () => {} });
    const output = A.outputService.createOutputService({ context, session, images });
    return { storage, repository, store, session, images, output, service: A.passCaseService.createPassCaseService({ context, store, images }) };
  }

  test('pass case: state bản trước (chưa có passCase) => form mặc định, ticket giữ nguyên', () => {
    const { session } = setup({ nav: { group: 'ticket', ticketType: 'transfer' }, ticket: { summary: 'cũ' } });
    assertEqual([session.isPassCase(), session.passCase(), session.ticket().summary], [true, D.passCase.createEmptyPassCase(config), 'cũ']);
  });

  test('pass case: sửa form, lưu và đọc lại; đổi team giữ chữ đã nhập', () => {
    const { storage, repository, store, service } = setup({ nav: { group: 'ticket', ticketType: 'transfer' } });
    service.setValue('shop', 'ARIA');
    service.setTeam('tech');
    service.setUrgent(true);
    service.setTeam('nope');
    repository.save(store.get());
    const reloaded = setup(storage.data[context.app.storageKey]).session.passCase();
    assertEqual([reloaded.team, reloaded.urgent, reloaded.values.shop], ['tech', true, 'ARIA']);
  });

  test('pass case: Kết quả ẩn title, khóa copy tới khi đủ trường, không có ảnh; reset chỉ xóa form Chuyển case', () => {
    const { store, output, service } = setup({ nav: { group: 'ticket', ticketType: 'transfer' }, ticket: { summary: 'giữ', blocks: { s1: ['x'] } } });
    assertEqual(output.compute().body, '');
    service.setValue('shop', 'ARIA');
    const partial = output.compute();
    assertEqual([partial.showTitle, partial.title, partial.canCopyBody, partial.missingFields], [false, '', false, ['ZIP Code', 'CBN']]);
    service.setValue('zip', '75001');
    service.setValue('phone', '(555) 123-4567');
    assertEqual([output.compute().body, output.compute().canCopyBody], ['LEAD: ARIA – 75001\nCBN: (555) 123-4567' + SALES_END, true]);
    assertEqual([output.imageList(), output.pasteTarget('s1')], [[], null]);
    service.reset();
    assertEqual([store.get().passCase, store.get().ticket.summary], [D.passCase.createEmptyPassCase(config), 'giữ']);
  });

  test('pass case: Issue có ảnh (MKT / Tech): Ctrl+V vào Issue, khối Ảnh chỉ ảnh Chuyển case; Ticket mới chỉ xóa ảnh Chuyển case', async () => {
    const { images, output, service } = setup({ nav: { group: 'ticket', ticketType: 'transfer' } });
    const png = () => new Blob([''], { type: 'image/png' });
    await images.add('s1', [png()]);
    await images.add('pass:issue', [png(), png()]);
    assertEqual([output.pasteTarget('s1'), output.imageList().length], [null, 0]);
    service.setTeam('mkt');
    assertEqual([output.pasteTarget('s1'), output.imageList().map(entry => entry.label)], ['pass:issue', ['Issue – ảnh 1', 'Issue – ảnh 2']]);
    service.reset();
    await images.clearKeys([]);   // chờ reset xóa xong
    assertEqual([images.list('pass:issue').length, images.list('s1').length], [0, 1]);
  });
})(window.TW);
