// src/application/notice-service.js — Cảnh báo đang hiện (khai báo ở config/notifications.js): bật khi có sự cố, tắt khi hết.
(function (TW) {
  'use strict';

  const PERCENT = 100;

  /**
   * @param {{ config: { nearlyFullRatio: number, items: Object<string, { level: string, message: string }> }, quota?: StorageQuota }} deps
   */
  function createNoticeService({ config, quota }) {
    const active = new Map();      // id -> chữ đang hiện
    const dismissed = new Set();   // id người dùng đã bấm ×, hiện lại khi sự cố hết rồi gặp lại
    const listeners = new Set();
    const notify = () => listeners.forEach(listener => listener());

    function definitionOf(id) {
      const definition = config.items[id];
      if (!definition) throw new Error(`Chưa khai báo cảnh báo "${id}" trong config/notifications.js`);
      return definition;
    }

    /** params: giá trị thay vào {tên} trong message */
    function toggle(id, isOn, params = {}) {
      const { message } = definitionOf(id);
      const text = isOn ? message.replace(/\{(\w+)\}/g, (match, name) => name in params ? params[name] : match) : null;
      if (active.get(id) === text || (!isOn && !active.has(id))) return;
      if (isOn) active.set(id, text); else { active.delete(id); dismissed.delete(id); }
      notify();
    }

    async function checkStorage() {
      const estimate = quota ? await quota.estimate() : null;
      if (!estimate || !estimate.quota) return;
      const ratio = estimate.usage / estimate.quota;
      toggle('storageNearlyFull', ratio >= config.nearlyFullRatio, { percent: Math.round(ratio * PERCENT) });
    }

    return {
      toggle,
      checkStorage,
      dismiss(id) { dismissed.add(id); notify(); },
      /** Cảnh báo cần hiện, theo thứ tự khai báo trong config */
      list: () => Object.keys(config.items)
        .filter(id => active.has(id) && !dismissed.has(id))
        .map(id => ({ id, level: config.items[id].level, text: active.get(id) })),
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
    };
  }

  TW.application.noticeService = { createNoticeService };
})(window.TW);
