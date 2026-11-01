// src/infrastructure/pdf-image.js — Chuẩn bị ảnh cho PDF mà không làm giảm độ nét:
// JPEG nhúng nguyên file gốc; định dạng khác giải mã ra đúng từng pixel rồi nén lại không mất dữ liệu.
/**
 * Ảnh đã sẵn sàng ghi vào PDF.
 * @typedef {Object} PdfImage
 * @property {number} width        pixel của dữ liệu gốc (chưa xoay)
 * @property {number} height
 * @property {number} orientation  hướng EXIF 1–8
 * @property {number} colors       1 = xám, 3 = RGB
 * @property {string} filter       /DCTDecode = JPEG gốc, /FlateDecode = pixel nén không mất dữ liệu
 * @property {boolean} predictor   dữ liệu đã qua bộ lọc dòng PNG
 * @property {Uint8Array} data
 * @property {Uint8Array | null} mask   độ trong suốt (xám, cùng bộ lọc), null = ảnh đặc
 */

(function (TW) {
  'use strict';

  const MARKER = 0xff;
  const SOI = 0xd8;
  const SOS = 0xda;
  const APP1 = 0xe1;
  const SOF_MARKERS = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf];
  const EXIF_SIGNATURE = 0x45786966;   // "Exif"
  const TIFF_LITTLE_ENDIAN = 0x4949;   // "II"
  const ORIENTATION_TAG = 0x0112;
  const IFD_ENTRY_SIZE = 12;
  const EMBEDDABLE_COLORS = [1, 3];   // xám, RGB; CMYK… thì giải mã như ảnh thường
  const PNG_UP = 2;   // bộ lọc dòng PNG "Up": các dòng ảnh chụp màn hình gần giống nhau nên nén nhỏ hơn hẳn
  const LABEL_FONT = '"Segoe UI", system-ui, sans-serif';
  const LABEL_INK = '#111';
  const LABEL_PAPER = '#fff';

  const validOrientation = (value) => (value >= 1 && value <= 8 ? value : 1);

  function exifOrientation(view, start) {
    if (view.getUint32(start) !== EXIF_SIGNATURE) return 1;
    const tiff = start + 6;
    const little = view.getUint16(tiff) === TIFF_LITTLE_ENDIAN;
    const ifd = tiff + view.getUint32(tiff + 4, little);
    const count = view.getUint16(ifd, little);
    for (let i = 0; i < count; i++) {
      const entry = ifd + 2 + i * IFD_ENTRY_SIZE;
      if (view.getUint16(entry, little) === ORIENTATION_TAG) return validOrientation(view.getUint16(entry + 8, little));
    }
    return 1;
  }

  /** Kích thước, số kênh màu, hướng xoay EXIF. null = không nhúng thẳng được (không phải JPEG, hỏng, CMYK, 12 bit…). */
  function readJpegInfo(bytes) {
    try {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      if (view.getUint8(0) !== MARKER || view.getUint8(1) !== SOI) return null;
      let orientation = 1;
      for (let at = 2; at + 4 <= bytes.length;) {
        if (view.getUint8(at) !== MARKER) return null;
        const marker = view.getUint8(at + 1);
        if (marker === MARKER) { at++; continue; }   // byte đệm giữa 2 marker
        if (marker === SOS) return null;             // tới dữ liệu ảnh mà chưa thấy kích thước
        if (marker === APP1) orientation = exifOrientation(view, at + 4);
        if (SOF_MARKERS.includes(marker)) {
          const info = { precision: view.getUint8(at + 4), height: view.getUint16(at + 5), width: view.getUint16(at + 7), colors: view.getUint8(at + 9) };
          if (info.precision !== 8 || !info.height || !EMBEDDABLE_COLORS.includes(info.colors)) return null;
          return { width: info.width, height: info.height, colors: info.colors, orientation };
        }
        at += 2 + view.getUint16(at + 2);
      }
      return null;
    } catch (error) {
      return null;   // EXIF/marker hỏng => giải mã như ảnh thường
    }
  }

  async function deflate(bytes) {
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  /** RGBA => dòng PNG (bộ lọc Up) cho màu và cho độ trong. alpha = null khi ảnh không có chỗ nào trong suốt. */
  function toRows({ data, width, height }) {
    const color = new Uint8Array(height * (1 + width * 3));
    const alpha = new Uint8Array(height * (1 + width));
    const rowBytes = width * 4;
    let transparent = false;
    for (let y = 0; y < height; y++) {
      const colorRow = y * (1 + width * 3);
      const alphaRow = y * (1 + width);
      color[colorRow] = PNG_UP;
      alpha[alphaRow] = PNG_UP;
      for (let x = 0; x < width; x++) {
        const p = (y * width + x) * 4;
        for (let k = 0; k < 3; k++) color[colorRow + 1 + x * 3 + k] = data[p + k] - (y ? data[p + k - rowBytes] : 0);
        alpha[alphaRow + 1 + x] = data[p + 3] - (y ? data[p + 3 - rowBytes] : 0);
        if (data[p + 3] !== 255) transparent = true;
      }
    }
    return { color, alpha: transparent ? alpha : null };
  }

  async function fromPixels(pixels) {
    const { color, alpha } = toRows(pixels);
    return {
      width: pixels.width, height: pixels.height, orientation: 1, colors: 3, filter: '/FlateDecode', predictor: true,
      data: await deflate(color), mask: alpha && await deflate(alpha)
    };
  }

  // Trình duyệt tự xoay theo EXIF khi giải mã, nên ảnh đi đường này luôn coi như đúng chiều (orientation 1)
  async function decodePixels(blob) {
    const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image', premultiplyAlpha: 'none' });
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
    return context.getImageData(0, 0, canvas.width, canvas.height);
  }

  /**
   * @param {Blob} blob
   * @returns {Promise<PdfImage>}
   */
  async function prepareImage(blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const jpeg = readJpegInfo(bytes);
    if (jpeg) return { ...jpeg, filter: '/DCTDecode', predictor: false, data: bytes, mask: null };
    return fromPixels(await decodePixels(blob));
  }

  /**
   * Nhãn vẽ thành ảnh vì font có sẵn của PDF không có chữ tiếng Việt có dấu.
   * @param {string} text
   * @param {{ w: number, h: number, scale: number }} size   khung theo point, scale = số pixel / point
   * @returns {Promise<PdfImage>}
   */
  async function renderLabel(text, { w, h, scale }) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const context = canvas.getContext('2d');
    context.fillStyle = LABEL_PAPER;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = LABEL_INK;
    context.font = `600 ${Math.round(canvas.height * 0.62)}px ${LABEL_FONT}`;
    context.textBaseline = 'middle';
    context.fillText(text, 0, canvas.height / 2, canvas.width);   // nhãn quá dài thì co chữ cho vừa
    return fromPixels(context.getImageData(0, 0, canvas.width, canvas.height));
  }

  TW.infra.pdfImage = { prepareImage, renderLabel };
})(window.TW);

