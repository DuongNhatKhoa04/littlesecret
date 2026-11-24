// src/application/offline-service.js — Ticket offline: tải ticket đang nhập ra 1 file (JSON, hoặc ZIP chứa JSON + ảnh + PDF), mở file lại vào form.
(function (TW) {
  'use strict';

  const O = TW.domain.offlineTicket;
  const { sanitizeTicket, hasAnyContent } = TW.domain.ticket;
  const { navigationForType } = TW.domain.navigation;
  const { buildImageArchive, buildImageReport } = TW.domain.imageArchive;
  const JSON_TYPE = 'application/json';

  /**
   * @param {{ context: object, store: object, session: object, files: FileAdapter, images: object, outputService: object }} deps
   */
  function createOfflineService({ context, store, session, files, images, outputService }) {
    const { catalog, typeOf } = context;
    const typeExists = (key) => !!typeOf(key);
    /** Nhóm SMS, nhánh setup chưa có checklist: không có ticket. Chuyển case là tin nhắn group, không phải ticket. */
    const canSave = () => !!session.activeTypeKey() && !session.isPassCase();

    /**
     * Mỗi lần bấm chỉ tải ĐÚNG 1 file: Chrome chặn trang tự tải file thứ 2 trở đi.
     * Không ảnh => <tên>.json. Có ảnh => <tên>.zip chứa <tên>.json + ảnh (+ <tên>.pdf nếu chọn).
     * null = không lưu được (canSave) / ticket trống / thiếu zipcode, ticket type hoặc tier.
     * @param {{ zipcode: string, ticketType: string, tier: string, withPdf: boolean }} input
     * @returns {Promise<{ fileName: string, imagesSaved: boolean } | null>}   imagesSaved false = ảnh / PDF không vào được file
     */
    async function save({ zipcode, ticketType, tier, withPdf }) {
      const type = session.activeTypeKey();
      const { title, body } = outputService.compute();
      if (!canSave() || !(title || body) || !zipcode.trim() || !ticketType.trim() || !tier.trim()) return null;
      const now = new Date();
      const id = O.createOfflineId(now);
      const baseName = O.offlineBaseName(id, title);
      const json = (images) => JSON.stringify(O.createOfflineFile({
        id, savedAt: now.getTime(), type, zipcode: zipcode.trim(), ticketType: ticketType.trim(), tier: tier.trim(), title, body, ticket: session.ticket(), images
      }), null, 2);
      const downloadJsonOnly = (imagesSaved) => {
        files.download(`${baseName}.json`, json({ zip: '', pdf: '' }));
        return { fileName: `${baseName}.json`, imagesSaved };
      };

      const list = outputService.imageList();
      if (!list.length) return downloadJsonOnly(true);
      const pdf = withPdf ? await files.createPdf(buildImageReport({ title, images: list, now }).report) : null;
      const names = { zip: `${baseName}.zip`, pdf: pdf ? `${baseName}.pdf` : '' };
      const entries = [
        { name: `${baseName}.json`, blob: new Blob([json(names)], { type: JSON_TYPE }) },
        ...buildImageArchive({ title, images: list }).entries,
        ...(pdf ? [{ name: names.pdf, blob: pdf }] : [])
      ];
      if (await files.downloadZip(names.zip, entries)) return { fileName: names.zip, imagesSaved: !withPdf || !!pdf };
      return downloadJsonOnly(false);   // ZIP lỗi thì chưa có gì được tải: vẫn giữ được phần chữ
    }

    /** Thay ticket đang nhập bằng ticket trong file; ảnh đang dán là của ticket khác nên bỏ. null = file không đúng dạng. */
    async function openFile(file) {
      const record = O.parseOfflineFile(await files.readJson(file), typeExists);
      if (!record) return null;
      images.clear();
      store.update(state => {
        state.ticket = sanitizeTicket(record.ticket, context);
        state.nav = navigationForType(typeOf(record.type), state.nav, catalog);
      }, { rebuild: true });
      return record;
    }

    return {
      canSave,
      hasContent() { const { title, body } = outputService.compute(); return !!(title || body); },
      hasImages: () => outputService.imageList().length > 0,
      save,
      needsConfirmToOpen: () => hasAnyContent(session.ticket(), context.blockKeys) || outputService.imageList().length > 0,
      openFile
    };
  }

  TW.application.offlineService = { createOfflineService };
})(window.TW);
