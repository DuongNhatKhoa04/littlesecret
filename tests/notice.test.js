// tests/notice.test.js — Cảnh báo lưu trữ (config/notifications.js): bật/tắt, ẩn bằng ×, sắp đầy, ảnh không lưu được.
(function (TW) {
  'use strict';

  const { test, assert, assertEqual } = TW.tests;
  const A = TW.application;
  const config = TW.registry.notifications();
  const shown = (notices) => notices.list().map(notice => notice.id);

  test('cảnh báo: mọi mục trong config có level hợp lệ và message', () => {
    Object.values(config.items).forEach(item => assert(['warn', 'error'].includes(item.level) && item.message, JSON.stringify(item)));
    assert(config.nearlyFullRatio > 0 && config.nearlyFullRatio < 1);
  });

  test('cảnh báo: id chưa khai báo => báo lỗi ngay (bắt lỗi gõ sai id)', () => {
    const notices = A.noticeService.createNoticeService({ config });
    let error = null;
    try { notices.toggle('khongCo', true); } catch (caught) { error = caught; }
    assert(error, 'phải throw');
  });

  test('cảnh báo: bật => hiện; × => ẩn; hết sự cố rồi gặp lại => hiện lại', () => {
    const notices = A.noticeService.createNoticeService({ config });
    let renders = 0;
    notices.subscribe(() => renders++);
    notices.toggle('sessionSaveFailed', true);
    notices.toggle('sessionSaveFailed', true);   // không đổi => không vẽ lại
    assertEqual([shown(notices), notices.list()[0].level, renders], [['sessionSaveFailed'], 'error', 1]);
    notices.dismiss('sessionSaveFailed');
    notices.toggle('sessionSaveFailed', true);
    assertEqual(shown(notices), []);
    notices.toggle('sessionSaveFailed', false);
    notices.toggle('sessionSaveFailed', true);
    assertEqual(shown(notices), ['sessionSaveFailed']);
  });

  test('cảnh báo sắp đầy: >= ngưỡng => hiện kèm %, dưới ngưỡng => ẩn, không đọc được => không hiện', async () => {
    let estimate = { usage: 85, quota: 100 };
    const notices = A.noticeService.createNoticeService({ config: { ...config, nearlyFullRatio: 0.8 }, quota: { estimate: async () => estimate } });
    await notices.checkStorage();
    assert(notices.list()[0].text.includes('85%'), notices.list()[0].text);
    estimate = { usage: 10, quota: 100 };
    await notices.checkStorage();
    assertEqual(shown(notices), []);
    estimate = null;
    await notices.checkStorage();
    assertEqual(shown(notices), []);
  });

  test('ảnh không lưu được => cảnh báo; lưu lại được / Ticket mới => tắt', async () => {
    let saveOk = false;
    const imageStore = { loadAll: async () => ({}), save: async () => saveOk, clear: async () => true };
    const notices = A.noticeService.createNoticeService({ config });
    const files = { readAsDataUrl: async () => 'data:image/png;base64,' };
    const images = A.imageService.createImageService({ files, imageStore, notices, onChecklistImage: () => {} });
    const png = new Blob([], { type: 'image/png' });
    const settle = () => new Promise(resolve => setTimeout(resolve, 0));
    await images.add('s1', [png]);
    await settle();
    assertEqual(shown(notices), ['imageSaveFailed']);
    saveOk = true;
    images.remove('s1', 0);
    await settle();
    assertEqual(shown(notices), []);
    saveOk = false;
    await images.add('s2', [png]);
    await settle();
    images.clear();
    assertEqual(shown(notices), []);
  });
})(window.TW);
