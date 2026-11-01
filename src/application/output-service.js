// src/application/output-service.js — Kết quả để copy: title, nội dung, điều kiện copy, danh sách ảnh.
(function (TW) {
  'use strict';

  const { buildTitle } = TW.domain.title;
  const { buildBody } = TW.domain.body;
  const { isActionMissing, countMissingImages, canCopyBody } = TW.domain.validation;
  const { imageSlots, imageLabel, defaultImageKey } = TW.domain.imageSlots;
  const { buildImageArchive, buildImageReport } = TW.domain.imageArchive;
  const { buildSmsMessage, missingSmsFields } = TW.domain.smsMessage;
  const { buildShippingMessage, missingShippingFields } = TW.domain.shippingMessage;
  const SMS_IMAGE_KEY = TW.domain.sms.IMAGE_KEY;

  const EMPTY = Object.freeze({
    title: '', body: '', missingAction: false, missingImages: 0, canCopyTitle: false, canCopyBody: false, actionLabel: '', conclusion: '',
    missingFields: [], showTitle: true
  });

  /**
   * @param {{ context: any, session: any, images: any, files?: FileAdapter }} deps   files chỉ cần cho downloadImages
   */
  function createOutputService({ context, session, images, files }) {
    /** Nhóm SMS: chỉ có tin nhắn gửi tiệm, không có title. */
    const messageResult = (body, missingFields) => ({ ...EMPTY, body, missingFields, canCopyBody: !!body && !missingFields.length, showTitle: false });

    function computeSms() {
      const sms = session.sms();
      const config = context.sms;
      const body = buildSmsMessage({ sms, config });
      return messageResult(body, body ? missingSmsFields({ sms, config }) : []);
    }

    function computeShipping() {
      const shipping = session.shipping();
      const config = context.shipping;
      const body = buildShippingMessage({ shipping, config });
      return messageResult(body, body ? missingShippingFields({ shipping, config }) : []);
    }

    function compute() {
      if (session.isPromotion()) return computeSms();
      if (session.isShipping()) return computeShipping();
      const type = session.activeType();
      if (!type) return EMPTY;
      const ticket = session.ticket();
      const imageCounts = images.counts();
      const title = buildTitle(ticket);
      const body = buildBody({ type, ticket, imageCounts, model: session.model(), app: context.app });
      const missingAction = isActionMissing({ type, ticket, conclusion: session.conclusion() });
      const missingImages = countMissingImages({ type, ticket, imageCounts });
      const actionSection = type.sections.find(section => section.actionFor);
      return {
        title, body, missingAction, missingImages,
        canCopyTitle: !!title,
        canCopyBody: canCopyBody({ body, missingAction, missingImages }),
        actionLabel: actionSection ? actionSection.label : '',
        conclusion: ticket.conclusion,
        missingFields: [], showTitle: true
      };
    }

    /** Chỗ gắn ảnh đang hiện: SMS Promotion chỉ có Type Customer, ticket theo loại đang mở. */
    function currentSlots() {
      if (session.isPromotion()) return [{ key: SMS_IMAGE_KEY, label: context.sms.labels.customerTypes }];
      const type = session.activeType();
      return type ? imageSlots(type) : [];
    }

    /** Mọi ảnh đang hiện, theo thứ tự nội dung. */
    function imageList() {
      return currentSlots().flatMap(slot =>
        images.list(slot.key).map((image, i, all) => ({ image, label: imageLabel(slot, i, all.length) })));
    }

    /** Mục nhận ảnh khi dán mà không đứng trong mục nào: mục focus gần nhất nếu còn hiện, không thì mục đầu. */
    function pasteTarget(lastKey) {
      if (currentSlots().some(slot => slot.key === lastKey)) return lastKey;
      if (session.isPromotion()) return SMS_IMAGE_KEY;
      const type = session.activeType();
      return type ? defaultImageKey(type) : null;
    }

    /** Gói mọi ảnh đang hiện thành 1 file ZIP (tên theo title) rồi tải xuống. false = không tạo được. */
    function downloadImages() {
      const { fileName, entries } = buildImageArchive({ title: compute().title, images: imageList() });
      return files.downloadZip(fileName, entries);
    }

    /** Mọi ảnh đang hiện thành 1 file PDF, mỗi trang 1 ảnh kèm nhãn mục. false = không tạo được. */
    function downloadImageReport() {
      const { fileName, report } = buildImageReport({ title: compute().title, images: imageList() });
      return files.downloadPdf(fileName, report);
    }

    return { compute, imageList, pasteTarget, downloadImages, downloadImageReport };
  }

  TW.application.outputService = { createOutputService };
})(window.TW);
