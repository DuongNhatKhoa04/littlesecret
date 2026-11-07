// src/domain/sms.js — Dữ liệu form SMS Promotion: tạo mới, làm sạch dữ liệu đọc từ storage; mẫu câu có chỗ {tên}.
(function (TW) {
  'use strict';

  const TEXT_FIELDS = ['shop', 'recipients', 'message'];
  const IMAGE_KEY = 'sms:customerTypes';   // chỗ dán ảnh của Type Customer (ảnh chỉ giữ trong bộ nhớ)
  const PLACEHOLDER = /\{(\w+)\}/g;

  /** "Last Visit <= {days}" → [{ text: 'Last Visit <= ' }, { param: 'days' }] */
  const splitTemplate = (template) => template.split(/\{(\w+)\}/)
    .map((part, i) => (i % 2 ? { param: part } : { text: part }))
    .filter(part => part.param || part.text);

  const fillTemplate = (template, values) => template.replace(PLACEHOLDER, (_, name) => values[name] || '');

  function createCustomerTypes(config) {
    const types = {};
    config.customerTypes.forEach(type => { types[type.id] = { on: false, values: { ...type.values } }; });
    return types;
  }

  function createEmptySms(config) {
    return {
      enabled: false,   // ô tick mở khối SMS trong ticket
      lang: config.languages[0].id, shop: '', recipients: '', message: '', price: config.prices[0],
      customerTypes: createCustomerTypes(config), customOptions: []
    };
  }

  /** Chỉ giữ Type Customer còn trong config; số nào thiếu/sai kiểu thì lấy số mặc định. */
  function sanitizeCustomerTypes(raw, config) {
    const types = createCustomerTypes(config);
    if (!raw || typeof raw !== 'object') return types;
    Object.keys(types).forEach(id => {
      const saved = raw[id];
      if (!saved || typeof saved !== 'object') return;
      types[id].on = saved.on === true;
      const savedValues = saved.values && typeof saved.values === 'object' ? saved.values : {};
      Object.keys(types[id].values).forEach(name => {
        if (typeof savedValues[name] === 'string') types[id].values[name] = savedValues[name];
      });
    });
    return types;
  }

  function sanitizeSms(raw, config) {
    const sms = createEmptySms(config);
    if (!raw || typeof raw !== 'object') return sms;
    sms.enabled = raw.enabled === true;
    TEXT_FIELDS.forEach(field => { if (typeof raw[field] === 'string') sms[field] = raw[field]; });
    if (config.prices.includes(raw.price)) sms.price = raw.price;
    if (config.languages.some(language => language.id === raw.lang)) sms.lang = raw.lang;
    sms.customerTypes = sanitizeCustomerTypes(raw.customerTypes, config);
    if (Array.isArray(raw.customOptions)) sms.customOptions = raw.customOptions.filter(option => typeof option === 'string');
    return sms;
  }

  TW.domain.sms = { IMAGE_KEY, splitTemplate, fillTemplate, createEmptySms, sanitizeSms };
})(window.TW);
