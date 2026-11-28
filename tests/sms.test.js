// tests/sms.test.js — SMS Promotion: ghép tin nhắn, trường còn thiếu, đọc/lưu state, khối SMS trong Hỗ trợ merchant: chi tiết SMS vào mục Đã support.
(function (TW) {
  'use strict';

  const { test, assertEqual } = TW.tests;
  const D = TW.domain;
  const A = TW.application;
  const context = A.context.createContext(TW.registry);
  const config = context.sms;

  const EXAMPLE = {
    shop: ' ARIA NAIL BAR ', shopPhone: ' (555) 123-4567 ', recipients: '3178', price: '0.02',
    message: 'This Weekend Special 15% OFF for Pedicure $40+ , 20% Eyelash - Expire 10/18',
    customerTypes: { lastVisit: { on: true, values: { days: '365' } }, visitTimes: { on: true, values: { min: '1', max: '10000' } } }
  };

  const EXPECTED = [
    'Greeting,',
    '',
    'Please confirm the details below before we send your SMS promotion:',
    '',
    'Recipients: 3178 customers',
    'Type Customer:',
    '- Last Visit <= 365',
    '- Times visit between 1 - 10000',
    'Message:',
    '"ARIA NAIL BAR (555) 123-4567. This Weekend Special 15% OFF for Pedicure $40+ , 20% Eyelash - Expire 10/18 Reply STOP To Optout"',
    'Price per SMS: $0.02',
    'Segments per SMS: 1',
    'Estimate Total: $63.56',
    '',
    'Please carefully review the content of the Promotion message, and only when you are sure that there are no further changes should you text "OK" to this phone number. Have a nice day.'
  ].join('\n');

  // Chi tiết in vào Đã support của ticket: Recipients → hết Message, bỏ 2 dòng giá (Price per SMS, Estimate Total)
  // Bỏ các dòng chỉ có trong tin gửi tiệm (giá, segment, tổng), không tính theo số dòng để thêm dòng mới không làm lệch
  const TICKET_DETAILS = EXPECTED.split('\n\n')[2].split('\n').filter(line => !/^(Price per SMS|Segments per SMS|Estimate Total)/.test(line)).join('\n');

  const build = (raw) => D.smsMessage.buildSmsMessage({ sms: D.sms.sanitizeSms(raw, config), config });
  const missing = (raw) => D.smsMessage.missingSmsFields({ sms: D.sms.sanitizeSms(raw, config), config });

  test('sms: tin nhắn đúng mẫu', () => {
    assertEqual(build(EXAMPLE), EXPECTED);
    assertEqual(missing(EXAMPLE), []);
  });

  test('sms: chưa nhập gì => rỗng; giá chỉ nhận 3 mức, mặc định mức đầu', () => {
    assertEqual(build({}), '');
    assertEqual(config.prices, ['0.02', '0.04', '0.06', '0.08']);
    assertEqual(D.sms.sanitizeSms({ price: '0.05' }, config).price, '0.02');
    assertEqual(build({ ...EXAMPLE, price: '0.08' }).includes('Price per SMS: $0.08'), true);
  });

  test('sms: chỉ in Type Customer đã tick, số đã sửa; message có sẵn ngoặc kép không bị nhân đôi', () => {
    const body = build({
      ...EXAMPLE, message: '"Sale 10%"',
      customerTypes: { lastVisit: { on: false, values: { days: '365' } }, visitTimes: { on: true, values: { min: ' 2 ', max: '50' } } }
    });
    assertEqual(body.includes('Type Customer:\n- Times visit between 2 - 50\nMessage:\n"ARIA NAIL BAR (555) 123-4567. Sale 10% Reply STOP To Optout"\n'), true, body);
    assertEqual(body.includes('Last Visit'), false);
  });

  test('sms: Type Customer All không có ô số, tick là đủ; tiếng Việt in Tất cả', () => {
    const all = { ...EXAMPLE, customerTypes: { all: { on: true } } };
    assertEqual(build(all).includes('Type Customer:\n- All customers\nMessage:'), true, build(all));
    assertEqual(build({ ...all, lang: 'vi' }).includes('Nhóm khách:\n- Tất cả\nNội dung tin nhắn:'), true);
    assertEqual(missing(all), []);
  });

  test('sms: Message xuống dòng => nối thành 1 dòng (cách 1 space) ở cả tin gửi tiệm và bản Copy SMS (chỉ Message, không ngoặc kép)', () => {
    const raw = (message) => ({ ...EXAMPLE, shop: 'A', message });
    const promo = (message) => D.smsMessage.buildPromoText({ sms: D.sms.sanitizeSms(raw(message), config), config });
    assertEqual(build(raw('toi la hang thu nhat\ntoi la hang thu hai')).includes('\n"A (555) 123-4567. toi la hang thu nhat toi la hang thu hai Reply STOP To Optout"\n'), true);
    assertEqual(promo('toi la hang thu nhat\ntoi la hang thu hai'), 'A (555) 123-4567. toi la hang thu nhat toi la hang thu hai Reply STOP To Optout');
    assertEqual(promo(' "dong 1  \r\n  dong 2\n\ndong 3" '), 'A (555) 123-4567. dong 1 dong 2 dong 3 Reply STOP To Optout');
    assertEqual(D.smsMessage.buildMessageText({ sms: raw(' "dong 1  \r\n  dong 2" ') }), 'dong 1 dong 2');
  });

  test('sms: Phone tiệm in dạng (555) 123-4567 dù gõ kiểu nào; không đúng dạng thì in như đã gõ', () => {
    const phoneIn = (shopPhone) => build({ ...EXAMPLE, shop: 'A', message: 'B', shopPhone }).match(/"A (.*). B Reply STOP/)[1];
    assertEqual(['5551234567', '555-123-4567', '555.123.4567', '(555) 123-4567', '+1 555 123 4567', '15551234567'].map(phoneIn), Array(6).fill('(555) 123-4567'));
    assertEqual([' 555-1234 ', '555-123-4567 ext 2'].map(phoneIn), ['555-1234', '555-123-4567 ext 2']);
  });

  test('sms: trường còn thiếu', () => {
    assertEqual(missing({ shop: 'A' }), ['Phone tiệm', 'Recipients', 'Type Customer', 'Message']);
    const emptyNumber = { ...EXAMPLE, customerTypes: { lastVisit: { on: true, values: { days: ' ' } } } };
    assertEqual(missing(emptyNumber), ['Type Customer']);
  });

  test('sms: sanitize bỏ dữ liệu hỏng, số thiếu lấy mặc định', () => {
    const sms = D.sms.sanitizeSms({ shop: 1, customerTypes: { lastVisit: { on: 'yes', values: { days: 30 } }, old: { on: true } } }, config);
    assertEqual([sms.shop, sms.customerTypes.lastVisit, Object.keys(sms.customerTypes)],
      ['', { on: false, values: { days: '365' } }, ['lastVisit', 'lastVisitAtLeast', 'visitTimes', 'all']]);
  });

  test('sms: option tự thêm in sau mục có sẵn, bỏ option trống; chỉ có option tự thêm vẫn đủ Type Customer', () => {
    const body = build({ ...EXAMPLE, customOptions: [' Birthday in October ', '', 'VIP'] });
    assertEqual(body.includes('- Times visit between 1 - 10000\n- Birthday in October\n- VIP\nMessage:'), true, body);
    const onlyCustom = { ...EXAMPLE, customerTypes: {}, customOptions: ['VIP'] };
    assertEqual([missing(onlyCustom), missing({ ...onlyCustom, customOptions: ['  '] })], [[], ['Type Customer']]);
    assertEqual(D.sms.sanitizeSms({ customOptions: ['a', 1, null] }, config).customOptions, ['a']);
  });

  test('sms: Estimate Total = giá × Recipients; Recipients không phải số nguyên thì bỏ dòng', () => {
    const totalLine = (raw) => build({ ...EXAMPLE, ...raw }).split('\n').find(line => line.startsWith('Estimate Total')) || '';
    assertEqual([totalLine({ recipients: '3,178' }), totalLine({ recipients: '50000', price: '0.08' }), totalLine({ recipients: '7', price: '0.06' })],
      ['Estimate Total: $63.56', 'Estimate Total: $4,000.00', 'Estimate Total: $0.42']);
    assertEqual([totalLine({ recipients: 'abc' }), totalLine({ recipients: '' }), totalLine({ recipients: '12.5' })], ['', '', '']);
  });

  test('sms: Segments per SMS đếm trên tin khách nhận (cả tên tiệm, phone, Reply STOP); Estimate Total = giá × Recipients × segment', () => {
    const lines = (raw) => build({ ...EXAMPLE, ...raw }).split('\n').filter(line => /^(Segments|Estimate Total)/.test(line));
    // Tin mẫu 126 ký tự: 1 segment. Message dài 150 ký tự => tin 191 ký tự GSM-7 => 2 segment => tổng gấp đôi
    assertEqual([lines({}), lines({ message: 'x'.repeat(150) })],
      [['Segments per SMS: 1', 'Estimate Total: $63.56'], ['Segments per SMS: 2', 'Estimate Total: $127.12']]);
    // Nháy cong ’ => UCS-2 (70 / 67 ký tự): tin mẫu + 5 ký tự (131) thành 2 segment
    assertEqual(lines({ message: 'It’s ' + EXAMPLE.message }), ['Segments per SMS: 2', 'Estimate Total: $127.12']);
    const count = D.smsMessage.promoSegments({ sms: D.sms.sanitizeSms(EXAMPLE, config), config });
    assertEqual([count.encoding, count.units, count.segments], ['GSM-7', 126, 1]);
    // Ticket (mục Đã support) vẫn không có dòng giá / segment / tổng
    assertEqual(D.smsMessage.buildSmsDetails({ sms: D.sms.sanitizeSms(EXAMPLE, config), config }).includes('Segments'), false);
  });

  test('sms: tin nhắn tiếng Việt; ngôn ngữ lạ / bản cũ chưa có => tiếng Anh', () => {
    const body = build({ ...EXAMPLE, lang: 'vi' });
    assertEqual(body.split('\n').slice(0, 3), ['Xin chào,', '', 'Anh/chị vui lòng xác nhận thông tin dưới đây trước khi bên em gửi SMS promotion:']);
    assertEqual(body.includes('Số khách nhận: 3178 khách\nNhóm khách:\n- Lần ghé gần nhất <= 365 ngày\n- Số lần ghé từ 1 - 10000\n' +
      'Nội dung tin nhắn:\n"ARIA NAIL BAR (555) 123-4567. This Weekend Special 15% OFF for Pedicure $40+ , 20% Eyelash - Expire 10/18 Reply STOP To Optout"\n' +
      'Giá mỗi SMS: $0.02\nSố segment mỗi tin: 1\nTổng chi phí dự kiến: $63.56\n\n'), true, body);
    assertEqual([D.sms.sanitizeSms({ lang: 'fr' }, config).lang, D.sms.sanitizeSms(EXAMPLE, config).lang], ['en', 'en']);
  });

  test('sms: mẫu câu tách thành chữ + ô số', () => {
    assertEqual(D.sms.splitTemplate('Times visit between {min} - {max}'),
      [{ text: 'Times visit between ' }, { param: 'min' }, { text: ' - ' }, { param: 'max' }]);
  });

  function setup(saved) {
    const data = saved ? { [context.app.storageKey]: saved } : {};
    const storage = { data, read: (key) => key in data ? JSON.parse(JSON.stringify(data[key])) : null, write: (key, value) => { data[key] = value; return true; } };
    const repository = A.sessionRepository.createSessionRepository({ storage, context });
    const store = A.store.createStore(repository.load());
    const session = A.session.createSession({ context, store });
    const images = A.imageService.createImageService({ files: {}, onChecklistImage: () => {} });
    const output = A.outputService.createOutputService({ context, session, images });
    return { storage, repository, store, session, images, output, sms: A.smsService.createSmsService({ context, store }) };
  }

  test('sms: thêm / sửa / xóa option tự thêm, focus đúng ô', () => {
    const { store, session, sms } = setup(null);
    const changes = [];
    store.subscribe(change => changes.push(change));
    sms.insertOption(0);
    sms.setOption(0, 'VIP');
    sms.insertOption(1);
    sms.setOption(1, 'New');
    sms.removeOption(0);
    assertEqual(session.sms().customOptions, ['New']);
    assertEqual([changes[0].focus, changes[4].focus], [{ key: 'smsOption', index: 0 }, { key: 'smsOption', index: 0 }]);
  });

  test('sms: ảnh Type Customer chỉ hiện khi bật khối SMS, nằm sau ảnh ticket; Ctrl+V ngoài các mục vẫn vào mục ticket đầu', () => {
    const { session, sms } = setup(null);
    const key = D.sms.IMAGE_KEY;
    const stored = { [key]: [{ src: 'data:', copied: false }], s1: [{ src: 'data:', copied: false }] };
    const images = { list: (k) => stored[k] || [], counts: () => ({}) };
    const output = A.outputService.createOutputService({ context, session, images });
    assertEqual([output.imageList().map(x => x.label), output.pasteTarget(key)], [['Vấn đề'], 's1']);
    sms.setEnabled(true);
    assertEqual(output.imageList().map(x => x.label), ['Vấn đề', 'Type Customer']);
    assertEqual([output.pasteTarget(key), output.pasteTarget(null)], [key, 's1']);
  });

  test('sms: state bản trước (chưa có sms) => form SMS mặc định, ticket giữ nguyên', () => {
    const { session } = setup({ nav: { group: 'ticket', ticketType: 'request' }, ticket: { summary: 'cũ' } });
    assertEqual([session.sms().shop, session.sms().price, session.sms().lang, session.ticket().summary], ['', '0.02', 'en', 'cũ']);
  });

  test('sms: state bản trước đang ở tab Promotion => mở Hỗ trợ merchant, bật khối SMS, giữ dữ liệu', () => {
    const { session, store } = setup({ nav: { group: 'sms', smsKind: 'promotion', ticketType: 'transfer' }, ticket: { summary: 'cũ' }, sms: { shop: 'ARIA' } });
    assertEqual([store.get().nav.group, session.activeTypeKey(), session.smsActive(), session.sms().shop, session.ticket().summary],
      ['ticket', 'incident', true, 'ARIA', 'cũ']);
  });

  test('sms: state bản trước không ở tab Promotion => giữ dữ liệu SMS, khối SMS tắt', () => {
    const { session } = setup({ nav: { group: 'ticket' }, sms: { shop: 'ARIA' } });
    assertEqual([session.smsActive(), session.sms().shop], [false, 'ARIA']);
  });

  test('sms: sửa form, lưu và đọc lại', () => {
    const { storage, repository, store, sms } = setup(null);
    sms.setEnabled(true);
    sms.setField('shop', 'ARIA');
    sms.setField('price', '0.06');
    sms.setField('lang', 'vi');
    sms.setCustomerType('visitTimes', true);
    sms.setCustomerValue('visitTimes', 'max', '500');
    repository.save(store.get());
    const saved = storage.data[context.app.storageKey];
    assertEqual([saved.type, saved.nav.group, saved.sms.enabled, saved.sms.shop, saved.sms.price, saved.sms.lang, saved.sms.customerTypes.visitTimes],
      ['incident', 'ticket', true, 'ARIA', '0.06', 'vi', { on: true, values: { min: '1', max: '500' } }]);
    const reopened = setup(saved).session;
    assertEqual([reopened.smsActive(), reopened.sms().customerTypes.visitTimes.values.max], [true, '500']);
  });

  test('sms: chưa tick => không có kết quả SMS dù đã có dữ liệu', () => {
    const { output } = setup({ sms: EXAMPLE });
    assertEqual(output.compute().sms, null);
  });

  test('sms: khối SMS chỉ có ở Hỗ trợ merchant', () => {
    const { store, session, output, sms } = setup(null);
    sms.setEnabled(true);
    assertEqual([session.smsActive(), output.compute().sms === null], [true, false]);
    A.navigationService.createNavigationService({ context, store }).selectTicketType('transfer');
    assertEqual([session.smsActive(), output.compute().sms], [false, null]);
  });

  test('sms: bật khối SMS không đổi title, điều kiện copy của ticket; chi tiết SMS in cuối Đã support; SMS khóa copy tới khi đủ trường', () => {
    const { store, output, sms } = setup({ ticket: { summary: 'đổi giá', phone: '0901', blocks: { s1: ['Đổi giá'], s2: ['Đã đổi'] } } });
    const pick = ({ title, canCopyTitle, canCopyBody, missingFields, showTitle }) => ({ title, canCopyTitle, canCopyBody, missingFields, showTitle });
    const before = pick(output.compute());
    const ticketBody = output.compute().body;
    sms.setEnabled(true);
    assertEqual([output.compute().sms, output.compute().body], [{ body: '', message: '', missingFields: [], canCopy: false }, ticketBody]);
    sms.setField('shop', 'ARIA NAIL BAR');
    assertEqual([pick(output.compute()), output.compute().sms.canCopy, output.compute().sms.missingFields],
      [before, false, ['Phone tiệm', 'Recipients', 'Type Customer', 'Message']]);
    store.update(state => { state.sms = D.sms.sanitizeSms({ ...EXAMPLE, enabled: true }, config); });
    assertEqual([pick(output.compute()), output.compute().sms], [before, { body: EXPECTED, message: EXAMPLE.message, missingFields: [], canCopy: true }]);
    assertEqual(output.compute().body, ticketBody + '\n' + TICKET_DETAILS);
    assertEqual(output.compute().body.includes('Price per SMS') || output.compute().body.includes('Estimate Total'), false);
    sms.setEnabled(false);
    assertEqual(output.compute().body, ticketBody);
    sms.reset();
    assertEqual(store.get().sms, D.sms.createEmptySms(config));
  });

  test('sms: chỉ có chi tiết SMS (Đã support trống) vẫn in mục Đã support', () => {
    const { store, output } = setup(null);
    store.update(state => { state.sms = D.sms.sanitizeSms({ ...EXAMPLE, enabled: true }, config); });
    assertEqual(output.compute().body, 'Đã support:\n' + TICKET_DETAILS);
  });
})(window.TW);
