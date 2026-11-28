// tests/sms-segments.test.js — Đếm segment SMS như Twilio Message Segment Calculator: GSM-7 160 / 153, UCS-2 70 / 67, ký tự mở rộng tính 2, ký tự không bị cắt đôi.
(function (TW) {
  'use strict';

  const { test, assertEqual } = TW.tests;
  const { countSegments } = TW.domain.smsSegments;
  const pick = (text) => { const r = countSegments(text); return [r.encoding, r.units, r.segments]; };
  const a = (n) => 'a'.repeat(n);
  const d = (n) => 'đ'.repeat(n);   // đ không có trong GSM-7 => UCS-2

  test('segment GSM-7: tới 160 ký tự = 1; dài hơn thì 153 / segment; rỗng = 0', () => {
    assertEqual([pick(''), pick(a(160)), pick(a(161)), pick(a(306)), pick(a(307)), pick(a(459)), pick(a(460))],
      [['GSM-7', 0, 0], ['GSM-7', 160, 1], ['GSM-7', 161, 2], ['GSM-7', 306, 2], ['GSM-7', 307, 3], ['GSM-7', 459, 3], ['GSM-7', 460, 4]]);
  });

  test('segment GSM-7: ký tự mở rộng ^ { } [ ] ~ \\ | € tính 2, không bị cắt đôi giữa 2 segment', () => {
    assertEqual([pick('€'.repeat(80)), pick('€'.repeat(81)), pick('^{}[]~\\|')], [['GSM-7', 160, 1], ['GSM-7', 162, 2], ['GSM-7', 16, 1]]);
    // 152 + { (2) không vừa segment 1 (153) => { sang segment 2: 152 | 2 + 151 | 1 = 3 segment (đếm thô 306 / 153 = 2)
    assertEqual(pick(a(152) + '{' + a(152)), ['GSM-7', 306, 3]);
    assertEqual([pick('Sale 50% @ Nails! $20 (Mon-Fri) é è à ñ ü'), pick('Line 1\nLine 2')], [['GSM-7', 41, 1], ['GSM-7', 13, 1]]);
  });

  test('segment UCS-2: có ký tự ngoài GSM-7 (tiếng Việt, nháy cong, emoji) => 70 / 1 segment, dài hơn 67 / segment; chỉ ra ký tự gây ra', () => {
    assertEqual([pick(d(70)), pick(d(71)), pick(d(134)), pick(d(135))], [['UCS-2', 70, 1], ['UCS-2', 71, 2], ['UCS-2', 134, 2], ['UCS-2', 135, 3]]);
    assertEqual(countSegments('It’s “Sale” – Giảm giá 😀 It’s').unsupported, ['’', '“', '”', '–', 'ả', 'á', '😀']);
    // emoji = 2 đơn vị UTF-16 khi chia segment, không bị cắt đôi: 66 + 😀 không vừa 67 => sang segment 2 (68 > 67) => 3 segment (đếm thô 134 / 67 = 2).
    // Số ký tự hiển thị (như Twilio) đếm emoji là 1: 133.
    assertEqual(pick(d(66) + '😀' + d(66)), ['UCS-2', 133, 3]);
    assertEqual(pick('a😀'), ['UCS-2', 2, 1]);
    // Emoji ghép (ZWJ) là 1 khối; chữ + dấu tổ hợp (e + ´) dù từng phần có trong GSM vẫn thành UCS-2, như Twilio
    assertEqual([pick('👨\u200d👩\u200d👧'), countSegments('Cafe\u0301').encoding], [['UCS-2', 1, 1], 'UCS-2']);
  });
})(window.TW);
