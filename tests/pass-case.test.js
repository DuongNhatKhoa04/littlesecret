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
  const TECH_DAY = '@dustin_tech';
  const CS_NIGHT = '@xuanthor_cs @joyce_cs';
  const CS_DAY = '@ThuTranCS';

  test('pass case: Sales chỉ in trường của team, đã trim, Note trống thì bỏ dòng; cuối tin Many thanks team! + tag', () => {
    assertEqual(build('sales'), 'LEAD: ARIA NAIL BAR – 75001 – 8800123\nCBN: (555) 123-4567 – Mr. Vương (Owner)' + SALES_END);
  });

  test('pass case: CS theo mẫu group CS: link ticket, Tên tiệm ZIP, MID, CBN, Issue, Thanks team !; tag ca 1-3 8:00 PM – 5:00 AM, ca 2 sau 5:00 AM', () => {
    assertEqual(buildAt(vn(21), 'cs', { ...VALUES, ticket: 'https://crm/ticket/7' }), [
      'https://crm/ticket/7', 'ARIA NAIL BAR 75001', 'MID: 8800123', 'CBN: (555) 123-4567 - Mr. Vương - Owner', '',
      'Terminal mất kết nối', '', 'Thanks team !', CS_NIGHT
    ].join('\n'));
    const tagLine = (now) => buildAt(now, 'cs').split('\n').pop();
    assertEqual([vn(20), vn(4, 59), vn(5), vn(19, 59)].map(tagLine), [CS_NIGHT, CS_NIGHT, CS_DAY, CS_DAY]);
    assertEqual(missing('cs', { shop: 'A', role: '' }), ['Link Ticket', 'ZIP Code', 'MID', 'CBN', 'Tên người liên hệ', 'Issue']);
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

  test('pass case: GẤP mọi team: tick => 🔥🔥🔥 URGENT!! đầu tin (Sales) / ngay dưới link lead, link ticket', () => {
    const urgent = (team) => build(team, { ...VALUES, ticket: 'https://crm/ticket/7' }, { urgent: true }).split('\n').slice(0, 3);
    assertEqual(['tech', 'mkt', 'cs', 'sales'].map(urgent), [
      ['https://crm/lead/9', '🔥🔥🔥 URGENT!!', 'ARIA NAIL BAR'],
      ['https://crm/lead/9', '🔥🔥🔥 URGENT!!', 'ARIA NAIL BAR 75001'],
      ['https://crm/ticket/7', '🔥🔥🔥 URGENT!!', 'ARIA NAIL BAR 75001'],
      ['🔥🔥🔥 URGENT!!', 'LEAD: ARIA NAIL BAR – 75001 – 8800123', 'CBN: (555) 123-4567 – Mr. Vương (Owner)']
    ]);
  });

  test('pass case: Tech tag theo ca giờ VN: 8:00 PM – 4:00 AM ca 1-3 (qua 0h), 4:00 AM – 8:00 PM ca 2', () => {
    const tagLine = (now) => buildAt(now, 'tech').split('\n').pop();
    assertEqual([vn(20), vn(0), vn(3, 59), vn(4), vn(12), vn(19, 59)].map(tagLine),
      [TECH_NIGHT, TECH_NIGHT, TECH_NIGHT, TECH_DAY, TECH_DAY, TECH_DAY]);
  });

  test('pass case: tag chỉnh tay theo team: bỏ tick = không tag, người thêm tay tag mọi ca (sau người của ca), trùng người ca thì không lặp', () => {
    const tags = { mkt: { off: ['@josie_am'], extra: ['@helper', '@Sarah_Pham_AM'] } };
    const tagLine = (now) => buildAt(now, 'mkt', VALUES, { tags }).split('\n').pop();
    assertEqual([tagLine(vn(10)), tagLine(vn(22))], ['@Sarah_Pham_AM @helper', MKT_NIGHT + ' @helper @Sarah_Pham_AM']);
    const listed = D.passCaseMessage.passCaseTags({ passCase: passCase('mkt', VALUES, { tags }), config, now: vn(10) });
    assertEqual(listed, [
      { name: '@Sarah_Pham_AM', on: true, extra: false }, { name: '@josie_am', on: false, extra: false }, { name: '@helper', on: true, extra: true }
    ]);
    assertEqual(buildAt(vn(10), 'mkt', VALUES, { tags: { mkt: { off: ['@Sarah_Pham_AM', '@josie_am'], extra: [] } } }).split('\n').pop(), 'Thanks team !');
    assertEqual(['  an  vo ', '@x', '  '].map(D.passCase.toTagName), ['@an_vo', '@x', '']);
  });

  test('pass case: tag thêm / bỏ tick lưu theo team; Ticket mới bỏ người thêm tay, giữ ô tick người chính; tên thêm tay vào gợi ý của team đó', () => {
    const { storage, repository, store, service, tagHistory } = setup({ nav: { group: 'ticket', ticketType: 'transfer' } });
    service.setTeam('cs');
    assertEqual([service.addTag(' minh '), service.addTag('  '), service.addTag('@an')], [true, false, true]);
    assertEqual([tagHistory.forTeam('cs').list(), tagHistory.forTeam('mkt').list(), storage.data[context.app.tagKey]], [['@an', '@minh'], [], { cs: ['@an', '@minh'] }]);
    service.setTagOn('@ThuTranCS', false);
    service.setValue('shop', 'ARIA');
    service.reset();
    repository.save(store.get());
    const reloaded = setup(storage.data[context.app.storageKey]).session.passCase();
    assertEqual([reloaded.values.shop, reloaded.tags.cs, reloaded.tags.mkt], ['', { off: ['@ThuTranCS'], extra: [] }, { off: [], extra: [] }]);
    service.setTeam('cs');
    service.addTag('@minh');
    service.removeTag('@minh');
    service.setTagOn('@ThuTranCS', true);
    assertEqual([store.get().passCase.tags.cs, tagHistory.forTeam('cs').list()], [{ off: [], extra: [] }, ['@minh', '@an']]);
  });

  test('pass case: gợi ý tag bản .14 (1 danh sách chung) => mỗi team nhận 1 bản; ghi 1 team không mất team khác; dữ liệu hỏng => rỗng', () => {
    const fake = (saved) => { const data = { [context.app.tagKey]: saved }; return { data, read: (key) => data[key], write: (key, value) => { data[key] = JSON.parse(JSON.stringify(value)); return true; } }; };
    const storage = fake(['@a', '@b']);
    const history = A.tagHistoryService.createTagHistoryService({ context, storage });
    history.forTeam('tech').forget('@a');
    history.forTeam('tech').remember('c');
    const reloaded = A.tagHistoryService.createTagHistoryService({ context, storage });
    assertEqual(['sales', 'mkt', 'cs', 'tech'].map(id => reloaded.forTeam(id).list()), [['@a', '@b'], ['@a', '@b'], ['@a', '@b'], ['@c', '@b']]);
    assertEqual(A.tagHistoryService.createTagHistoryService({ context, storage: fake('x') }).forTeam('cs').list(), []);
  });

  test('pass case: CBN / LEAD ghép phần nào có thì in phần đó', () => {
    assertEqual(build('sales', { shop: 'A', mid: '9', role: 'Staff' }), 'LEAD: A – 9\nCBN: Staff' + SALES_END);
    assertEqual(build('sales', { phone: '(555) 123-4567', contact: 'Ms Lan' }), 'CBN: (555) 123-4567 – Ms Lan' + SALES_END);
  });

  test('pass case: chưa nhập trường nào của team => rỗng; trường bắt buộc còn thiếu theo thứ tự form', () => {
    assertEqual([build('sales', {}), build('sales', { issue: 'ABC' })], ['', '']);
    assertEqual(missing('sales', { shop: 'A' }), ['ZIP Code', 'CBN']);
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
    const tagHistory = A.tagHistoryService.createTagHistoryService({ context, storage });
    const service = A.passCaseService.createPassCaseService({ context, store, images, tagHistory });
    return { storage, repository, store, session, images, output, tagHistory, service };
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

  test('pass case: Tech tick Assign => `Tên tiệm / MID (link ticket)`, Issue, `Thank you @tech` (chỉ tech tự thêm, không tag theo ca, không CBN)', () => {
    const ticket = 'https://portal/v2/helpdesk/ticket/351948?bucket=1&rank=20#';
    const values = { ...VALUES, ticket, shop: 'TEST NAILS BAR', mid: '123456789012', issue: 'Phase 1' };
    const tags = { techAssign: { off: [], extra: ['@ryan-ts'] } };
    assertEqual(buildAt(vn(21), 'tech', values, { assign: true, tags }),
      `TEST NAILS BAR / 123456789012 (${ticket})\nPhase 1\n(555) 123-4567\nThank you @ryan-ts`);
    assertEqual(buildAt(vn(21), 'tech', { ...values, phone: '' }, { assign: true, tags }),
      `TEST NAILS BAR / 123456789012 (${ticket})\nPhase 1\nThank you @ryan-ts`);
    assertEqual(build('tech', { shop: 'A', phone: '1' }, { assign: true }), 'A\n1\nThank you');
    assertEqual(build('tech', { ...values, shop: '', mid: '', phone: '' }, { assign: true }), `${ticket}\nPhase 1\nThank you`);
    assertEqual(missing('tech', { shop: 'A' }, { assign: true }), ['Link Ticket', 'MID', 'Issue']);
    // Bỏ tick: mẫu Tech như cũ; team khác không có Assign thì tick không có tác dụng
    assertEqual(build('tech', VALUES, { assign: false }).startsWith('https://crm/lead/9\nARIA NAIL BAR\nCBN:'), true);
    assertEqual(build('sales', VALUES, { assign: true }), build('sales'));
    const assignTeam = D.passCase.findTeam(passCase('tech', VALUES, { assign: true }), config);
    assertEqual([assignTeam.id, assignTeam.tagId, assignTeam.urgent, D.passCaseMessage.passCaseTags({ passCase: passCase('tech', VALUES, { assign: true }), config, now: vn(21) })],
      ['tech', 'techAssign', '', []]);
  });

  test('pass case: bản HTML để copy: Assign nhúng link ticket vào MID (Telegram Desktop giữ link), escape chữ, <br>; tin không có link => rỗng', () => {
    const html = (team, values, extra) => D.passCaseMessage.buildPassCaseHtml({ passCase: passCase(team, values, extra), config, now: vn(21) });
    const tags = { techAssign: { off: [], extra: ['@ryan-ts'] } };
    const values = { ...VALUES, ticket: 'https://portal/ticket/1?a=1&b=2#', shop: 'A & B <NAILS>', mid: '4223', issue: 'Phase 1\n"x"' };
    assertEqual(html('tech', values, { assign: true, tags }),
      'A &amp; B &lt;NAILS&gt; / <a href="https://portal/ticket/1?a=1&amp;b=2#">4223</a><br>Phase 1<br>&quot;x&quot;<br>(555) 123-4567<br>Thank you @ryan-ts');
    assertEqual(html('tech', { ...values, mid: '' }, { assign: true }).startsWith('<a href="https://portal/ticket/1?a=1&amp;b=2#">A &amp; B &lt;NAILS&gt;</a><br>'), true);
    assertEqual([html('tech', { ...values, ticket: '' }, { assign: true }), html('cs', values), html('tech', values)], ['', '', '']);
    const { output, service } = setup({ nav: { group: 'ticket', ticketType: 'transfer' }, passCase: { team: 'tech', assign: true, values } });
    assertEqual([output.compute().body.startsWith('A & B <NAILS> / 4223 (https://portal/ticket/1?a=1&b=2#)\nPhase 1\n"x"'), output.compute().bodyHtml.includes('<a href=')], [true, true]);
    service.setAssign(false);
    assertEqual(output.compute().bodyHtml, '');
  });

  test('pass case: Assign có nhóm tag + gợi ý riêng (không lẫn người support thêm của Tech); state cũ chưa có assign => không tick', () => {
    const { store, session, service, tagHistory } = setup({ nav: { group: 'ticket', ticketType: 'transfer' }, passCase: { team: 'tech', values: {} } });
    assertEqual([session.passCase().assign, session.passCase().tags.techAssign], [false, { off: [], extra: [] }]);
    service.addTag('support');
    service.setAssign(true);
    service.addTag('ryan-ts');
    const tags = store.get().passCase.tags;
    assertEqual([tags.tech.extra, tags.techAssign.extra, tagHistory.forTeam('tech').list(), tagHistory.forTeam('techAssign').list()],
      [['@support'], ['@ryan-ts'], ['@support'], ['@ryan-ts']]);
    service.setTeam('cs');
    service.setTeam('tech');
    assertEqual(store.get().passCase.assign, true);
    service.reset();
    assertEqual([store.get().passCase.assign, store.get().passCase.tags.techAssign.extra], [false, []]);
  });

  test('thông tin tiệm: chỉ giữ chuỗi đã trim (Link Ticket / Lead, Tên tiệm, MID, ZIP, nội dung), cắt chuỗi quá dài (nội dung 3000); dữ liệu hỏng => null', () => {
    const { sanitizeShopInfo } = D.shopInfo;
    assertEqual(sanitizeShopInfo({ app: 'x', lead: ' https://portal/lead/1 ', shop: ' TEST NAILS ', mid: '123', zip: 75001, phone: '1' }),
      { lead: 'https://portal/lead/1', shop: 'TEST NAILS', mid: '123' });
    assertEqual([sanitizeShopInfo(null), sanitizeShopInfo('abc'), sanitizeShopInfo({ shop: '  ' })], [null, null, null]);
    assertEqual(sanitizeShopInfo({ shop: 'A'.repeat(500) }).shop.length, 300);
    assertEqual([sanitizeShopInfo({ issue: ' PAX - SUCCESS\nFIRST ' }).issue, sanitizeShopInfo({ issue: 'x'.repeat(5000) }).issue.length], ['PAX - SUCCESS\nFIRST', 3000]);
  });

  test('pass case: Dán thông tin tiệm ghi đè trường lấy được, giữ trường khác; không có gì => không đổi', () => {
    const { store, service } = setup({ nav: { group: 'ticket', ticketType: 'transfer' } });
    service.setValue('shop', 'CŨ');
    service.setValue('zip', '11111');
    service.setValue('phone', '(555) 123-4567');
    const filled = service.fillShopInfo({ app: 'x', lead: 'https://portal/lead/9', shop: 'TEST NAILS', mid: '8800123', zip: '' });
    const values = store.get().passCase.values;
    assertEqual([filled, values.lead, values.shop, values.mid, values.zip, values.phone],
      [['lead', 'shop', 'mid'], 'https://portal/lead/9', 'TEST NAILS', '8800123', '11111', '(555) 123-4567']);
    assertEqual([service.fillShopInfo(null), store.get().passCase.values.shop], [[], 'TEST NAILS']);
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
