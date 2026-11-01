// src/infrastructure/pdf.js — Ghi file PDF ảnh: mỗi trang A4 1 ảnh (ảnh ngang thì trang ngang), đầu trang ghi nhãn.
// Ảnh nhúng đủ pixel gốc; trang chỉ quyết định cỡ hiển thị, phóng to trong trình xem PDF vẫn nét như ảnh gốc.
(function (TW) {
  'use strict';

  const { prepareImage, renderLabel } = TW.infra.pdfImage;

  const A4_SHORT = 595.28;   // point (1/72 inch)
  const A4_LONG = 841.89;
  const MARGIN = 28;
  const LABEL_HEIGHT = 22;
  const LABEL_GAP = 8;
  const LABEL_SCALE = 3;     // pixel / point của ảnh nhãn: in ra vẫn nét
  const MAX_SCALE = 1;       // ảnh nhỏ giữ 1 pixel = 1 point, không phóng to cho vỡ hạt
  const CATALOG_ID = 1;
  const PAGES_ID = 2;
  const INFO_ID = 3;
  const BINARY_HEADER = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a];   // %PDF-1.4 + dòng báo file nhị phân

  const num = (value) => String(Math.round(value * 100) / 100);

  /** EXIF 5–8 là xoay 90°: chiều rộng / cao hiển thị đổi chỗ. */
  const displaySize = ({ width, height, orientation }) => (orientation >= 5 ? { width: height, height: width } : { width, height });

  // Ma trận đặt ảnh gốc (ô vuông đơn vị, dòng đầu ở trên) vào khung x,y,w,h theo đúng hướng EXIF, không vẽ lại ảnh
  function placement(orientation, { x, y, w, h }) {
    const matrices = {
      1: [w, 0, 0, h, x, y], 2: [-w, 0, 0, h, x + w, y], 3: [-w, 0, 0, -h, x + w, y + h], 4: [w, 0, 0, -h, x, y + h],
      5: [0, -h, -w, 0, x + w, y + h], 6: [0, -h, w, 0, x, y + h], 7: [0, h, w, 0, x, y], 8: [0, h, -w, 0, x + w, y]
    };
    return matrices[orientation].map(num).join(' ');
  }

  function layoutPage(size) {
    const [width, height] = size.width > size.height ? [A4_LONG, A4_SHORT] : [A4_SHORT, A4_LONG];
    const boxWidth = width - 2 * MARGIN;
    const labelY = height - MARGIN - LABEL_HEIGHT;
    const scale = Math.min(MAX_SCALE, boxWidth / size.width, (labelY - LABEL_GAP - MARGIN) / size.height);
    const w = size.width * scale;
    const h = size.height * scale;
    return {
      width, height,
      label: { x: MARGIN, y: labelY, w: boxWidth, h: LABEL_HEIGHT, scale: LABEL_SCALE },
      image: { x: (width - w) / 2, y: labelY - LABEL_GAP - h, w, h }   // sát dưới nhãn, giữa theo chiều ngang
    };
  }

  /** Chuỗi Unicode trong PDF: UTF-16BE dạng hex, có BOM (chuỗi JS vốn là UTF-16 nên đổi từng đơn vị mã). */
  const unicodeString = (text) => '<FEFF' + text.split('').map(unit => unit.charCodeAt(0).toString(16).padStart(4, '0')).join('') + '>';

  function createWriter() {
    const encoder = new TextEncoder();
    const parts = [];
    const offsets = [];
    let length = 0;
    const push = (chunk) => {
      const bytes = typeof chunk === 'string' ? encoder.encode(chunk) : chunk;
      parts.push(bytes);
      length += bytes.length;
    };
    push(new Uint8Array(BINARY_HEADER));

    return {
      object(id, dictionary, stream) {
        offsets[id] = length;
        if (!stream) { push(`${id} 0 obj\n${dictionary}\nendobj\n`); return; }
        push(`${id} 0 obj\n<< ${dictionary} /Length ${stream.length} >>\nstream\n`);
        push(stream);
        push('\nendstream\nendobj\n');
      },
      finish(size) {
        const start = length;
        const rows = offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`);
        push(`xref\n0 ${size}\n0000000000 65535 f \n${rows.join('')}`);
        push(`trailer\n<< /Size ${size} /Root ${CATALOG_ID} 0 R /Info ${INFO_ID} 0 R >>\nstartxref\n${start}\n%%EOF\n`);
        return new Blob(parts, { type: 'application/pdf' });
      }
    };
  }

  function imageDictionary(image, maskId) {
    const colorSpace = image.colors === 1 ? '/DeviceGray' : '/DeviceRGB';
    const params = image.predictor ? ` /DecodeParms << /Predictor 15 /Colors ${image.colors} /BitsPerComponent 8 /Columns ${image.width} >>` : '';
    const mask = maskId ? ` /SMask ${maskId} 0 R` : '';
    return `/Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace ${colorSpace} /BitsPerComponent 8 /Filter ${image.filter}${params}${mask}`;
  }

  /** Ghi 1 trang (trang, nội dung, ảnh, độ trong, nhãn). Trả id trang. */
  function writePage(writer, { image, label, layout, nextId }) {
    const [pageId, contentId, imageId, labelId] = [nextId(), nextId(), nextId(), nextId()];
    const maskId = image.mask ? nextId() : 0;
    if (maskId) writer.object(maskId, imageDictionary({ ...image, colors: 1, mask: null }, 0), image.mask);
    writer.object(imageId, imageDictionary(image, maskId), image.data);
    writer.object(labelId, imageDictionary(label, 0), label.data);
    const { x, y, w, h } = layout.label;
    const content = `q ${placement(image.orientation, layout.image)} cm /Im Do Q\nq ${num(w)} 0 0 ${num(h)} ${num(x)} ${num(y)} cm /Lb Do Q\n`;
    writer.object(contentId, '', new TextEncoder().encode(content));
    writer.object(pageId, `<< /Type /Page /Parent ${PAGES_ID} 0 R /MediaBox [0 0 ${num(layout.width)} ${num(layout.height)}] ` +
      `/Resources << /XObject << /Im ${imageId} 0 R /Lb ${labelId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    return pageId;
  }

  /**
   * Ảnh xử lý lần lượt từng cái để không giữ cùng lúc pixel của mọi ảnh lớn trong bộ nhớ.
   * @param {ImageReport} report
   * @returns {Promise<Blob>}
   */
  async function createPdfBlob({ title, entries }) {
    const writer = createWriter();
    let lastId = INFO_ID;
    const nextId = () => ++lastId;
    const pageIds = [];
    for (const entry of entries) {
      const image = await prepareImage(entry.blob);
      const layout = layoutPage(displaySize(image));
      const label = await renderLabel(entry.label, layout.label);
      pageIds.push(writePage(writer, { image, label, layout, nextId }));
    }
    writer.object(CATALOG_ID, `<< /Type /Catalog /Pages ${PAGES_ID} 0 R >>`);
    writer.object(PAGES_ID, `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);
    writer.object(INFO_ID, `<< /Producer (Ticket Writer)${title ? ` /Title ${unicodeString(title)}` : ''} >>`);
    return writer.finish(lastId + 1);
  }

  TW.infra.pdf = { createPdfBlob };
})(window.TW);
