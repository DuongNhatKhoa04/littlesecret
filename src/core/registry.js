// src/core/registry.js — Nơi các file config/ đăng ký nội dung; engine đọc lại từ đây.
(function (TW) {
  'use strict';

  const NOTE = Object.freeze({ key: 's6', label: 'Note', ph: 'Ghi chú thêm (tùy chọn)…', note: true });

  const types = new Map();        // key -> định nghĩa loại, giữ thứ tự đăng ký (= thứ tự hiện)
  const formerKeys = new Map();   // key loại cũ đã gộp -> key loại hiện tại; state/template cũ vẫn lưu key cũ
  const itemOwners = new Map();   // id mục checklist -> key loại; tick/N/A lưu theo id nên id phải duy nhất
  let appConfig = null;
  let catalogConfig = null;
  let smsConfig = null;
  let shippingConfig = null;
  let reviewConfig = null;
  let notificationConfig = null;

  function claimItemIds(key, checklist) {
    checklist.groups.forEach(group => group.items.forEach(item => {
      if (itemOwners.has(item.id)) {
        throw new Error(`id mục checklist "${item.id}" bị trùng giữa "${itemOwners.get(item.id)}" và "${key}"`);
      }
      itemOwners.set(item.id, key);
    }));
  }

  function addType(group, key, definition) {
    if (types.has(key) || formerKeys.has(key)) throw new Error(`Loại ticket "${key}" bị khai báo 2 lần`);
    if (definition.checklist) claimItemIds(key, definition.checklist);
    (definition.formerKeys || []).forEach(former => formerKeys.set(former, key));
    types.set(key, Object.freeze({ ...definition, key, group }));
  }

  TW.registry = {
    NOTE,
    setApp(config) { appConfig = config; },
    setCatalog(config) { catalogConfig = config; },
    setSms(config) { smsConfig = config; },
    setShipping(config) { shippingConfig = config; },
    setReview(config) { reviewConfig = config; },
    setNotifications(config) { notificationConfig = config; },
    addTicket(key, definition) { addType('ticket', key, definition); },
    addSetup(key, definition) { addType('setup', key, definition); },
    app: () => appConfig,
    catalog: () => catalogConfig,
    sms: () => smsConfig,
    shipping: () => shippingConfig,
    review: () => reviewConfig,
    notifications: () => notificationConfig,
    type: (key) => types.get(key) || types.get(formerKeys.get(key)) || null,
    types: (group) => [...types.values()].filter(type => !group || type.group === group)
  };
})(window.TW);
