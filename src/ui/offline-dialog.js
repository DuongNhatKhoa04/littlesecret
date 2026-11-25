// src/ui/offline-dialog.js — Mục "Lưu ticket ra file" (hỏi Business zipcode + Ticket type + Tier, tải 1 file JSON / ZIP) và "Mở file đã lưu" (chọn file đó, nạp lại vào form).
(function (TW) {
  'use strict';

  const { $, el, flash } = TW.ui.dom;

  const EMPTY_TICKET = 'Ticket đang trống, chưa có gì để lưu offline.';
  const IMAGE_ERROR = 'Đã tải file ticket, nhưng ảnh / PDF không gói vào được. Bấm "Tải tất cả (ZIP)" / "Tải PDF" ở khối Ảnh để tự lưu ảnh.';
  const OPEN_CONFIRM = 'Ticket trong file sẽ thay ticket đang nhập (kể cả ảnh đang dán). Tiếp tục?';
  const INVALID_FILE = 'File không phải ticket offline của Ticket Writer (chọn file .zip / .json đã tải bằng "Lưu ticket ra file"), hoặc loại ticket trong file không còn.';

  /** @param {{ offlineService: object, tiers: string[] }} deps   tiers: lựa chọn ô Tier (config) */
  function createOfflineDialog({ offlineService, tiers }) {
    const dialog = $('#offSaveDlg');
    const zipcode = $('#offZip');
    const ticketType = $('#offType');
    const tier = $('#offTier');
    tiers.forEach(value => { const option = el('option', '', value); option.value = value; tier.append(option); });
    const withPdf = $('#offPdf');
    const picker = $('#offImport');

    /** Gọi khi đổi loại: không có ticket để lưu (nhóm SMS, nhánh setup chưa có checklist, Chuyển case) thì khóa nút Lưu; Chuyển case khóa cả nút Mở. */
    function render() {
      $('#offSave').disabled = !offlineService.canSave();
      $('#offOpen').disabled = !offlineService.canOpen();
    }

    function askInfo() {
      if (!offlineService.hasContent()) { alert(EMPTY_TICKET); return; }
      zipcode.value = '';
      ticketType.value = '';
      tier.value = '';
      withPdf.checked = false;
      $('#offPdfRow').hidden = !offlineService.hasImages();
      dialog.showModal();
      zipcode.focus();
    }

    async function save(event) {
      event.preventDefault();   // ô bắt buộc đã được trình duyệt kiểm tra trước khi tới đây
      const result = await offlineService.save({ zipcode: zipcode.value, ticketType: ticketType.value, tier: tier.value, withPdf: withPdf.checked });
      if (!result) return;
      dialog.close();
      if (result.imagesSaved) flash($('#offSave'), 'Đã tải file ✓'); else alert(IMAGE_ERROR);
    }

    function pickFile() {
      if (offlineService.needsConfirmToOpen() && !confirm(OPEN_CONFIRM)) return;
      picker.click();
    }

    async function openFile(file) {
      const record = await offlineService.openFile(file);
      if (!record) { alert(INVALID_FILE); return; }
      const { zip, pdf } = record.images;
      alert(`Đã mở ${record.id}\nBusiness zipcode: ${record.zipcode}\nTicket type: ${record.ticketType}\nTier: ${record.tier || '(chưa có)'}\n` +
        (zip ? `Ảnh${pdf ? ' + PDF' : ''}: trong file ${zip} (giải nén rồi dán lại vào từng mục)` : 'Không có ảnh'));
    }

    $('#offSave').addEventListener('click', askInfo);
    $('#offSaveForm').addEventListener('submit', save);
    $('#offSaveCancel').addEventListener('click', () => dialog.close());
    $('#offOpen').addEventListener('click', pickFile);
    picker.addEventListener('change', () => {
      const file = picker.files[0];
      picker.value = '';   // chọn lại cùng file vẫn chạy
      if (file) openFile(file);
    });

    return { render };
  }

  TW.ui.offlineDialog = { createOfflineDialog };
})(window.TW);
