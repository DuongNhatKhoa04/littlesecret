// tests/sms.test.js — SMS Promotion: ghép tin nhắn, trường còn thiếu, đọc/lưu state, Kết quả không có title.
(function (TW) {
  'use strict';

  const { test, assertEqual } = TW.tests;
  const D = TW.domain;
  const A = TW.application;
  const context = A.context.createContext(TW.registry);
  const config = context.sms;

  const EXAMPLE = {
    shop: ' ARIA NAIL BAR ', recipients: '3178', price: '0.02',
    message: 'This Weekend Special 15% OFF for Pedicure $40+ , 20% Eyelash - Expire 10/18',
    customerTypes: { lastVisit: { on: true, values: { days: '365' } }, visitTimes: { on: true, values: { min: '1', max: '10000' } } }
  };

  const EXPECTED = [
    'Hi ARIA NAIL BAR,',
    '',
    'Please confirm the details below before we send your SMS promotion:',
    '',
    'Recipients: 3178 customers',
    'Type Customer:',
    '- Last Visit <= 365',
    '- Times visit between 1 - 10000',
    'Message:',
    '"This Weekend Special 15% OFF for Pedicure $40+ , 20% Eyelash - Expire 10/18"',
    'Price per SMS: $0.02',
    'Estimate Total: $63.56',
    '',
    'Please carefully review the content of the Promotion message, and only when you are sure that there are no further changes should you text "OK" to this phone number. Have a nice day.'
  ].join('\n');

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
    assertEqual(body.includes('Type Customer:\n- Times visit between 2 - 50\nMessage:\n"Sale 10%"\n'), true, body);
    assertEqual(body.includes('Last Visit'), false);
  });

  test('sms: trường còn thiếu', () => {
    assertEqual(missing({ shop: 'A' }), ['Recipients', 'Type Customer', 'Message']);
    const emptyNumber = { ...EXAMPLE, customerTypes: { lastVisit: { on: true, values: { days: ' ' } } } };
    assertEqual(missing(emptyNumber), ['Type Customer']);
  });

  test('sms: sanitize bỏ dữ liệu hỏng, số thiếu lấy mặc định', () => {
    const sms = D.sms.sanitizeSms({ shop: 1, customerTypes: { lastVisit: { on: 'yes', values: { days: 30 } }, old: { on: true } } }, config);
    assertEqual([sms.shop, sms.customerTypes.lastVisit, Object.keys(sms.customerTypes)],
      ['', { on: false, values: { days: '365' } }, ['lastVisit', 'lastVisitAtLeast', 'visitTimes']]);
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

  test('sms: tin nhắn tiếng Việt; ngôn ngữ lạ / bản cũ chưa có => tiếng Anh', () => {
    const body = build({ ...EXAMPLE, lang: 'vi' });
    assertEqual(body.split('\n').slice(0, 3), ['Chào ARIA NAIL BAR,', '', 'Anh/chị vui lòng xác nhận thông tin dưới đây trước khi bên em gửi SMS promotion:']);
    assertEqual(body.includes('Số khách nhận: 3178 khách\nNhóm khách:\n- Lần ghé gần nhất <= 365 ngày\n- Số lần ghé từ 1 - 10000\n' +
      'Nội dung tin nhắn:\n"This Weekend Special 15% OFF for Pedicure $40+ , 20% Eyelash - Expire 10/18"\n' +
      'Giá mỗi SMS: $0.02\nTổng chi phí dự kiến: $63.56\n\n'), true, body);
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
    const { store, session, sms } = setup({ nav: { group: 'sms' } });
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

  test('sms: ảnh Type Customer hiện ở khối Ảnh, Ctrl+V không đứng ở mục nào thì vào Type Customer', () => {
    const { session } = setup({ nav: { group: 'sms' } });
    const key = D.sms.IMAGE_KEY;
    const stored = { [key]: [{ src: 'data:', copied: false }], s1: [{ src: 'data:', copied: false }] };   // ảnh ticket không được hiện
    const images = { list: (k) => stored[k] || [], counts: () => ({}) };
    const output = A.outputService.createOutputService({ context, session, images });
    assertEqual(output.imageList().map(x => x.label), ['Type Customer']);
    assertEqual([output.pasteTarget('s1'), output.pasteTarget(key)], [key, key]);
  });

  test('sms: state bản trước (chưa có sms) => form SMS mặc định, ticket giữ nguyên', () => {
    const { session } = setup({ nav: { group: 'ticket', ticketType: 'request' }, ticket: { summary: 'cũ' } });
    assertEqual([session.sms().shop, session.sms().price, session.sms().lang, session.ticket().summary], ['', '0.02', 'en', 'cũ']);
  });

  test('sms: sửa form, lưu và đọc lại; không phải loại ticket nên type rỗng', () => {
    const { storage, repository, store, sms } = setup(null);
    A.navigationService.createNavigationService({ context, store }).selectGroup('sms');
    sms.setField('shop', 'ARIA');
    sms.setField('price', '0.06');
    sms.setField('lang', 'vi');
    sms.setCustomerType('visitTimes', true);
    sms.setCustomerValue('visitTimes', 'max', '500');
    repository.save(store.get());
    const saved = storage.data[context.app.storageKey];
    assertEqual([saved.type, saved.nav.group, saved.sms.shop, saved.sms.price, saved.sms.lang, saved.sms.customerTypes.visitTimes],
      ['', 'sms', 'ARIA', '0.06', 'vi', { on: true, values: { min: '1', max: '500' } }]);
    assertEqual(setup(saved).session.sms().customerTypes.visitTimes.values.max, '500');
  });

  test('sms: Kết quả ẩn title, khóa copy tới khi đủ trường; reset về mặc định', () => {
    const { store, output, sms } = setup({ nav: { group: 'sms' }, ticket: { summary: 'không hiện' } });
    assertEqual(output.compute().body, '');
    sms.setField('shop', 'ARIA NAIL BAR');
    const partial = output.compute();
    assertEqual([partial.showTitle, partial.title, partial.canCopyTitle, partial.canCopyBody, partial.missingFields],
      [false, '', false, false, ['Recipients', 'Type Customer', 'Message']]);
    store.update(state => { state.sms = D.sms.sanitizeSms(EXAMPLE, config); });
    assertEqual([output.compute().body, output.compute().canCopyBody], [EXPECTED, true]);
    sms.reset();
    assertEqual(store.get().sms, D.sms.createEmptySms(config));
  });
})(window.TW);
