// src/infrastructure/phone-inbox.js — PhoneInbox: lấy từng ảnh iPhone gửi lên phone-upload (chạy cùng máy). Lỗi mạng => ok: false, không throw.
(function (TW) {
  'use strict';

  const NO_CONTENT = 204;   // hàng chờ trống
  const FALLBACK_NAME = 'iphone.png';

  function decodeName(header) {
    try { return header ? decodeURIComponent(header) : FALLBACK_NAME; } catch (error) { return FALLBACK_NAME; }
  }

  /** Link iPad + giờ hết hạn mã iPad. ok: false = không gọi được phone-upload */
  async function readIpadLink(url, method) {
    try {
      const response = await fetch(url, { method, cache: 'no-store' });
      if (!response.ok) return { ok: false, urls: [], expiresAt: '' };
      const { urls, expiresAt } = await response.json();
      return { ok: true, urls: Array.isArray(urls) ? urls : [], expiresAt: String(expiresAt || '') };
    } catch (error) { return { ok: false, urls: [], expiresAt: '' }; }
  }

  /** @returns {PhoneInbox} */
  function createPhoneInbox() {
    return {
      info: (url) => readIpadLink(url, 'GET'),
      rotate: (url) => readIpadLink(url, 'POST'),
      async next(url) {
        try {
          const response = await fetch(url, { cache: 'no-store' });
          if (response.status === NO_CONTENT) return { ok: true, file: null };
          if (!response.ok) return { ok: false, file: null };   // 404 = sai mã / không phải phone-upload
          const blob = await response.blob();
          return { ok: true, file: new File([blob], decodeName(response.headers.get('X-File-Name')), { type: blob.type }) };
        } catch (error) { return { ok: false, file: null }; }   // phone-upload chưa chạy / đã tắt
      }
    };
  }

  TW.infra.phoneInbox = { createPhoneInbox };
})(window.TW);
