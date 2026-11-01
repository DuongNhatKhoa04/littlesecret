// src/infrastructure/zip.js — Gói nhiều file thành 1 file ZIP. Không nén: ảnh vốn đã nén, nén thêm chỉ tốn thời gian.
(function (TW) {
  'use strict';

  const LOCAL_HEADER = 0x04034b50;
  const CENTRAL_HEADER = 0x02014b50;
  const END_OF_CENTRAL = 0x06054b50;
  const LOCAL_SIZE = 30;
  const CENTRAL_SIZE = 46;
  const END_SIZE = 22;
  const VERSION = 20;            // 2.0: bản thấp nhất đọc được file không nén
  const UTF8_NAMES = 0x0800;     // cờ báo tên file là UTF-8
  const STORED = 0;              // phương thức "không nén"
  const DOS_EPOCH_YEAR = 1980;

  const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  /** ZIP lưu giờ theo kiểu MS-DOS (giờ máy, giây làm tròn 2). */
  const dosStamp = (date) => ({
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    date: ((date.getFullYear() - DOS_EPOCH_YEAR) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  });

  function block(size) {
    const bytes = new Uint8Array(size);
    return { bytes, view: new DataView(bytes.buffer) };
  }

  // Local header và central header có chung 1 đoạn giống hệt nhau (version needed → extra length).
  function writeShared(view, at, file) {
    view.setUint16(at, VERSION, true);
    view.setUint16(at + 2, UTF8_NAMES, true);
    view.setUint16(at + 4, STORED, true);
    view.setUint16(at + 6, file.time, true);
    view.setUint16(at + 8, file.date, true);
    view.setUint32(at + 10, file.crc, true);
    view.setUint32(at + 14, file.data.length, true);   // cỡ sau nén = cỡ gốc
    view.setUint32(at + 18, file.data.length, true);
    view.setUint16(at + 22, file.name.length, true);
  }

  function localHeader(file) {
    const { bytes, view } = block(LOCAL_SIZE + file.name.length);
    view.setUint32(0, LOCAL_HEADER, true);
    writeShared(view, 4, file);
    bytes.set(file.name, LOCAL_SIZE);
    return bytes;
  }

  function centralHeader(file, offset) {
    const { bytes, view } = block(CENTRAL_SIZE + file.name.length);
    view.setUint32(0, CENTRAL_HEADER, true);
    view.setUint16(4, VERSION, true);
    writeShared(view, 6, file);
    view.setUint32(42, offset, true);
    bytes.set(file.name, CENTRAL_SIZE);
    return bytes;
  }

  function endOfCentral({ count, size, offset }) {
    const { bytes, view } = block(END_SIZE);
    view.setUint32(0, END_OF_CENTRAL, true);
    view.setUint16(8, count, true);
    view.setUint16(10, count, true);
    view.setUint32(12, size, true);
    view.setUint32(16, offset, true);
    return bytes;
  }

  /**
   * @param {ZipEntry[]} entries
   * @returns {Promise<Blob>}
   */
  async function createZipBlob(entries) {
    const encoder = new TextEncoder();
    const stamp = dosStamp(new Date());
    const body = [];
    const central = [];
    let offset = 0;
    for (const entry of entries) {
      const data = new Uint8Array(await entry.blob.arrayBuffer());
      const file = { ...stamp, name: encoder.encode(entry.name), data, crc: crc32(data) };
      const local = localHeader(file);
      central.push(centralHeader(file, offset));
      body.push(local, data);
      offset += local.length + data.length;
    }
    const size = central.reduce((sum, part) => sum + part.length, 0);
    const end = endOfCentral({ count: entries.length, size, offset });
    return new Blob([...body, ...central, end], { type: 'application/zip' });
  }

  TW.infra.zip = { createZipBlob };
})(window.TW);
