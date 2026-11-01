// src/domain/image-archive.js — Tải tất cả ảnh: tên file ZIP / PDF, tên từng ảnh trong ZIP, nhãn từng trang PDF.
(function (TW) {
  'use strict';

  const { removeDiacritics } = TW.domain.text;

  const FALLBACK_NAME = 'anh-ticket';
  const MAX_NAME_LENGTH = 80;
  const MIN_INDEX_DIGITS = 2;   // 01, 02… để Explorer sắp đúng thứ tự nội dung
  const DEFAULT_EXTENSION = 'png';
  const EXTENSIONS = { 'image/jpeg': 'jpg' };
  // Ký tự Windows cấm trong tên file + mọi ký tự ngoài ASCII in được
  const UNSAFE = /[^\x20-\x7e]|[\\/:*?"<>|]/gu;

  /** Chỉ giữ ASCII: Explorer của Windows bản cũ hiện sai tên tiếng Việt trong file ZIP. */
  const toFileName = (text) => removeDiacritics(text)
    .replace(UNSAFE, '-').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH).trim();

  const extensionOf = (mimeType) => EXTENSIONS[mimeType] || mimeType.split('/')[1] || DEFAULT_EXTENSION;

  const pad2 = (value) => String(value).padStart(2, '0');

  /** MMDDYYYYHHmm theo giờ máy: tải nhiều lần cùng ticket không đè tên file cũ. */
  const toStamp = (date) => pad2(date.getMonth() + 1) + pad2(date.getDate()) + date.getFullYear()
    + pad2(date.getHours()) + pad2(date.getMinutes());

  /**
   * @param {{ title: string, images: { image: StoredImage, label: string }[] }} input
   * @returns {{ fileName: string, entries: ZipEntry[] }}
   */
  function buildImageArchive({ title, images }) {
    const digits = Math.max(MIN_INDEX_DIGITS, String(images.length).length);
    const entries = images.map(({ image, label }, i) => ({
      name: `${String(i + 1).padStart(digits, '0')} ${toFileName(label)}.${extensionOf(image.blob.type)}`,
      blob: image.blob
    }));
    return { fileName: `${toFileName(title) || FALLBACK_NAME}.zip`, entries };
  }

  /**
   * Chỉ tên file phải ASCII; nhãn in trên trang PDF giữ nguyên tiếng Việt.
   * @param {{ title: string, images: { image: StoredImage, label: string }[], now: Date }} input
   * @returns {{ fileName: string, report: ImageReport }}
   */
  function buildImageReport({ title, images, now }) {
    return {
      fileName: `${toFileName(title) || FALLBACK_NAME} - ${toStamp(now)}.pdf`,
      report: { title, entries: images.map(({ image, label }) => ({ label, blob: image.blob })) }
    };
  }

  TW.domain.imageArchive = { buildImageArchive, buildImageReport };
})(window.TW);
