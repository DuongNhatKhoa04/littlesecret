// src/infrastructure/telegram-bot.js — Gửi tin / ảnh vào group qua Telegram Bot API. Chỗ DUY NHẤT trong app gọi ra Internet (docs/SECURITY.md §6).
// Chỉ gọi sendMessage / sendPhoto / sendMediaGroup: bot không đọc tin, không quản lý group.
(function (TW) {
  'use strict';

  const MAX_PHOTOS_PER_GROUP = 10;   // giới hạn của sendMediaGroup

  /**
   * Gửi kiểu form (FormData) => request "đơn giản", trình duyệt không hỏi CORS trước (file:// có origin null).
   * Không cookie, không referrer, không cache: request chỉ mang đúng nội dung tin.
   * @returns {Promise<{ ok: true, result: any } | { ok: false, error: { status?: number, description?: string, retryAfter?: number } }>}
   */
  async function call({ apiBase, token, method, form }) {
    let response;
    try {
      response = await fetch(`${apiBase}/bot${token}/${method}`, { method: 'POST', body: form, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' });
    } catch (error) {
      return { ok: false, error: {} };   // mạng / proxy chặn: không có mã lỗi
    }
    let data = null;
    try { data = await response.json(); } catch (error) { data = null; }
    if (data && data.ok) return { ok: true, result: data.result };
    const retryAfter = data && data.parameters ? data.parameters.retry_after : undefined;
    return { ok: false, error: { status: response.status, description: data ? data.description : '', retryAfter } };
  }

  const formOf = (fields) => {
    const form = new FormData();
    Object.entries(fields).forEach(([name, value]) => form.append(name, value));
    return form;
  };

  /** Ảnh trả lời ngay dưới tin chữ để đi liền nhau trong group. */
  const replyTo = (messageId) => JSON.stringify({ message_id: messageId, allow_sending_without_reply: true });

  function photoForm({ chatId, photos, messageId }) {
    if (photos.length === 1) return { method: 'sendPhoto', form: formOf({ chat_id: chatId, photo: photos[0], reply_parameters: replyTo(messageId) }) };
    const form = formOf({ chat_id: chatId, reply_parameters: replyTo(messageId) });
    const media = photos.map((photo, index) => {
      form.append(`p${index}`, photo, `issue-${index + 1}.png`);
      return { type: 'photo', media: `attach://p${index}` };
    });
    form.append('media', JSON.stringify(media));
    return { method: 'sendMediaGroup', form };
  }

  /** @param {{ apiBase: string }} config @returns {MessageBot} */
  function createTelegramBot({ apiBase }) {
    return {
      /** Chữ thường (không parse_mode): nội dung nhập vào không thành link / định dạng lạ. */
      async sendText({ token, chatId, text }) {
        const sent = await call({ apiBase, token, method: 'sendMessage', form: formOf({ chat_id: chatId, text }) });
        return sent.ok ? { ok: true, messageId: sent.result.message_id } : sent;
      },
      async sendPhotos({ token, chatId, photos, messageId }) {
        for (let start = 0; start < photos.length; start += MAX_PHOTOS_PER_GROUP) {
          const { method, form } = photoForm({ chatId, photos: photos.slice(start, start + MAX_PHOTOS_PER_GROUP), messageId });
          const sent = await call({ apiBase, token, method, form });
          if (!sent.ok) return sent;
        }
        return { ok: true };
      }
    };
  }

  TW.infra.telegramBot = { createTelegramBot };
})(window.TW);
