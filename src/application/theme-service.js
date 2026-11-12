// src/application/theme-service.js — Giao diện sáng / tối / tự động theo hệ điều hành. Lưu riêng trên máy, Ticket mới không đổi.
(function (TW) {
  'use strict';

  /** @param {{ context: object, storage: KeyValueStore }} deps */
  function createThemeService({ context, storage }) {
    const { themes, themeKey } = context.app;
    const ids = themes.map(theme => theme.id);
    const saved = storage.read(themeKey);
    let current = ids.includes(saved) ? saved : ids[0];   // giá trị lạ / chưa chọn => mục đầu (Tự động)

    return {
      /** @returns {{ id: string, label: string }} */
      current: () => themes[ids.indexOf(current)],
      /** Sang giao diện kế tiếp theo thứ tự trong config, hết thì quay lại đầu. */
      cycle() {
        current = ids[(ids.indexOf(current) + 1) % ids.length];
        storage.write(themeKey, current);
        return themes[ids.indexOf(current)];
      }
    };
  }

  TW.application.themeService = { createThemeService };
})(window.TW);
