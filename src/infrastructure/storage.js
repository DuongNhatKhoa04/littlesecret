// src/infrastructure/storage.js — KeyValueStore trên localStorage. localStorage có thể bị chặn/đầy => không bao giờ throw ra ngoài.
(function (TW) {
  'use strict';

  /** @returns {KeyValueStore} */
  function createLocalStorage() {
    return {
      read(key) {
        try { return JSON.parse(window.localStorage.getItem(key)); } catch (error) { return null; }
      },
      write(key, value) {
        try { window.localStorage.setItem(key, JSON.stringify(value)); return true; } catch (error) { return false; }
      }
    };
  }

  TW.infra.storage = { createLocalStorage };
})(window.TW);
