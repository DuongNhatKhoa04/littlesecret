// tests/backup.test.js — Sao lưu / khôi phục dữ liệu đã lưu trên máy: key nào vào file, file sai, ghi đè, key lạ.
(function (TW) {
  'use strict';

  const { test, assertEqual } = TW.tests;
  const A = TW.application;
  const context = A.context.createContext(TW.registry);
  const { app } = context;

  function setup(saved = {}, { writeOk = true } = {}) {
    const data = { ...saved };
    const storage = { data, read: (key) => key in data ? data[key] : null, write: (key, value) => { if (writeOk) data[key] = value; return writeOk; } };
    const downloads = [];
    const files = {
      download: (fileName, text) => downloads.push({ fileName, text }),
      // Không đọc File thật: test chạy headless với giờ ảo thì đọc Blob đôi khi treo. Đọc file / JSON hỏng đã test ở offline.test.js.
      readJson: async (file) => { try { return JSON.parse(file.text); } catch (error) { return undefined; } }
    };
    return { data, downloads, service: A.backupService.createBackupService({ context, storage, files }) };
  }
  const jsonFile = (text) => ({ text });

  test('sao lưu: tải 1 file JSON gồm gợi ý Tóm tắt, gợi ý tag theo team, template; không có ticket đang nhập, tên nhân viên, mã phone-upload', () => {
    const saved = {
      [app.storageKey]: { ticket: { summary: 'x' }, passCase: { tags: { mkt: { off: [], extra: ['@an'] } } } },
      [app.templateKey]: [{ name: 'T' }], [app.tagKey]: { mkt: ['@an'] }, [app.summaryKey]: ['MẤT KẾT NỐI'],
      [app.staffKey]: 'Ryan', [app.phoneKey]: { link: 'http://127.0.0.1:8765/abc' }
    };
    const { downloads, service } = setup(saved);
    const fileName = service.exportBackup(new Date(2026, 10, 24, 9, 5));
    const file = JSON.parse(downloads[0].text);
    assertEqual([downloads.length, fileName, downloads[0].fileName, file.format, file.appVersion], [1, 'ticket-writer-backup-20261124-0905.json', fileName, 'ticket-writer-backup', app.version]);
    assertEqual(Object.keys(file.data).sort(), [app.templateKey, app.tagKey, app.summaryKey].sort());
    assertEqual(file.data[app.tagKey], { mkt: ['@an'] });
  });

  test('khôi phục: ghi đè key có trong file, key file không có thì giữ, bỏ key lạ / ticket / mã phone-upload; file sai => null, không đổi gì', async () => {
    const source = setup({ [app.templateKey]: [{ name: 'Mới' }], [app.tagKey]: { cs: ['@an'] } });   // chưa có gợi ý Tóm tắt => không ghi key
    source.service.exportBackup(new Date());
    const raw = JSON.parse(source.downloads[0].text);
    raw.data.hack = 'x';
    raw.data[app.phoneKey] = { link: 'khác máy' };
    raw.data[app.storageKey] = { ticket: { summary: 'ticket máy cũ' } };

    const target = setup({ [app.templateKey]: [{ name: 'Cũ' }], [app.summaryKey]: ['GIỮ'], [app.phoneKey]: { link: 'máy này' }, [app.storageKey]: { ticket: { summary: 'đang nhập' } } });
    const keys = app.backupKeys.map(name => app[name]);
    assertEqual([undefined, {}, { format: 'ticket-writer-offline', data: {} }, { format: 'ticket-writer-backup', data: 'x' }]
      .map(raw => TW.domain.backup.parseBackupFile(raw, keys)), [null, null, null, null]);
    assertEqual(await target.service.importFile(jsonFile('không phải json')), null);
    assertEqual(target.data[app.templateKey], [{ name: 'Cũ' }]);
    const result = await target.service.importFile(jsonFile(JSON.stringify(raw)));
    assertEqual(result, { appVersion: app.version, restored: 2, failed: 0 });
    assertEqual([target.data[app.templateKey], target.data[app.tagKey], target.data[app.summaryKey], target.data[app.phoneKey], target.data[app.storageKey], 'hack' in target.data],
      [[{ name: 'Mới' }], { cs: ['@an'] }, ['GIỮ'], { link: 'máy này' }, { ticket: { summary: 'đang nhập' } }, false]);
  });

  test('khôi phục: bộ nhớ đầy / bị chặn => báo số key không ghi được', async () => {
    const source = setup({ [app.summaryKey]: ['A'] });
    source.service.exportBackup(new Date());
    const result = await setup({}, { writeOk: false }).service.importFile(jsonFile(source.downloads[0].text));
    assertEqual([result.restored, result.failed], [0, 1]);
  });
})(window.TW);
