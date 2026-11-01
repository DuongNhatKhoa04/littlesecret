// src/domain/shipping.js — Dữ liệu form SMS Shipping: tạo mới, làm sạch dữ liệu đọc từ storage.
(function (TW) {
  'use strict';

  const FIELDS = ['merchant', 'tracking', 'delivery'];   // thứ tự trên form
  const DATE_FIELDS = ['delivery'];                       // lưu dạng YYYY-MM-DD (giá trị của ô chọn ngày)
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

  const createEmptyShipping = () => ({ merchant: '', tracking: '', delivery: '' });

  const isValidValue = (field, value) => typeof value === 'string' && (!DATE_FIELDS.includes(field) || value === '' || ISO_DATE.test(value));

  /** Bản trước chưa có delivery => để trống. */
  function sanitizeShipping(raw) {
    const shipping = createEmptyShipping();
    if (!raw || typeof raw !== 'object') return shipping;
    FIELDS.forEach(field => { if (isValidValue(field, raw[field])) shipping[field] = raw[field]; });
    return shipping;
  }

  TW.domain.shipping = { FIELDS, DATE_FIELDS, createEmptyShipping, sanitizeShipping };
})(window.TW);
