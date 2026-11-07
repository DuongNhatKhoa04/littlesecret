// tests/shipping.test.js — SMS Shipping: ghép tin nhắn, trường còn thiếu, đọc/lưu state, Kết quả không có title.
(function (TW) {
  'use strict';

  const { test, assertEqual } = TW.tests;
  const D = TW.domain;
  const A = TW.application;
  const context = A.context.createContext(TW.registry);
  const config = context.shipping;

  const EXAMPLE = { merchant: ' Ms Terri ', tracking: ' 1Z96F3E30394641579 ', delivery: ' November 02 , 9:30 A.M. - 12:30 P.M. ' };

  const EXPECTED = [
    'Dear Ms Terri,',
    '',
    'We wanted to inform you that your equipment has been shipped via UPS. Below are the details for your reference:',
    '',
    'Tracking Number: 1Z96F3E30394641579',
    'Estimated Delivery: November 02 , 9:30 A.M. - 12:30 P.M.',
    '',
    'Important: Once your equipment arrives, please call us at +1 888-873-7799 at least 24 hours in advance to schedule your setup & training appointment. ' +
      'This allows our technician to prepare and ensures your terminal is ready to use as soon as possible. ' +
      'If you have any questions or need further assistance, please do not hesitate to reach out to us.',
    '',
    'Have a good day!'
  ].join('\n');

  const build = (raw) => D.shippingMessage.buildShippingMessage({ shipping: D.shipping.sanitizeShipping(raw), config });
  const missing = (raw) => D.shippingMessage.missingShippingFields({ shipping: D.shipping.sanitizeShipping(raw), config });

  test('shipping: tin nhắn đúng mẫu, đã trim', () => {
    assertEqual(build(EXAMPLE), EXPECTED);
    assertEqual(missing(EXAMPLE), []);
  });

  test('shipping: chưa nhập gì => rỗng; trường còn thiếu theo thứ tự form', () => {
    assertEqual(build({}), '');
    assertEqual(build({ merchant: '  ' }), '');
    assertEqual([missing({ merchant: 'A', tracking: '1Z' }), missing({ tracking: '1Z', delivery: 'Nov 02' }), missing({})],
      [['Estimated Delivery'], ['Tên merchant'], ['Tên merchant', 'Tracking Number', 'Estimated Delivery']]);
  });

  test('shipping: Estimated Delivery in đúng như gõ, kể cả ngày bản trước lưu dạng YYYY-MM-DD', () => {
    const line = (delivery) => build({ ...EXAMPLE, delivery }).split('\n')[5];
    assertEqual([line('Nov 4, 2026'), line('2026-11-04')], ['Estimated Delivery: Nov 4, 2026', 'Estimated Delivery: 2026-11-04']);
  });

  test('shipping: sanitize bỏ dữ liệu hỏng', () => {
    assertEqual(D.shipping.sanitizeShipping({ merchant: 1, tracking: 'X', delivery: 5, extra: 'y' }), { merchant: '', tracking: 'X', delivery: '' });
    assertEqual(D.shipping.sanitizeShipping({ merchant: 'A', tracking: 'X' }), { merchant: 'A', tracking: 'X', delivery: '' });   // bản trước chưa có delivery
    assertEqual(D.shipping.sanitizeShipping(null), { merchant: '', tracking: '', delivery: '' });
  });

  function setup(saved) {
    const data = saved ? { [context.app.storageKey]: saved } : {};
    const storage = { data, read: (key) => key in data ? JSON.parse(JSON.stringify(data[key])) : null, write: (key, value) => { data[key] = value; return true; } };
    const repository = A.sessionRepository.createSessionRepository({ storage, context });
    const store = A.store.createStore(repository.load());
    const session = A.session.createSession({ context, store });
    const images = A.imageService.createImageService({ files: {}, onChecklistImage: () => {} });
    const output = A.outputService.createOutputService({ context, session, images });
    return { storage, repository, store, session, output, shipping: A.shippingService.createShippingService({ store }) };
  }

  test('shipping: state bản trước (chưa có shipping, chưa có loại SMS) => mở khối SMS Promotion, form Shipping mặc định, dữ liệu cũ giữ nguyên', () => {
    const { session } = setup({ nav: { group: 'sms' }, ticket: { summary: 'cũ' }, sms: { shop: 'ARIA' } });
    assertEqual([session.smsActive(), session.isShipping(), session.shipping(), session.sms().shop, session.ticket().summary],
      [true, false, { merchant: '', tracking: '', delivery: '' }, 'ARIA', 'cũ']);
  });

  test('shipping: loại SMS chỉ có tác dụng trong nhóm SMS', () => {
    const { session } = setup({ nav: { group: 'ticket', smsKind: 'shipping' } });
    assertEqual([session.isShipping(), session.activeTypeKey()], [false, 'incident']);
  });

  test('shipping: sửa form, lưu và đọc lại; không phải loại ticket nên type rỗng', () => {
    const { storage, repository, store, shipping } = setup(null);
    const navigation = A.navigationService.createNavigationService({ context, store });
    navigation.selectGroup('sms');
    navigation.selectSmsKind('shipping');
    shipping.setField('merchant', 'Ms Terri');
    shipping.setField('tracking', '1Z9');
    shipping.setField('delivery', 'November 02 , 9:30 A.M. - 12:30 P.M.');
    repository.save(store.get());
    const saved = storage.data[context.app.storageKey];
    assertEqual([saved.type, saved.nav.group, saved.nav.smsKind, saved.shipping], ['', 'sms', 'shipping', { merchant: 'Ms Terri', tracking: '1Z9', delivery: 'November 02 , 9:30 A.M. - 12:30 P.M.' }]);
    assertEqual(setup(saved).session.isShipping(), true);
  });

  test('shipping: Kết quả ẩn title, khóa copy tới khi đủ trường, không có ảnh; reset chỉ xóa form Shipping', () => {
    const { store, output, shipping } = setup({ nav: { group: 'sms', smsKind: 'shipping' }, ticket: { summary: 'không hiện' }, sms: { shop: 'ARIA' } });
    assertEqual(output.compute().body, '');
    shipping.setField('merchant', 'Ms Terri');
    const partial = output.compute();
    assertEqual([partial.showTitle, partial.title, partial.canCopyBody, partial.missingFields], [false, '', false, ['Tracking Number', 'Estimated Delivery']]);
    shipping.setField('tracking', '1Z96F3E30394641579');
    shipping.setField('delivery', 'November 02 , 9:30 A.M. - 12:30 P.M.');
    assertEqual([output.compute().body, output.compute().canCopyBody], [EXPECTED, true]);
    assertEqual([output.imageList(), output.pasteTarget('s1')], [[], null]);
    shipping.reset();
    assertEqual([store.get().shipping, store.get().sms.shop], [{ merchant: '', tracking: '', delivery: '' }, 'ARIA']);
  });
})(window.TW);
