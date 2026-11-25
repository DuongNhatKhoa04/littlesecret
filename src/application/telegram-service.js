// src/application/telegram-service.js — Chuyển case: gửi tin vào group của team đang chọn bằng bot Telegram (cả team dùng chung 1 bot).
// Token lưu riêng trên từng máy (không nằm trong code / file gửi đi / file Sao lưu); chỉ gửi vào group khai báo trong config.
(function (TW) {
  'use strict';

  const { findTeam, passCaseImageSlots } = TW.domain.passCase;
  const { isBotToken, buildTelegramText, sendProblem, describeSendError } = TW.domain.telegramMessage;
  const { asString } = TW.domain.text;

  /**
   * @param {{ context: object, session: object, storage: KeyValueStore, staffService: object, images: object, outputService: object, bot: MessageBot }} deps
   *   staffService: tên nhân viên đã lưu => dòng người chuyển (FRT: <tên>)
   */
  function createTelegramService({ context, session, storage, staffService, images, outputService, bot }) {
    const config = context.app.telegram;
    const tokenKey = context.app.telegramTokenKey;
    let token = asString(storage.read(tokenKey)).trim();
    let sending = false;

    const team = () => findTeam(session.passCase(), context.passCase);
    const photos = () => passCaseImageSlots(session.passCase(), context.passCase)
      .flatMap(slot => images.list(slot.key)).map(image => image.blob).filter(Boolean);

    /** Bản xem trước: group, tin sẽ gửi, số ảnh, lý do chưa gửi được (rỗng = gửi được). */
    function draft() {
      const result = outputService.compute();
      const senderName = staffService.name();
      const { label, chatId = '' } = team();
      const problem = sendProblem({ canCopy: result.canCopyBody, chatId, hasToken: !!token, senderName, texts: config.texts });
      return { group: label, chatId, text: buildTelegramText({ message: result.body, senderName, config }), photoCount: photos().length, problem };
    }

    async function deliver(target) {
      const sent = await bot.sendText({ token, chatId: target.chatId, text: target.text });
      if (!sent.ok) return { ok: false, error: describeSendError(sent.error, config.texts) };
      const list = photos();
      if (!list.length) return { ok: true };
      const withPhotos = await bot.sendPhotos({ token, chatId: target.chatId, photos: list, messageId: sent.messageId });
      return withPhotos.ok ? { ok: true } : { ok: false, textSent: true, error: describeSendError(withPhotos.error, config.texts) };
    }

    return {
      hasToken: () => !!token,
      /** Sai dạng => false, không lưu (thường là dán thiếu / dư ký tự). */
      saveToken(text) {
        if (!isBotToken(text)) return false;
        token = String(text).trim();
        storage.write(tokenKey, token);
        return true;
      },
      clearToken() {
        token = '';
        storage.write(tokenKey, '');
      },
      draft,
      /** Đang gửi thì bấm lại không làm gì: tránh gửi 2 lần. textSent: chữ đã vào group nhưng ảnh lỗi (đừng gửi lại cả tin). */
      async send() {
        const target = draft();
        if (sending || target.problem) return { ok: false, error: target.problem };
        sending = true;
        try { return await deliver(target); } finally { sending = false; }
      }
    };
  }

  TW.application.telegramService = { createTelegramService };
})(window.TW);
