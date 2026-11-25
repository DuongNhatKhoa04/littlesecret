// tests/telegram.test.js — Gửi Chuyển case qua bot Telegram: kiểm token, ghép dòng FRT, điều kiện gửi, đổi lỗi thành câu, gửi chữ rồi ảnh, không gửi 2 lần, token không vào file Sao lưu.
(function (TW) {
  'use strict';

  const { test, assertEqual } = TW.tests;
  const D = TW.domain;
  const A = TW.application;
  const context = A.context.createContext(TW.registry);
  const tg = context.app.telegram;
  const TOKEN = '123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw';

  test('telegram: token đúng dạng <số>:<chuỗi>; dán nhầm (thêm "bot", thiếu, khoảng trắng giữa) => sai', () => {
    const { isBotToken } = D.telegramMessage;
    assertEqual([isBotToken(TOKEN), isBotToken(` ${TOKEN} `), isBotToken('bot' + TOKEN), isBotToken('123:abc'), isBotToken('123456789:AAH dqTcvCH1vGWJxfSeofSAs0K5PALDsaw'), isBotToken('')],
      [true, true, false, false, false, false]);
  });

  test('telegram: dòng FRT: <tên> cuối tin; chưa có tên => giữ nguyên tin', () => {
    const { buildTelegramText } = D.telegramMessage;
    assertEqual([buildTelegramText({ message: 'A\nB', senderName: ' Jade ', config: tg }), buildTelegramText({ message: 'A', senderName: '', config: tg })], ['A\nB\nFRT: Jade', 'A']);
  });

  test('telegram: lý do chưa gửi theo thứ tự (tin chưa đủ → chưa có group → chưa có token → chưa có tên); lỗi Telegram thành câu dễ hiểu', () => {
    const { sendProblem, describeSendError } = D.telegramMessage;
    const base = { canCopy: true, chatId: '-100', hasToken: true, senderName: 'Jade', texts: tg.texts };
    assertEqual([sendProblem(base), sendProblem({ ...base, canCopy: false, chatId: '' }), sendProblem({ ...base, chatId: '' }), sendProblem({ ...base, hasToken: false, senderName: '' }), sendProblem({ ...base, senderName: ' ' })],
      ['', tg.texts.notReady, tg.texts.noGroup, tg.texts.noToken, tg.texts.noName]);
    assertEqual([describeSendError({}, tg.texts), describeSendError({ status: 401 }, tg.texts), describeSendError({ status: 400, description: 'Bad Request: chat not found' }, tg.texts),
      describeSendError({ status: 403, description: 'Forbidden: bot was kicked from the supergroup chat' }, tg.texts), describeSendError({ status: 429, retryAfter: 7 }, tg.texts).includes('7 giây'),
      describeSendError({ status: 400, description: 'Bad Request: x' }, tg.texts)],
      [tg.texts.network, tg.texts.badToken, tg.texts.noChat, tg.texts.noChat, true, 'Telegram báo lỗi: Bad Request: x']);
  });

  /** Môi trường giả: storage, tên nhân viên, ảnh Issue, kết quả Chuyển case, bot ghi lại lệnh gọi. */
  function setup({ saved = {}, canCopy = true, team = 'mkt', photos = 0, replies = [] } = {}) {
    const data = { ...saved };
    const storage = { data, read: (key) => (key in data ? data[key] : null), write: (key, value) => { data[key] = value; return true; } };
    const staffService = A.staffService.createStaffService({ context, storage });
    const passCase = { ...D.passCase.createEmptyPassCase(context.passCase), team };
    const session = { passCase: () => passCase };
    const images = { list: (key) => (key === 'pass:issue' ? Array.from({ length: photos }, () => ({ blob: new Blob(['x'], { type: 'image/png' }) })) : []) };
    const outputService = { compute: () => ({ body: 'TIN', canCopyBody: canCopy }) };
    const calls = [];
    const answer = () => replies.shift() || { ok: true, messageId: 42 };
    const bot = {
      sendText: async (input) => { calls.push(['text', input]); return answer(); },
      sendPhotos: async (input) => { calls.push(['photos', input]); return answer(); }
    };
    const service = A.telegramService.createTelegramService({ context, session, storage, staffService, images, outputService, bot });
    return { service, storage, staffService, calls };
  }

  test('telegram: token sai dạng không lưu; đúng dạng lưu trên máy (key riêng); xóa token', () => {
    const { service, storage } = setup();
    assertEqual([service.hasToken(), service.saveToken('bot' + TOKEN), service.hasToken()], [false, false, false]);
    assertEqual([service.saveToken(` ${TOKEN} `), storage.data[context.app.telegramTokenKey], service.hasToken()], [true, TOKEN, true]);
    service.clearToken();
    assertEqual([service.hasToken(), storage.data[context.app.telegramTokenKey]], [false, '']);
    assertEqual([context.app.backupKeys.includes('telegramTokenKey'), setup({ saved: { [context.app.telegramTokenKey]: TOKEN } }).service.hasToken()], [false, true]);
  });

  test('telegram: xem trước = group của team + tin + FRT + số ảnh; thiếu điều kiện => không gọi bot', async () => {
    const { service, staffService, calls } = setup({ team: 'cs', photos: 2 });
    assertEqual(service.draft().problem, tg.texts.noToken);
    service.saveToken(TOKEN);
    assertEqual(service.draft().problem, tg.texts.noName);
    assertEqual((await service.send()).error, tg.texts.noName);
    staffService.setName('Zoe');
    const draft = service.draft();
    assertEqual([draft.group, draft.chatId, draft.text, draft.photoCount, draft.problem], ['CS', context.passCase.teams.find(team => team.id === 'cs').chatId, 'TIN\nFRT: Zoe', 2, '']);
    assertEqual([calls.length, setup({ canCopy: false }).service.draft().problem], [0, tg.texts.notReady]);
  });

  test('telegram: gửi chữ (đúng group, token) rồi ảnh trả lời ngay dưới tin; bấm 2 lần khi đang gửi => chỉ gửi 1 lần', async () => {
    const { service, staffService, calls } = setup({ team: 'tech', photos: 3 });
    service.saveToken(TOKEN);
    staffService.setName('Jennie');
    const [first, second] = await Promise.all([service.send(), service.send()]);
    const chatId = context.passCase.teams.find(team => team.id === 'tech').chatId;
    assertEqual([first.ok, second.ok, calls.map(([kind]) => kind)], [true, false, ['text', 'photos']]);
    assertEqual([calls[0][1], calls[1][1].messageId, calls[1][1].photos.length, calls[1][1].chatId], [{ token: TOKEN, chatId, text: 'TIN\nFRT: Jennie' }, 42, 3, chatId]);
  });

  test('telegram: chữ lỗi => báo lỗi, không gửi ảnh; chữ được nhưng ảnh lỗi => báo "tin chữ đã vào group"', async () => {
    const failText = setup({ photos: 1, replies: [{ ok: false, error: { status: 401 } }] });
    failText.service.saveToken(TOKEN);
    failText.staffService.setName('Jade');
    assertEqual([await failText.service.send(), failText.calls.length], [{ ok: false, error: tg.texts.badToken }, 1]);
    const failPhoto = setup({ photos: 1, replies: [{ ok: true, messageId: 5 }, { ok: false, error: {} }] });
    failPhoto.service.saveToken(TOKEN);
    failPhoto.staffService.setName('Jade');
    assertEqual(await failPhoto.service.send(), { ok: false, textSent: true, error: tg.texts.network });
  });
})(window.TW);
