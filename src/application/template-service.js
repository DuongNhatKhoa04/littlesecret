// src/application/template-service.js — Lưu / tìm / dùng / xuất / nhập template.
(function (TW) {
  'use strict';

  const { buildTitle } = TW.domain.title;
  const { hasAnyContent } = TW.domain.ticket;
  const { navigationForType } = TW.domain.navigation;
  const T = TW.domain.template;
  const EXPORT_FILE_NAME = 'ticket-templates.json';

  /** @param {{ context: object, store: object, session: object, storage: KeyValueStore, files: FileAdapter, categories: object }} deps */
  function createTemplateService({ context, store, session, storage, files, categories }) {
    const { app, blockKeys, catalog, typeOf } = context;
    const typeExists = (key) => !!typeOf(key);

    function load() {
      const list = storage.read(app.templateKey);
      return Array.isArray(list) ? list.filter(t => T.isValidTemplate(t, typeExists)) : [];
    }

    let templates = load();
    const persist = () => storage.write(app.templateKey, templates);

    /** Template từ ticket hiện tại, tên = title. null khi chưa có title hoặc chưa chọn loại. */
    function draft() {
      const ticket = session.ticket();
      const name = buildTitle(ticket).trim();
      const typeKey = session.activeTypeKey();
      if (!name || !typeKey) return null;
      return T.createTemplate({ name, typeKey, ticket, blockKeys, now: Date.now() });
    }

    function apply(template) {
      store.update(state => {
        state.ticket = T.applyTemplate(state.ticket, template, { app, blockKeys });
        state.nav = navigationForType(typeOf(template.type), state.nav, catalog);
      }, { rebuild: true });
    }

    /** data = nội dung file JSON đã parse. Trả null nếu file không đúng dạng. */
    function importData(data) {
      const incoming = Array.isArray(data) ? data : (data && Array.isArray(data.templates) ? data.templates : null);
      if (!incoming) return null;
      const result = T.mergeTemplates(templates, incoming, typeExists);
      templates = result.list;
      persist();
      const newCategories = !Array.isArray(data) && Array.isArray(data.categories) ? categories.importMany(data.categories) : 0;
      return { added: result.added, replaced: result.replaced, skipped: result.skipped, newCategories };
    }

    return {
      count: () => templates.length,
      /** Nhánh setup chưa có checklist / SMS Promotion: không có loại ticket để lưu. */
      canSave: () => !!session.activeTypeKey(),
      search: (query) => T.searchTemplates(templates, query),
      draft,
      exists: (name) => templates.some(t => t.name === name),
      save(template) { templates = T.upsertTemplate(templates, template); return persist(); },
      remove(template) { templates = templates.filter(t => t !== template); return persist(); },
      needsConfirmToApply: () => hasAnyContent(session.ticket(), blockKeys),
      apply,
      typeLabel: (template) => typeOf(template.type).label,
      conclusionLabel: (template) => T.templateConclusion(template, app),
      exportFile() {
        files.download(EXPORT_FILE_NAME, JSON.stringify({ templates, categories: categories.custom() }, null, 2));
      },
      importData
    };
  }

  TW.application.templateService = { createTemplateService };
})(window.TW);
