// src/domain/shipping.js — Dữ liệu form SMS Shipping: tạo mới, làm sạch dữ liệu đọc từ storage.
(function (TW) {
  'use strict';

  const FIELDS = ['merchant', 'tracking'];   // thứ tự trên form

  const createEmptyShipping = () => ({ merchant: '', tracking: '' });

  function sanitizeShipping(raw) {
    const shipping = createEmptyShipping();
    if (!raw || typeof raw !== 'object') return shipping;
    FIELDS.forEach(field => { if (typeof raw[field] === 'string') shipping[field] = raw[field]; });
    return shipping;
  }

  TW.domain.shipping = { FIELDS, createEmptyShipping, sanitizeShipping };
})(window.TW);
