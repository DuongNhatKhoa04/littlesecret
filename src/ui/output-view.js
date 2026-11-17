// src/ui/output-view.js — Khu Kết quả: Title, Nội dung, SMS Promotion, cảnh báo, nút Copy (kể cả Copy để điền ticket). Cập nhật trễ (debounce) khi đang gõ.
(function (TW) {
  'use strict';

  const { $, flash } = TW.ui.dom;
  const UPDATING = 'Đang cập nhật…';
  // Alt+1 … Alt+4; blocked = lý do khi nút đang khóa
  const COPY_SHORTCUTS = {
    1: { selector: '#copyTitle', blocked: () => 'Chưa có title: nhập Loại hoặc Tóm tắt trước.' },
    2: { selector: '#copyBody', blocked: (result) => warningText(result) || 'Chưa có nội dung để copy.' },
    3: { selector: '#copySms', blocked: (result) => smsWarningText(result.sms) || 'Chưa có tin nhắn SMS để copy.' },
    4: { selector: '#copyPromo', blocked: (result) => smsWarningText(result.sms) || 'Chưa có tin nhắn SMS để copy.' }
  };

  const missingText = (fields) => `Còn thiếu: ${fields.join(', ')}. Điền đủ rồi mới copy được.`;
  const smsWarningText = (sms) => (sms && sms.missingFields.length ? missingText(sms.missingFields) : '');

  function warningText(result) {
    if (result.missingFields.length) return missingText(result.missingFields);
    if (result.missingAction) return `Kết luận là "${result.conclusion}" nên cần điền "${result.actionLabel}" trước khi copy nội dung.`;
    if (result.missingImages > 0) {
      return `Còn ${result.missingImages} mục chưa có ảnh. Thêm ảnh cho mục đó, hoặc chọn N/A nếu không áp dụng, rồi mới copy nội dung được.`;
    }
    return '';
  }

  function createOutputView({ context, outputService, clipboard, ticketFill, imagePanel }) {
    let timer = null;
    let last = outputService.compute();

    function renderSms(sms) {
      $('#smsBlock').hidden = !sms;
      $('#outSms').textContent = sms ? sms.body : '';
      const warning = smsWarningText(sms);
      $('#smsWarn').textContent = warning;
      $('#smsWarn').hidden = !warning;
      $('#copySms').disabled = $('#copyPromo').disabled = !sms || !sms.canCopy;
    }

    function render() {
      clearTimeout(timer);
      last = outputService.compute();
      $('#titleBlock').hidden = !last.showTitle;
      $('#outTitle').textContent = last.title;
      $('#outBody').textContent = last.body;
      $('#stTitle').textContent = $('#stBody').textContent = $('#stSms').textContent = '';
      const warning = warningText(last);
      $('#warn').textContent = warning;
      $('#warn').hidden = !warning;
      $('#copyTitle').disabled = !last.canCopyTitle;
      $('#copyBody').disabled = !last.canCopyBody;
      $('#copyFill').disabled = !last.canCopyTitle || !last.canCopyBody;
      renderSms(last.sms);
      imagePanel.render();
    }

    function schedule() {
      $('#stTitle').textContent = $('#stBody').textContent = $('#stSms').textContent = UPDATING;
      clearTimeout(timer);
      timer = setTimeout(render, context.app.debounceMs);
    }

    function wireCopy(selector, pick) {
      const node = $(selector);
      node.addEventListener('click', async () => {
        render();   // render lại ngay để không copy phải bản cũ
        if (node.disabled) return;
        const ok = await clipboard.writeText(pick());
        flash(node, ok ? 'Đã copy ✓' : 'Copy lỗi, hãy chọn và copy tay', ok ? 'done' : '');
      });
    }

    /** Phím tắt bấm nút Copy; nút đang khóa thì báo lý do, vì ở chế độ Nhập không thấy dòng cảnh báo. */
    function onShortcut(event) {
      const shortcut = COPY_SHORTCUTS[event.key];
      if (!shortcut || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      event.preventDefault();
      const node = $(shortcut.selector);
      if (node.closest('[hidden]')) return;   // SMS Shipping không có Title, khối SMS Promotion đang tắt
      render();
      if (node.disabled) { alert(shortcut.blocked(last)); return; }
      node.click();
    }

    wireCopy('#copyTitle', () => last.title);
    wireCopy('#copyBody', () => last.body);
    wireCopy('#copySms', () => last.sms.message);
    wireCopy('#copyPromo', () => last.sms.body);
    wireCopy('#copyFill', () => ticketFill.payload(last.title, last.body));
    document.addEventListener('keydown', onShortcut);

    return { render, schedule };
  }

  TW.ui.outputView = { createOutputView };
})(window.TW);
