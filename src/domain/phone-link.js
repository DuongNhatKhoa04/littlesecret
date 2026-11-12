// src/domain/phone-link.js — Đọc link phone-upload (port + mã máy tính) và dựng địa chỉ Ticket Writer gọi phone-upload.
(function (TW) {
  'use strict';

  // Link mục 1 trong cửa sổ phone-upload: http://127.0.0.1:<port>/<mã máy tính>; mã do phone-upload.ps1 sinh (chữ thường + số)
  const LINK = /^https?:\/\/[^/\s:]+:(\d{1,5})\/([a-z0-9]{12})\/?$/i;
  const MAX_PORT = 65535;
  const LOCAL_HOST = '127.0.0.1';   // phone-upload chạy cùng máy: luôn hỏi qua localhost, IP LAN có thể đổi

  /**
   * @param {string} text
   * @returns {{ port: number, token: string } | null}   null = không phải link phone-upload
   */
  function parsePhoneLink(text) {
    const match = LINK.exec(String(text || '').trim());
    if (!match) return null;
    const port = Number(match[1]);
    return port >= 1 && port <= MAX_PORT ? { port, token: match[2].toLowerCase() } : null;
  }

  /**
   * @param {{ port: number, token: string }} link
   * @param {'next' | 'info' | 'rotate'} action   next: lấy 1 ảnh · info: link iPad + giờ hết hạn · rotate: đổi mã iPad ngay
   */
  const deskUrl = ({ port, token }, action) => `http://${LOCAL_HOST}:${port}/${token}/${action}`;

  TW.domain.phoneLink = { parsePhoneLink, deskUrl };
})(window.TW);
