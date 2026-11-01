// src/application/context.js — Gom cấu hình đã đăng ký thành 1 object chỉ đọc cho các service dùng chung.
(function (TW) {
  'use strict';

  const { collectBlockKeys } = TW.domain.ticket;

  function createContext(registry) {
    return Object.freeze({
      app: registry.app(),
      catalog: registry.catalog(),
      sms: registry.sms(),
      shipping: registry.shipping(),
      tickets: registry.types('ticket'),
      setups: registry.types('setup'),
      blockKeys: collectBlockKeys(registry.types()),
      typeOf: registry.type
    });
  }

  TW.application.context = { createContext };
})(window.TW);
