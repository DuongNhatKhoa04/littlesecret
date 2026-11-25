// src/domain/telegram-message.js — Gửi Chuyển case qua bot Telegram: ghép tin (thêm dòng người chuyển), kiểm tra token / điều kiện gửi, đổi lỗi Telegram thành câu dễ hiểu.
(function (TW) {
  'use strict';

  const { fillTemplate } = TW.domain.sms;
  const { isBlank } = TW.domain.text;

  // Token bot: <id bot>:<chuỗi bí mật>. Chỉ kiểm dạng để bắt dán nhầm (thiếu ký tự, dính chữ "bot", khoảng trắng); đúng hay sai do Telegram trả lời.
  const BOT_TOKEN = /^\d{5,15}:[A-Za-z0-9_-]{30,60}$/;
  const HTTP_UNAUTHORIZED = 401;
  const HTTP_TOO_MANY = 429;

  /** @param {string} text @returns {boolean} */
  const isBotToken = (text) => BOT_TOKEN.test(String(text).trim());

  /**
   * Tin Chuyển case + dòng người chuyển ở cuối (cả team dùng chung 1 bot nên tin luôn hiện tên bot).
   * @param {{ message: string, senderName: string, config: { senderLine: string } }} input
   * @returns {string}
   */
  function buildTelegramText({ message, senderName, config }) {
    const name = senderName.trim();
    return name ? `${message}\n${fillTemplate(config.senderLine, { name })}` : message;
  }

  /**
   * Lý do chưa gửi được (theo thứ tự cần xử lý), rỗng = gửi được.
   * @param {{ canCopy: boolean, chatId: string, hasToken: boolean, senderName: string, texts: object }} input
   *   texts: câu báo trong config (notReady, noGroup, noToken, noName)
   * @returns {string}
   */
  function sendProblem({ canCopy, chatId, hasToken, senderName, texts }) {
    if (!canCopy) return texts.notReady;
    if (!chatId) return texts.noGroup;
    if (!hasToken) return texts.noToken;
    if (isBlank(senderName)) return texts.noName;
    return '';
  }

  /**
   * Lỗi Telegram trả về => câu cho người dùng. Không có mã (mạng lỗi) => câu mạng.
   * @param {{ status?: number, description?: string, retryAfter?: number }} error
   * @param {object} texts   config: network, badToken, noChat, tooMany, other
   * @returns {string}
   */
  function describeSendError(error, texts) {
    if (!error.status) return texts.network;
    if (error.status === HTTP_UNAUTHORIZED) return texts.badToken;
    if (error.status === HTTP_TOO_MANY) return fillTemplate(texts.tooMany, { seconds: String(error.retryAfter || '') });
    const detail = (error.description || '').toLowerCase();
    if (/chat not found|kicked|not a member|bot was blocked|have no rights/.test(detail)) return texts.noChat;
    return fillTemplate(texts.other, { detail: error.description || String(error.status) });
  }

  TW.domain.telegramMessage = { isBotToken, buildTelegramText, sendProblem, describeSendError };
})(window.TW);
