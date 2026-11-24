// src/application/backup-service.js — Sao lưu dữ liệu đã lưu trên máy ra 1 file JSON, khôi phục từ file đó (chuyển máy / trình duyệt).
(function (TW) {
  'use strict';

  const { backupFileName, createBackupFile, parseBackupFile } = TW.domain.backup;

  /** @param {{ context: object, storage: KeyValueStore, files: FileAdapter }} deps */
  function createBackupService({ context, storage, files }) {
    const { app } = context;
    const keys = app.backupKeys.map(name => app[name]);

    return {
      /** Tải file sao lưu, trả về tên file. */
      exportBackup(now) {
        const data = Object.fromEntries(keys.map(key => [key, storage.read(key)]));
        const fileName = backupFileName(now);
        files.download(fileName, JSON.stringify(createBackupFile({ savedAt: now.getTime(), appVersion: app.version, data }), null, 2));
        return fileName;
      },

      /**
       * Ghi đè dữ liệu trên máy bằng dữ liệu trong file (key file không có thì giữ nguyên). Các service đã đọc dữ liệu lúc mở trang
       * => sau khi khôi phục phải tải lại trang.
       * @returns {Promise<{ appVersion: string, restored: number, failed: number } | null>}   null = không phải file sao lưu
       */
      async importFile(file) {
        const record = parseBackupFile(await files.readJson(file), keys);
        if (!record) return null;
        const results = Object.entries(record.data).map(([key, value]) => storage.write(key, value));
        return { appVersion: record.appVersion, restored: results.filter(Boolean).length, failed: results.filter(ok => !ok).length };
      }
    };
  }

  TW.application.backupService = { createBackupService };
})(window.TW);
