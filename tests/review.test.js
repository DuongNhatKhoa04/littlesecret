// tests/review.test.js — SMS Xin review: bảng bang → chi nhánh → link, tin nhắn 2 ngôn ngữ, đọc/lưu state, Kết quả không có title, tên nhân viên.
(function (TW) {
  'use strict';

  const { test, assertEqual } = TW.tests;
  const D = TW.domain;
  const A = TW.application;
  const context = A.context.createContext(TW.registry);
  const config = context.review;

  const ARLINGTON = 'https://g.page/r/CSNU0_lEme3rEBM/review';
  const ATLANTA = 'https://g.page/r/CTki3AA3lGIkEBM/review';
  const HOUSTON = 'https://g.page/r/CXbRhObNeE8NEBM/review';

  const EXPECTED_EN = [
    'Greeting,',
    '',
    `Thank you for contacting MAC USA. If you have a moment, we’d appreciate hearing about your experience on Google: ${ARLINGTON}`,
    '',
    'Have a nice day!'
  ].join('\n');

  const EXPECTED_VI = [
    'Xin chào,',
    '',
    `Cảm ơn anh/chị đã liên hệ MAC USA. Nếu có thời gian, anh/chị có thể chia sẻ trải nghiệm của mình trên Google tại đây: ${ATLANTA}`,
    '',
    'Chúc anh/chị một ngày tốt lành!'
  ].join('\n');

  const build = (raw) => D.reviewMessage.buildReviewMessage({ review: D.review.sanitizeReview(raw, config), config });
  const missing = (raw) => D.reviewMessage.missingReviewFields({ review: D.review.sanitizeReview(raw, config), config });

  test('review: config đủ 51 bang không trùng, bang nào cũng có link chi nhánh', () => {
    const codes = config.states.map(state => state.code);
    assertEqual([codes.length, new Set(codes).size], [51, 51]);
    assertEqual(config.states.filter(state => !config.links[state.branch]), []);
    const count = (branch) => config.states.filter(state => state.branch === branch).length;
    assertEqual([count('Arlington'), count('Atlanta'), count('Houston')], [25, 24, 2]);
  });

  test('review: link đúng chi nhánh của bang', () => {
    const linkOf = (code) => config.links[D.review.findState(code, config).branch];
    assertEqual([linkOf('TX'), linkOf('CA'), linkOf('GA'), linkOf('NY'), linkOf('LA'), linkOf('MS')],
      [ARLINGTON, ARLINGTON, ATLANTA, ATLANTA, HOUSTON, HOUSTON]);
  });

  test('review: tin nhắn đúng mẫu ở 2 ngôn ngữ', () => {
    assertEqual(build({ usState: 'TX' }), EXPECTED_EN);
    assertEqual(build({ usState: 'GA', lang: 'vi' }), EXPECTED_VI);
  });

  test('review: gõ chữ viết tắt, không phân biệt hoa thường, có khoảng trắng thừa; tên bang đầy đủ không nhận', () => {
    assertEqual(['TX', 'tx', 'Tx', ' tx '].map(usState => build({ usState })), Array(4).fill(EXPECTED_EN));
    assertEqual([build({ usState: 'Texas' }), missing({ usState: 'Texas' })], ['', ['Bang hợp lệ']]);
  });

  test('review: gợi ý theo chữ viết tắt bắt đầu bằng phần đã gõ, xếp A→Z, không tìm trong tên bang', () => {
    const codes = (input) => D.review.suggestStates(input, config).map(state => state.code);
    assertEqual([codes('b'), codes('t'), codes('T '), codes('tx'), codes('zz')], [[], ['TN', 'TX'], ['TN', 'TX'], ['TX'], []]);
    assertEqual(codes('n'), ['NC', 'ND', 'NE', 'NH', 'NJ', 'NM', 'NV', 'NY']);
    assertEqual([codes('').length, codes('').slice(0, 3)], [51, ['AK', 'AL', 'AR']]);
  });

  test('review: chưa nhập => rỗng, chưa báo; bang không có trong danh sách => rỗng, báo', () => {
    assertEqual([build({}), missing({}), build({ usState: '  ' }), missing({ usState: '  ' })], ['', [], '', []]);
    assertEqual([build({ usState: 'ZZ' }), missing({ usState: 'ZZ' })], ['', ['Bang hợp lệ']]);
    assertEqual(missing({ usState: 'TX' }), []);
  });

  test('review: sanitize bỏ dữ liệu hỏng', () => {
    assertEqual(D.review.sanitizeReview({ usState: 1, lang: 'fr' }, config), { usState: '', lang: 'en' });
    assertEqual(D.review.sanitizeReview({ usState: 'TX', lang: 'vi' }, config), { usState: 'TX', lang: 'vi' });
    assertEqual(D.review.sanitizeReview(null, config), { usState: '', lang: 'en' });
  });

  function setup(saved) {
    const data = saved ? { [context.app.storageKey]: saved } : {};
    const storage = { data, read: (key) => key in data ? JSON.parse(JSON.stringify(data[key])) : null, write: (key, value) => { data[key] = value; return true; } };
    const repository = A.sessionRepository.createSessionRepository({ storage, context });
    const store = A.store.createStore(repository.load());
    const session = A.session.createSession({ context, store });
    const images = A.imageService.createImageService({ files: {}, onChecklistImage: () => {} });
    const output = A.outputService.createOutputService({ context, session, images });
    return { storage, repository, store, session, output, review: A.reviewService.createReviewService({ context, store }) };
  }

  test('review: sửa form, lưu và đọc lại; mở lại vẫn ở Xin review, không bị coi là tab Promotion cũ', () => {
    const { storage, repository, store, review } = setup(null);
    const navigation = A.navigationService.createNavigationService({ context, store });
    navigation.selectGroup('sms');
    navigation.selectSmsKind('review');
    review.setField('usState', 'TX');
    review.setField('lang', 'vi');
    repository.save(store.get());
    const saved = storage.data[context.app.storageKey];
    assertEqual([saved.type, saved.nav.group, saved.nav.smsKind, saved.review], ['', 'sms', 'review', { usState: 'TX', lang: 'vi' }]);
    const reopened = setup(saved).session;
    assertEqual([reopened.isReview(), reopened.isShipping(), reopened.smsActive(), reopened.review().usState], [true, false, false, 'TX']);
  });

  test('review: state bản trước chưa có review => form mặc định', () => {
    assertEqual(setup({ nav: { group: 'sms', smsKind: 'shipping' } }).session.review(), { usState: '', lang: 'en' });
  });

  test('review: Kết quả ẩn title, khóa copy khi bang sai, không có ảnh; reset chỉ xóa form Xin review', () => {
    const { store, output, review } = setup({ nav: { group: 'sms', smsKind: 'review' }, ticket: { summary: 'không hiện' }, shipping: { merchant: 'Ms Terri' } });
    assertEqual([output.compute().body, output.compute().canCopyBody, output.compute().missingFields], ['', false, []]);
    review.setField('usState', 'ZZ');
    const invalid = output.compute();
    assertEqual([invalid.showTitle, invalid.title, invalid.body, invalid.canCopyBody, invalid.missingFields], [false, '', '', false, ['Bang hợp lệ']]);
    review.setField('usState', 'TX');
    assertEqual([output.compute().body, output.compute().canCopyBody, output.compute().missingFields], [EXPECTED_EN, true, []]);
    assertEqual([output.imageList(), output.pasteTarget('s1')], [[], null]);
    review.reset();
    assertEqual([store.get().review, store.get().shipping.merchant], [{ usState: '', lang: 'en' }, 'Ms Terri']);
  });

  test('review: tên nhân viên lưu key riêng, mở lại vẫn còn, reset form không xóa, không vào tin nhắn', () => {
    const { storage, output, review } = setup({ nav: { group: 'sms', smsKind: 'review' } });
    const staff = A.staffService.createStaffService({ context, storage });
    assertEqual(staff.name(), '');
    staff.setName('Ryan');
    review.setField('usState', 'TX');
    assertEqual([storage.data[context.app.staffKey], output.compute().body], ['Ryan', EXPECTED_EN]);
    review.reset();
    assertEqual(A.staffService.createStaffService({ context, storage }).name(), 'Ryan');
  });

  test('review: tên nhân viên lưu hỏng => rỗng', () => {
    const storage = { read: () => 42, write: () => true };
    assertEqual(A.staffService.createStaffService({ context, storage }).name(), '');
  });
})(window.TW);
