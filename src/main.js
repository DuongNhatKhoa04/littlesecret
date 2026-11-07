// src/main.js — Composition root: tạo adapter, inject vào service, gắn UI. Chỉ nối, không có quy tắc nghiệp vụ.
(function (TW) {
  'use strict';

  const { registry, application: A, infra: I, ui: U } = TW;
  const { $ } = U.dom;

  // Infrastructure
  const storage = I.storage.createLocalStorage();
  const clipboard = I.clipboard.createClipboard();
  const files = I.files.createFileAdapter();
  const screenCapture = I.screenCapture.createScreenCapture();
  const ticketFill = I.ticketFill.createTicketFill(registry.app().ticketFill);

  // Application
  const context = A.context.createContext(registry);
  const repository = A.sessionRepository.createSessionRepository({ storage, context });
  const store = A.store.createStore(repository.load());
  const session = A.session.createSession({ context, store });
  const ticketService = A.ticketService.createTicketService({ context, store });
  const smsService = A.smsService.createSmsService({ context, store });
  const shippingService = A.shippingService.createShippingService({ store });
  const reviewService = A.reviewService.createReviewService({ context, store });
  const navigationService = A.navigationService.createNavigationService({ context, store });
  const viewService = A.viewService.createViewService({ store });
  const images = A.imageService.createImageService({ files, onChecklistImage: ticketService.markDoneByImage });
  const outputService = A.outputService.createOutputService({ context, session, images, files });
  const categories = A.categoryService.createCategoryService({ context, storage });
  const templateService = A.templateService.createTemplateService({ context, store, session, storage, files, categories });

  // UI
  const viewer = U.imageViewer.createImageViewer({ outputService });
  const imageZone = U.imageZone.createImageZone({ images, clipboard, screenCapture, openViewer: viewer.open });
  const checklistView = U.checklistView.createChecklistView({ session, ticketService, images, imageZone });
  const smsForm = U.smsForm.createSmsForm({ context, session, smsService, imageZone });
  const form = U.ticketForm.createTicketForm({
    root: $('#form'), context, session, ticketService, imageZone, checklistView, smsForm,
    categoryCombo: U.categoryCombo.createCategoryCombo({ context, session, ticketService, categories }),
    ideaList: U.ideaList.createIdeaList({ context, session, ticketService })
  });
  const shippingForm = U.shippingForm.createShippingForm({ root: $('#form'), context, session, shippingService });
  const reviewForm = U.reviewForm.createReviewForm({ root: $('#form'), context, session, reviewService });
  const activeForm = () => {   // 3 form dùng chung khu Nhập
    if (session.isReview()) return reviewForm;
    return session.isShipping() ? shippingForm : form;
  };
  const picker = U.picker.createPicker({ root: $('#picker'), context, session, navigationService });
  const imagePanel = U.imagePanel.createImagePanel({ outputService, images, clipboard, openViewer: viewer.open });
  const output = U.outputView.createOutputView({ context, outputService, clipboard, ticketFill, imagePanel });
  const header = U.header.createHeader({ context, session, viewService, ticketService, smsService, shippingService, reviewService, images, onShowOutput: output.render });
  const templateDialog = U.templateDialog.createTemplateDialog({ templateService, files });
  U.fillDialog.createFillDialog({ ticketFill });
  U.pasteHandler.installPasteHandler({ outputService, imageZone });

  store.subscribe((change) => {
    repository.save(store.get());
    if (change.view) { header.render(); return; }
    if (change.rebuild) { picker.render(); activeForm().build(change.focus); templateDialog.render(); output.render(); return; }
    activeForm().sync();
    output.schedule();
  });
  images.subscribe((key) => {
    imageZone.refresh(key);
    activeForm().sync();
    output.schedule();
  });

  picker.render();
  activeForm().build();
  templateDialog.render();
  header.render();
  output.render();
})(window.TW);
