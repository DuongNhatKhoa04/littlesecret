// src/application/palette-service.js — Màu giao diện (Tím, Hồng…). Lưu riêng trên máy, Ticket mới không đổi; độc lập với Sáng / Tối.
(function (TW) {
  'use strict';

  /** @param {{ context: object, storage: KeyValueStore }} deps */
  function createPaletteService({ context, storage }) {
    const { palettes, paletteKey } = context.app;
    const find = (id) => palettes.find(palette => palette.id === id);
    let current = find(storage.read(paletteKey)) || palettes[0];   // giá trị lạ / chưa chọn => mục đầu

    return {
      /** @returns {{ id: string, label: string }[]} */
      list: () => palettes,
      /** @returns {{ id: string, label: string }} */
      current: () => current,
      /** Màu mặc định (mục đầu) dùng thẳng tokens.css, không cần gắn data-palette. */
      isDefault: (palette) => palette === palettes[0],
      /** id lạ => giữ màu đang dùng. */
      select(id) {
        const palette = find(id);
        if (!palette) return current;
        current = palette;
        storage.write(paletteKey, id);
        return current;
      }
    };
  }

  TW.application.paletteService = { createPaletteService };
})(window.TW);
