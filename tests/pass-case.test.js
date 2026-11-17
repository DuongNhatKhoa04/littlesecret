// tests/pass-case.test.js — Chuyển case: ghép tin theo team, GẤP, tag theo ca, trường bắt buộc, đọc/lưu state, Kết quả không có title.
(function (TW) {
  'use strict';

  const { test, assertEqual } = TW.tests;
  const D = TW.domain;
  const A = TW.application;
  const context = A.context.createContext(TW.registry);
  const config = context.passCase;

  const VALUES = {
    ticket: ' 12345 ', lead: 'https://crm/lead/9', shop: ' ARIA NAIL BAR ', zip: '75001', mid: '8800123', packageName: 'Gold',
    phone: '(555) 123-4567', contact: 'Mr. Vương', role: 'Owner', facetime: 'Có', system: 'ABC POS',
    issue: 'Terminal mất kết nối', done: 'Restart router\nRestart terminal', callback: '3:30 PM', note: ''
  };
  const passCase = (team, values = VALUES, extra = {}) => D.passCase.sanitizePassCase({ team, values, ...extra }, config);
  /** Thời điểm hh:mm giờ VN (UTC+7). */
  const vn = (hours, minutes = 0) => new Date(Date.UTC(2026, 10, 17) + ((hours * 60 + minutes - 7 * 60 + 1440) % 1440) * 60000);
  const buildAt = (now, ...args) => D.passCaseMessage.buildPassCaseMessage({ passCase: passCase(...args), config, now });
  const build = (...args) => buildAt(vn(10), ...args);
  const missing = (...args) => D.passCaseMessage.missingPassCaseFields({ passCase: passCase(...args), config });
  const SALES_END = '\nMany thanks team!\n@Stella_SalesAdmin @Kyo_SaleAdmin';
  const MKT_NIGHT = '@Chris_MKTSupport_Leader @Trivu_MarketingSupport @lucas_mktsupport';
  const MKT_MORNING = '@Tina_Am_Leader @Sarah_Pham_AM @josie_am';

  test('pass case: Sales / MKT / CS chỉ in trường của team, đã trim, Note trống thì bỏ dòng; cuối tin Many thanks team! + tag', () => {
    assertEqual(build('sales'), 'LEAD: ARIA NAIL BAR – 75001 – 8800123\nCBN: (555) 123-4567 – Mr. Vương (Owner)' + SALES_END);
    assertEqual(build('mkt'), 'LEAD: ARIA NAIL BAR – 75001 – 8800123\nPACKAGE: Gold\nCBN: (555) 123-4567 – Mr. Vương (Owner)\nMany thanks team!\n' + MKT_MORNING);
    assertEqual(build('cs'), 'TICKET: 12345\nLEAD: ARIA NAIL BAR – 75001 – 8800123\nCBN: (555) 123-4567 – Mr. Vương (Owner)\nMany thanks team!');
  });

  test('pass case: MKT tag theo ca giờ VN (ca đêm qua 0h, đổi ca đúng 8:30); ngoài ca chỉ còn Many thanks team!', () => {
    const tagLine = (now) => buildAt(now, 'mkt').split('\n').pop();
    assertEqual([vn(20), vn(23, 59), vn(0), vn(8, 29), vn(8, 30), vn(11, 59), vn(12), vn(19, 59)].map(tagLine),
      [MKT_NIGHT, MKT_NIGHT, MKT_NIGHT, MKT_NIGHT, MKT_MORNING, MKT_MORNING, 'Many thanks team!', 'Many thanks team!']);
  });

  test('pass case: Tech đủ trường, ý nhiều dòng giữ xuống dòng', () => {
    assertEqual(build('tech'), [
      'LINK LEAD: https://crm/lead/9', 'CBN: (555) 123-4567 – Mr. Vương (Owner)', 'FACETIME: Có', 'SYSTEM: ABC POS',
      'ISSUE: Terminal mất kết nối', 'FRT ĐÃ LÀM: Restart router\nRestart terminal', 'CALLBACK TIME: 3:30 PM', 'Many thanks team!'
    ].join('\n'));
  });

  test('pass case: GẤP chỉ ở team có urgent; không ghi tình trạng thì chỉ chữ GẤP', () => {
    const urgent = (team, urgentNote) => build(team, VALUES, { urgent: true, urgentNote }).split('\n')[0];
    assertEqual([urgent('tech', ' Tiệm có khách đang chờ tính tiền '), urgent('tech', ''), urgent('sales', 'x')],
      ['GẤP: Tiệm có khách đang chờ tính tiền', 'GẤP', 'LEAD: ARIA NAIL BAR – 75001 – 8800123']);
  });

  test('pass case: CBN / LEAD ghép phần nào có thì in phần đó', () => {
    assertEqual(build('sales', { shop: 'A', mid: '9', role: 'Staff' }), 'LEAD: A – 9\nCBN: Staff' + SALES_END);
    assertEqual(build('sales', { phone: '(555) 123-4567', contact: 'Ms Lan' }), 'CBN: (555) 123-4567 – Ms Lan' + SALES_END);
  });

  test('pass case: chưa nhập trường nào của team => rỗng; trường bắt buộc còn thiếu theo thứ tự form', () => {
    assertEqual([build('sales', {}), build('sales', { system: 'ABC' })], ['', '']);
    assertEqual(missing('sales', { shop: 'A' }), ['ZIP Code', 'CBN']);
    assertEqual(missing('cs', { shop: 'A', zip: '1', phone: '2' }), ['Ticket', 'MID']);
    assertEqual(missing('tech', { lead: 'x', phone: '1', issue: 'y' }), ['Cần FaceTime?', 'System', 'FRT đã làm', 'Callback Time']);
    assertEqual(['sales', 'mkt', 'cs', 'tech'].map(team => missing(team)), [[], [], [], []]);
  });

  test('pass case: sanitize bỏ team / trường lạ, dữ liệu hỏng', () => {
    const clean = D.passCase.sanitizePassCase({ team: 'xx', urgent: 'yes', urgentNote: 3, values: { shop: 'A', zip: 5, hack: 'x' } }, config);
    assertEqual([clean.team, clean.urgent, clean.urgentNote, clean.values.shop, clean.values.zip, 'hack' in clean.values], ['sales', false, '', 'A', '', false]);
    assertEqual(D.passCase.sanitizePassCase(null, config), D.passCase.createEmptyPassCase(config));
  });

  function setup(saved) {
    const data = saved ? { [context.app.storageKey]: saved } : {};
    const storage = { data, read: (key) => key in data ? JSON.parse(JSON.stringify(data[key])) : null, write: (key, value) => { data[key] = value; return true; } };
    const repository = A.sessionRepository.createSessionRepository({ storage, context });
    const store = A.store.createStore(repository.load());
    const session = A.session.createSession({ context, store });
    const images = A.imageService.createImageService({ files: {}, onChecklistImage: () => {} });
    const output = A.outputService.createOutputService({ context, session, images });
    return { storage, repository, store, session, output, service: A.passCaseService.createPassCaseService({ context, store }) };
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
    service.setUrgentNote('Khách chờ');
    service.setTeam('nope');
    repository.save(store.get());
    const reloaded = setup(storage.data[context.app.storageKey]).session.passCase();
    assertEqual([reloaded.team, reloaded.urgent, reloaded.urgentNote, reloaded.values.shop], ['tech', true, 'Khách chờ', 'ARIA']);
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
})(window.TW);
