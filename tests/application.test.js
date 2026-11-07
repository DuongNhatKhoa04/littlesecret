// tests/application.test.js — Đọc state bản cũ, lưu state, các thao tác sửa ticket (dùng storage giả).
(function (TW) {
  'use strict';

  const { test, assertEqual } = TW.tests;
  const A = TW.application;
  const context = A.context.createContext(TW.registry);

  const withGroups = (groups) => ({ ...context, app: { ...context.app, groups } });
  const allGroupsVisible = withGroups(context.app.groups.map(({ hidden, ...group }) => group));

  function fakeStorage(initial) {
    const data = { ...initial };
    return { data, read: (key) => key in data ? JSON.parse(JSON.stringify(data[key])) : null, write: (key, value) => { data[key] = value; return true; } };
  }

  function setup(saved, ctx = context) {
    const storage = fakeStorage(saved ? { [context.app.storageKey]: saved } : {});
    const repository = A.sessionRepository.createSessionRepository({ storage, context: ctx });
    const store = A.store.createStore(repository.load());
    const session = A.session.createSession({ context, store });
    return { storage, repository, store, session, ticket: A.ticketService.createTicketService({ context, store }) };
  }

  test('đọc state bản 1 file (chỉ có type) => đúng nhánh setup', () => {
    const { session, store } = setup({ type: 'setupPax', mode: 'output', swap: true, ticket: { phone: '1', chk: { 'pax-mid': { done: true } } } });
    assertEqual([session.activeTypeKey(), store.get().mode, store.get().swap, session.ticket().phone, session.ticket().chk['pax-mid'].done],
      ['setupPax', 'output', true, '1', true]);
  });

  test('đọc state rất cũ (data[type])', () => {
    const { session } = setup({ type: 'request', data: { request: { summary: 'cũ' } } });
    assertEqual([session.activeTypeKey(), session.ticket().summary], ['incident', 'cũ']);   // request đã gộp vào incident
  });

  test('template cũ Xử lý yêu cầu + Workaround => mở bằng Hỗ trợ merchant, Kết luận về mặc định Resolved, giữ nội dung', () => {
    const { storage, store, session } = setup(null);
    storage.data[context.app.templateKey] = [{ name: 'ABC - ĐỔI GIÁ', type: 'request', ticket: {
      category: 'ABC', summary: 'Đổi giá', conclusion: 'Workaround applied', blocks: { s1: ['Đổi giá'], s2: ['Đã đổi'] } } }];
    const categories = A.categoryService.createCategoryService({ context, storage });
    const templates = A.templateService.createTemplateService({ context, store, session, storage, files: {}, categories });
    const [found] = templates.search('');
    assertEqual([templates.typeLabel(found), templates.conclusionLabel(found)], ['Hỗ trợ merchant', 'Resolved']);
    templates.apply(found);
    assertEqual([templates.count(), session.activeTypeKey(), session.ticket().conclusion, session.ticket().blocks.s2],
      [1, 'incident', 'Resolved', ['Đã đổi']]);
  });

  test('state hỏng => mặc định', () => {
    const { session, store } = setup('rác');
    assertEqual([session.activeTypeKey(), store.get().mode], ['incident', 'split']);
  });

  test('state đang ở nhóm bị ẩn => mở nhóm mặc định, giữ ticket', () => {
    const groups = [{ id: 'ticket', label: 'T' }, { id: 'setup', label: 'S', hidden: true }];
    const { session, store } = setup({ nav: { group: 'setup' }, ticket: { phone: '1' } }, withGroups(groups));
    assertEqual([store.get().nav.group, session.ticket().phone], ['ticket', '1']);
  });

  test('lưu kèm key loại đang mở để bản cũ vẫn đọc được', () => {
    const { storage, repository, store } = setup(null);
    A.navigationService.createNavigationService({ context, store }).selectGroup('setup');
    repository.save(store.get());
    assertEqual(storage.data[context.app.storageKey].type, 'newDb');
  });

  test('thao tác ý: chèn, xóa, đổi chỗ, nút × khi còn 1 ý', () => {
    const { ticket, session } = setup(null);
    ticket.setIdea('s1', 0, 'a');
    ticket.insertIdea('s1', 1);
    ticket.setIdea('s1', 1, 'b');
    ticket.moveIdea('s1', 1, 0);
    assertEqual(session.ticket().blocks.s1, ['b', 'a']);
    ticket.moveIdea('s1', 1, 2);
    ticket.removeIdea('s1', 0);
    assertEqual(session.ticket().blocks.s1, ['a']);
    ticket.clearIdea('s1', 0);
    assertEqual(session.ticket().blocks.s1, ['']);
  });

  test('thêm ảnh vào mục checklist => tự tick, bỏ N/A', () => {
    const { ticket, session } = setup(null);
    ticket.setNa(['pax-mid'], true);
    ticket.markDoneByImage('pax-mid');
    assertEqual(session.ticket().chk['pax-mid'], { done: true, na: false });
  });

  test('output: nhánh chưa có checklist => rỗng, không copy được', () => {
    const { store, session } = setup({ nav: { group: 'setup', setupPath: { device: 'terminal', brand: 'clover', flow: 'replace' } } }, allGroupsVisible);
    const images = A.imageService.createImageService({ files: {}, onChecklistImage: () => {} });
    const output = A.outputService.createOutputService({ context, session, images }).compute();
    assertEqual([output.title, output.body, output.canCopyBody, store.get().nav.setupPath.model], ['', '', false, 'Clover Flex']);
  });

  test('tải tất cả ảnh: ZIP tên theo title, ảnh theo thứ tự nội dung', () => {
    const { ticket, session } = setup(null);
    ticket.setField('summary', 'mất kết nối');
    const blob = new Blob([], { type: 'image/png' });
    const images = { counts: () => ({ s1: 1, s2: 1 }), list: (key) => ['s1', 's2'].includes(key) ? [{ blob }] : [] };
    let saved = null;
    const files = { downloadZip: (fileName, entries) => { saved = { fileName, names: entries.map(e => e.name) }; return Promise.resolve(true); } };
    A.outputService.createOutputService({ context, session, images, files }).downloadImages();
    assertEqual(saved, { fileName: 'MAT KET NOI.zip', names: ['01 Van de.png', '02 Da support.png'] });
  });
})(window.TW);
