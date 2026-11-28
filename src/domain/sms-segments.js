// src/domain/sms-segments.js — Đếm segment của 1 tin SMS như Twilio Message Segment Calculator (GSM-7 / UCS-2, encoding auto, không smart encoding).
// Tự đếm trên máy: không gọi trang Twilio, không gửi nội dung merchant ra ngoài (docs/SECURITY.md).
// Đối chiếu mã nguồn TwilioDevEd/message-segment-calculator (SegmentedMessage, Segment, EncodedChar, UnicodeToGSM).
(function (TW) {
  'use strict';

  // Bảng ký tự GSM 03.38: ký tự cơ bản tính 1, ký tự mở rộng (cần ký tự thoát) tính 2.
  const GSM_BASIC = '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
  const GSM_EXTENDED = '\f^{}\\[~]|€';
  // 1 segment = 140 byte; tin nhiều segment mỗi segment mất 6 byte phần đầu ghép tin => 153 (GSM-7) / 67 (UCS-2)
  const GSM_7 = { name: 'GSM-7', single: 160, multi: 153 };
  const UCS_2 = { name: 'UCS-2', single: 70, multi: 67 };

  /** Tách theo cụm ký tự hiển thị như Twilio (emoji ghép, chữ + dấu tổ hợp là 1 khối, không bị cắt giữa 2 segment). */
  const graphemes = (text) => (typeof Intl !== 'undefined' && Intl.Segmenter
    ? [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(text)].map(part => part.segment)
    : Array.from(text));

  /** Cụm có từ 2 ký tự trở lên (emoji, chữ + dấu tổ hợp) hoặc ký tự ngoài bảng GSM => phải gửi UCS-2. */
  const isGsm = (part) => part.length === 1 && (GSM_BASIC.includes(part) || GSM_EXTENDED.includes(part));
  /** Đơn vị 1 cụm chiếm: GSM-7 = 1 hoặc 2 (ký tự mở rộng); UCS-2 = số đơn vị UTF-16 (emoji = 2). */
  const gsmUnits = (part) => (GSM_EXTENDED.includes(part) ? 2 : 1);
  const ucsUnits = (part) => part.length;

  /** Xếp từng cụm vào segment; cụm không vừa chỗ còn lại thì sang segment mới (không cắt đôi). */
  function packSegments(units, capacity) {
    let segments = 1;
    let used = 0;
    units.forEach(size => {
      if (used + size > capacity) { segments += 1; used = 0; }
      used += size;
    });
    return segments;
  }

  /**
   * @param {string} text   tin khách nhận (đúng chữ sẽ gửi)
   * @returns {{ encoding: string, units: number, segments: number, unsupported: string[] }}
   *   units: số ký tự Twilio hiển thị (GSM-7: ký tự mở rộng tính 2; UCS-2: mỗi cụm hiển thị tính 1) ·
   *   unsupported: cụm ngoài GSM-7 (lý do thành UCS-2), không lặp
   */
  function countSegments(text) {
    const parts = graphemes(text);
    const unsupported = [...new Set(parts.filter(part => !isGsm(part)))];
    const scheme = unsupported.length ? UCS_2 : GSM_7;
    const units = parts.map(unsupported.length ? ucsUnits : gsmUnits);
    const total = units.reduce((sum, size) => sum + size, 0);
    const segments = total === 0 ? 0 : total <= scheme.single ? 1 : packSegments(units, scheme.multi);
    return { encoding: scheme.name, units: unsupported.length ? parts.length : total, segments, unsupported };
  }

  TW.domain.smsSegments = { countSegments };
})(window.TW);
