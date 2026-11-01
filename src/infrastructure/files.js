// src/infrastructure/files.js — Đọc file người dùng chọn và tải file xuống. Lỗi đọc => null/undefined, không throw.
(function (TW) {
  'use strict';

  const { createZipBlob } = TW.infra.zip;
  const { createPdfBlob } = TW.infra.pdf;

  const URL_REVOKE_DELAY_MS = 1000;

  function saveBlob(fileName, blob) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), URL_REVOKE_DELAY_MS);
  }

  /** @returns {FileAdapter} */
  function createFileAdapter() {
    return {
      readAsDataUrl(file) {
        return new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });
      },
      /** undefined = file không phải JSON hợp lệ */
      async readJson(file) {
        try { return JSON.parse(await file.text()); } catch (error) { return undefined; }
      },
      download(fileName, text) {
        saveBlob(fileName, new Blob([text], { type: 'application/json' }));
      },
      /** false = không tạo được file ZIP */
      async downloadZip(fileName, entries) {
        try { saveBlob(fileName, await createZipBlob(entries)); return true; } catch (error) { return false; }
      },
      /** false = không tạo được file PDF (vd ảnh không giải mã được) */
      async downloadPdf(fileName, report) {
        try { saveBlob(fileName, await createPdfBlob(report)); return true; } catch (error) { return false; }
      }
    };
  }

  TW.infra.files = { createFileAdapter };
})(window.TW);
