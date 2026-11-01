// src/application/category-service.js — Danh sách Loại: có sẵn (config) + người dùng tự thêm (lưu trên máy).
(function (TW) {
  'use strict';

  const { cleanCategory } = TW.domain.text;

  /** @param {{ context: object, storage: KeyValueStore }} deps */
  function createCategoryService({ context, storage }) {
    const { app } = context;

    function load() {
      const list = storage.read(app.categoryKey);
      return Array.isArray(list) ? list.filter(x => typeof x === 'string' && x.trim()) : [];
    }

    let custom = load();
    const persist = () => storage.write(app.categoryKey, custom);
    const options = () => [...new Set([...app.categories, ...custom])];

    return {
      options,
      custom: () => custom.slice(),
      isBuiltIn: (value) => app.categories.includes(value),
      add(value) {
        if (options().includes(value)) return;
        custom = [...custom, value];
        persist();
      },
      remove(value) {
        custom = custom.filter(c => c !== value);
        persist();
      },
      /** Thêm Loại từ file nhập; trả về số Loại mới. */
      importMany(values) {
        const fresh = [...new Set(values.map(v => typeof v === 'string' ? cleanCategory(v) : '').filter(Boolean))]
          .filter(v => !options().includes(v));
        if (fresh.length) { custom = [...custom, ...fresh]; persist(); }
        return fresh.length;
      }
    };
  }

  TW.application.categoryService = { createCategoryService };
})(window.TW);
