// src/domain/shop-info.js — Thông tin tiệm lấy từ trang ticket / Lead (bookmark "Lấy thông tin tiệm"): làm sạch trước khi điền form Chuyển case.
(function (TW) {
  'use strict';

  /** Trường lấy được = id trường Chuyển case cùng ý nghĩa (config/tickets/pass-case.js). */
  // Không có zip: FRT tự hỏi merchant (bookmark bản cũ có copy zip thì bỏ qua).
  const SHOP_INFO_FIELDS = ['ticket', 'lead', 'shop', 'mid', 'issue'];
  // Dữ liệu đến từ clipboard (không tin cậy): chặn chuỗi dài bất thường dán nhầm vào form. Nội dung ticket (issue) được dài hơn.
  const MAX_LENGTH = 300;
  const MAX_LENGTH_BY_FIELD = { issue: 3000 };

  /**
   * Chỉ giữ chuỗi đã trim, cắt bớt nếu quá dài. Không phải object hoặc không có trường nào => null.
   * @param {any} raw
   * @returns {Partial<Record<'ticket'|'lead'|'shop'|'mid'|'issue', string>> | null}
   */
  function sanitizeShopInfo(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const info = {};
    SHOP_INFO_FIELDS.forEach(id => {
      const value = typeof raw[id] === 'string' ? raw[id].trim().slice(0, MAX_LENGTH_BY_FIELD[id] || MAX_LENGTH) : '';
      if (value) info[id] = value;
    });
    return Object.keys(info).length ? info : null;
  }

  TW.domain.shopInfo = { sanitizeShopInfo, SHOP_INFO_FIELDS };
})(window.TW);
