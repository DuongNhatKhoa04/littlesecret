// tests/offline.test.js — Ticket offline: mã, tên file JSON / ZIP / PDF khớp nhau, đọc file, lưu ra file, mở file lại vào form.
(function (TW) {
  'use strict';

  const { test, assertEqual } = TW.tests;
  const O = TW.domain.offlineTicket;
  const A = TW.application;
  const context = A.context.createContext(TW.registry);
  const typeExists = (key) => !!context.typeOf(key);

  test('offline: mã theo giờ lưu, tên file chung chỉ ASCII, mã đứng đầu', () => {
    const id = O.createOfflineId(new Date(2026, 10, 10, 9, 5, 7));
    assertEqual(id, 'OFF-20261110-090507');
    assertEqual([O.offlineBaseName(id, 'CLOVER - MẤT KẾT NỐI'), O.offlineBaseName(id, '')],
      ['OFF-20261110-090507 - CLOVER - MAT KET NOI', 'OFF-20261110-090507']);
  });

  test('offline: đọc file — sai định dạng / loại không còn => null; trường chữ hỏng => rỗng', () => {
    const good = O.createOfflineFile({ id: 'OFF-1', savedAt: 1, type: 'incident', zipcode: '02134', ticketType: 'Hardware', tier: '2', title: 'T', body: 'B',
      ticket: { summary: 't' }, images: { zip: 'OFF-1 - T.zip', pdf: '' } });
    assertEqual(O.parseOfflineFile(JSON.parse(JSON.stringify(good)), typeExists),
      { id: 'OFF-1', type: 'incident', ticket: { summary: 't' }, zipcode: '02134', ticketType: 'Hardware', tier: '2', images: { zip: 'OFF-1 - T.zip', pdf: '' } });
    const broken = O.parseOfflineFile({ ...good, zipcode: 75001, tier: undefined, images: null }, typeExists);
    assertEqual([broken.zipcode, broken.tier], ['', '']);   // file trước khi có Tier vẫn mở được
    assertEqual([undefined, null, [], { templates: [] }, { ...good, format: 'khac' }, { ...good, type: 'khong-co' }, { ...good, id: '' }, { ...good, ticket: 'x' }]
      .map(data => O.parseOfflineFile(data, typeExists)), Array(8).fill(null));
  });

  function setup({ zipOk = true, pdfOk = true } = {}) {
    const storage = { read: () => null, write: () => true };
    const downloads = [];
    const files = {
      readAsDataUrl: async () => 'data:image/png;base64,',
      readJson: async (file) => { try { return JSON.parse(await file.text()); } catch (error) { return undefined; } },
      download: (fileName, text) => downloads.push({ fileName, text }),
      downloadZip: async (fileName, entries) => {
        if (!zipOk) return false;
        downloads.push({ fileName, entries: entries.map(e => e.name), json: await entries[0].blob.text() });
        return true;
      },
      createPdf: async (report) => pdfOk ? new Blob([`pdf ${report.entries.length}`]) : null
    };
    const repository = A.sessionRepository.createSessionRepository({ storage, context });
    const store = A.store.createStore(repository.load());
    const session = A.session.createSession({ context, store });
    const ticketService = A.ticketService.createTicketService({ context, store });
    const images = A.imageService.createImageService({ files, onChecklistImage: () => {} });
    const outputService = A.outputService.createOutputService({ context, session, images, files });
    const offline = A.offlineService.createOfflineService({ context, store, session, files, images, outputService });
    return { store, session, ticketService, images, downloads, offline };
  }

  const image = () => new File([new Uint8Array([1])], 'a.png', { type: 'image/png' });
  const jsonFile = (text) => new File([text], 'x.json', { type: 'application/json' });

  test('offline: ticket trống / thiếu zipcode, ticket type hoặc tier => không tải gì', async () => {
    const { offline, ticketService, downloads } = setup();
    assertEqual([offline.hasContent(), await offline.save({ zipcode: '75001', ticketType: 'Hardware', tier: '1', withPdf: false })], [false, null]);
    ticketService.setField('summary', 'mất kết nối');
    assertEqual([offline.hasContent(), await offline.save({ zipcode: ' ', ticketType: 'Hardware', tier: '1' }), await offline.save({ zipcode: '75001', ticketType: '', tier: '1' }),
      await offline.save({ zipcode: '75001', ticketType: 'Hardware', tier: '' })], [true, null, null, null]);
    assertEqual(downloads, []);
  });

  test('offline: không ảnh => chỉ tải 1 file JSON có zipcode, ticket type, tier, title, nội dung, ticket', async () => {
    const { offline, ticketService, downloads } = setup();
    ticketService.setField('summary', 'mất kết nối');
    ticketService.setField('phone', '0901');
    const result = await offline.save({ zipcode: ' 02134 ', ticketType: ' Hardware ', tier: '1.5', withPdf: true });
    assertEqual([downloads.length, result.imagesSaved, result.fileName === downloads[0].fileName, /^OFF-\d{8}-\d{6} - MAT KET NOI\.json$/.test(result.fileName)],
      [1, true, true, true], result.fileName);
    const file = JSON.parse(downloads[0].text);
    assertEqual([file.format, file.type, file.zipcode, file.ticketType, file.tier, file.title, file.body, file.images, file.ticket.phone],
      ['ticket-writer-offline', 'incident', '02134', 'Hardware', '1.5', 'MẤT KẾT NỐI', 'Phone: 0901', { zip: '', pdf: '' }, '0901']);
  });

  test('offline: có ảnh => chỉ tải 1 file ZIP chứa JSON + ảnh + PDF cùng tên (Chrome chặn tải file thứ 2)', async () => {
    const ok = setup();
    ok.ticketService.setField('summary', 'không in được');
    await ok.images.add('s1', [image(), image()]);
    const result = await ok.offline.save({ zipcode: '75001', ticketType: 'Printer', tier: '1', withPdf: true });
    const base = result.fileName.replace(/\.zip$/, '');
    assertEqual([ok.downloads.length, ok.downloads[0].fileName, result.imagesSaved], [1, `${base}.zip`, true]);
    assertEqual(ok.downloads[0].entries, [`${base}.json`, '01 Van de - anh 1.png', '02 Van de - anh 2.png', `${base}.pdf`]);   // ảnh đặt tên như Tải tất cả (ZIP)
    assertEqual(JSON.parse(ok.downloads[0].json).images, { zip: `${base}.zip`, pdf: `${base}.pdf` });

    const noPdf = setup();
    noPdf.ticketService.setField('summary', 'x');
    await noPdf.images.add('s1', [image()]);
    await noPdf.offline.save({ zipcode: '1', ticketType: 'A', tier: '1', withPdf: false });
    assertEqual([noPdf.downloads.length, noPdf.downloads[0].entries.length, JSON.parse(noPdf.downloads[0].json).images.pdf], [1, 2, '']);
  });

  test('offline: PDF lỗi => ZIP không có PDF, báo; ZIP lỗi => tải riêng JSON (vẫn giữ chữ), báo', async () => {
    const pdfFailed = setup({ pdfOk: false });
    pdfFailed.ticketService.setField('summary', 'x');
    await pdfFailed.images.add('s1', [image()]);
    const noPdf = await pdfFailed.offline.save({ zipcode: '1', ticketType: 'A', tier: '1', withPdf: true });
    assertEqual([noPdf.imagesSaved, pdfFailed.downloads[0].entries.length, JSON.parse(pdfFailed.downloads[0].json).images.pdf], [false, 2, '']);

    const zipFailed = setup({ zipOk: false });
    zipFailed.ticketService.setField('summary', 'x');
    await zipFailed.images.add('s1', [image()]);
    const onlyJson = await zipFailed.offline.save({ zipcode: '1', ticketType: 'A', tier: '1', withPdf: false });
    assertEqual([onlyJson.imagesSaved, zipFailed.downloads.length, onlyJson.fileName.endsWith('.json'), JSON.parse(zipFailed.downloads[0].text).images],
      [false, 1, true, { zip: '', pdf: '' }]);
  });

  test('offline: mở file JSON => về đúng loại, thay ticket đang nhập, bỏ ảnh đang dán; file sai => null, không đổi gì', async () => {
    const source = setup();
    source.ticketService.setField('summary', 'cũ');
    source.ticketService.setField('phone', '0901');
    await source.offline.save({ zipcode: '75001', ticketType: 'Hardware', tier: '1', withPdf: false });
    const saved = source.downloads[0].text;

    const { offline, ticketService, session, store, images } = setup();
    A.navigationService.createNavigationService({ context, store }).selectGroup('sms');
    ticketService.setField('summary', 'đang nhập');
    await images.add('s1', [image()]);
    assertEqual([offline.needsConfirmToOpen(), await offline.openFile(jsonFile('không phải json')), session.ticket().summary], [true, null, 'đang nhập']);
    const record = await offline.openFile(jsonFile(saved));
    assertEqual([record.zipcode, record.ticketType, record.tier], ['75001', 'Hardware', '1']);
    assertEqual([session.activeTypeKey(), session.ticket().summary, session.ticket().phone, images.counts().s1 || 0], ['incident', 'cũ', '0901', 0]);
  });

  test('offline: nhóm SMS không lưu được', () => {
    const { offline, store } = setup();
    A.navigationService.createNavigationService({ context, store }).selectGroup('sms');
    assertEqual(offline.canSave(), false);
  });

  test('offline: Chuyển case không lưu, không mở file được (tin nhắn group, không phải ticket)', async () => {
    const { offline, store, downloads } = setup();
    A.navigationService.createNavigationService({ context, store }).selectTicketType('transfer');
    store.update(state => { state.passCase.values.shop = 'ARIA'; });
    assertEqual([offline.canSave(), await offline.save({ zipcode: '1', ticketType: 'A', tier: '1', withPdf: false }), downloads], [false, null, []]);
    const file = new File([JSON.stringify({ format: 'ticket-writer-offline', id: 'OFF-1', type: 'incident', ticket: {} })], 'a.json', { type: 'application/json' });
    assertEqual([offline.canOpen(), await offline.openFile(file), store.get().passCase.values.shop], [false, null, 'ARIA']);
  });
})(window.TW);
