// tests/tools/smoke_ui.js — Kịch bản bấm thử giao diện thật. Chỉ dùng qua smoke_ui.py (được chèn tạm vào bản sao index.html).
(async function () {
  'use strict';

  const log = [];
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const settle = () => wait(500);   // > debounceMs
  // Đọc ảnh / tạo file là I/O thật, nhanh chậm tùy máy: đợi tới khi DOM đạt điều kiện (tối đa ms) chứ không đợi cố định.
  const until = (cond, ms = 15000) => new Promise(resolve => {
    if (cond()) { resolve(true); return; }
    const done = (ok) => { observer.disconnect(); clearTimeout(timer); resolve(ok); };
    const observer = new MutationObserver(() => { if (cond()) done(true); });
    const timer = setTimeout(() => done(false), ms);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true });
  });
  const check = (name, ok, detail) => log.push((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' :: ' + JSON.stringify(detail)));
  const type = (node, value) => { node.value = value; node.dispatchEvent(new Event('input', { bubbles: true })); };
  const pressed = () => $$('#picker button[aria-pressed="true"]').map(b => b.textContent);
  const imageLabels = () => $$('#imgList .meta > div:first-child').map(x => x.textContent);
  const key = (node, init) => node.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
  const focused = () => document.activeElement && (document.activeElement.id || document.activeElement.dataset.key || document.activeElement.tagName);
  const clickText = (scope, text) => {
    const target = $$(scope + ' button').find(x => x.textContent.trim() === text);
    if (!target) throw new Error('Không thấy nút ' + text);
    target.click();
  };
  // Chặn link tải để không ghi file ra máy (tải thật làm headless treo), chỉ lấy tên + nội dung blob.
  async function captureDownload(button) {
    const names = [];
    const realClick = HTMLAnchorElement.prototype.click;
    const realObjectUrl = URL.createObjectURL;
    HTMLAnchorElement.prototype.click = function () { names.push(this.download); };
    const created = new Promise(resolve => { URL.createObjectURL = (blob) => { resolve(blob); return realObjectUrl.call(URL, blob); }; });
    button.click();
    const blob = await Promise.race([created, wait(10000)]);
    await until(() => button.textContent === 'Đã tải ✓', 5000);
    HTMLAnchorElement.prototype.click = realClick;
    URL.createObjectURL = realObjectUrl;
    return { names, bytes: blob ? new Uint8Array(await blob.arrayBuffer()) : new Uint8Array(), label: button.textContent };
  }
  const alerts = [];
  window.alert = (m) => alerts.push(m);
  window.confirm = () => true;
  // Không ghi đè clipboard thật của máy đang chạy test (cả đường dự phòng execCommand)
  const copiedTexts = [];
  if (navigator.clipboard) Object.defineProperty(navigator.clipboard, 'writeText', { value: async (text) => { copiedTexts.push(text); } });
  document.execCommand = () => true;

  try {
    // Viết ticket mặc định: Hỗ trợ merchant
    check('mặc định ở Viết ticket / Hỗ trợ merchant', pressed().join('|') === 'Viết ticket|Hỗ trợ merchant', pressed());
    await wait(50);
    check('mở trang: con trỏ ở ô Loại', focused() === 'f_category', focused());
    check('ô dán ảnh không nhận Tab', $$('.pzone').length > 0 && $$('.pzone').every(z => z.tabIndex === -1));
    type($('#f_summary'), 'mất kết nối');
    $('#f_summary').focus();
    key($('#f_summary'), { key: 'Enter' });
    check('Enter ở Tóm tắt => sang Phone', focused() === 'f_phone', focused());
    type($('#f_phone'), '0901');
    key($('#f_phone'), { key: 'Enter' });
    check('Enter ở Phone => sang ý đầu Vấn đề (bỏ qua nút phụ)', focused() === 's1', focused());
    type($('textarea[data-key="s1"]'), 'terminal lỗi');
    await settle();
    check('title', $('#outTitle').textContent === 'MẤT KẾT NỐI', $('#outTitle').textContent);
    check('nội dung + viết hoa đầu dòng, mặc định Resolved (không in Kết luận)', $('#outBody').textContent === 'Phone: 0901\n\nVấn đề:\n- Terminal lỗi', $('#outBody').textContent);
    check('Resolved bước đầu copy được', !$('#copyBody').disabled);

    $('textarea[data-key="s1"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await wait(50);
    check('Enter tạo ý mới + focus', $$('textarea[data-key="s1"]').length === 2 && document.activeElement.dataset.i === '1');

    check('Kết luận chỉ có Resolved / Pending - Needs to follow up', $$('input[name="conclusion"]').map(r => r.value).join('|') === 'Resolved|Pending - Needs to follow up');
    type($('textarea[data-key="s2"]'), 'restart');
    $$('input[name="conclusion"]').find(r => r.value === 'Resolved').click();
    await settle();
    check('Resolved: không có Nguyên nhân / Kết quả, ẩn Việc cần làm tiếp, không in dòng Kết luận, copy được', !$('#copyBody').disabled && $('#warn').hidden &&
      !$('textarea[data-key="s3"]') && !$('textarea[data-key="s4"]') && $('[data-action-box]').hidden &&
      $('#outBody').textContent.endsWith('Đã support:\n- Restart'), $('#outBody').textContent);
    $$('input[name="conclusion"]').find(r => r.value === 'Pending - Needs to follow up').click();
    await settle();
    check('Pending: hiện Việc cần làm tiếp, chưa điền vẫn copy được, không nhãn Bắt buộc', !$('#copyBody').disabled && $('#warn').hidden &&
      !$('[data-action-box]').hidden && $('[data-req-badge]').hidden &&
      $('#outBody').textContent.endsWith('Đã support:\n- Restart\n\nKết luận: Pending - Needs to follow up'), $('#outBody').textContent);
    type($('textarea[data-key="s5"]'), 'gọi lại check');
    await settle();
    check('Việc cần làm tiếp in sau Kết luận', $('#outBody').textContent.endsWith('Kết luận: Pending - Needs to follow up\n\nViệc cần làm tiếp:\n- Gọi lại check'), $('#outBody').textContent);
    $$('input[name="conclusion"]').find(r => r.value === 'Resolved').click();
    await settle();
    check('đổi lại Resolved: ẩn + không in Việc cần làm tiếp, chữ đã nhập vẫn giữ', $('[data-action-box]').hidden &&
      $('#outBody').textContent.endsWith('Đã support:\n- Restart') && $('textarea[data-key="s5"]').value === 'Gọi lại check', $('#outBody').textContent);
    $$('input[name="conclusion"]').find(r => r.value === 'Pending - Needs to follow up').click();
    await settle();
    const copyClicks = [];   // chỉ kiểm tra phím tắt bấm đúng nút; clipboard thật trong headless trả kết quả theo giờ thật
    ['#copyTitle', '#copyBody'].forEach(id => $(id).addEventListener('click', () => copyClicks.push(id)));
    key(document, { key: '2', altKey: true });
    key(document, { key: '1', altKey: true });
    check('Alt+2 / Alt+1 => bấm Copy nội dung / Copy title', copyClicks.join('|') === '#copyBody|#copyTitle', copyClicks);

    // Copy để điền + bookmarklet "Điền ticket": chạy đúng link bookmark trên form giả giống trang ticket thật
    $('#copyFill').click();
    await until(() => $('#copyFill').textContent === 'Đã copy ✓', 5000);
    const fillPayload = copiedTexts[copiedTexts.length - 1];
    const ticketForm = document.createElement('form');
    const subjectInput = document.createElement('input');
    subjectInput.name = 'subject';
    const descriptionArea = document.createElement('textarea');
    descriptionArea.name = 'description';
    const commentInput = document.createElement('input');   // như trang thật: không có name / placeholder, nằm trong khung Checklist
    const checklistBox = Object.assign(document.createElement('div'), { className: 'checklist' });
    const commentBox = Object.assign(document.createElement('div'), { className: 'form-input comment' });
    commentBox.append(commentInput);
    checklistBox.append(commentBox);
    const uploadButton = document.createElement('button');
    uploadButton.type = 'button';
    uploadButton.append(Object.assign(document.createElement('p'), { className: 'button-text', textContent: 'Upload File(s)' }));
    const fillEvents = [];
    [subjectInput, descriptionArea, commentInput].forEach(node => node.addEventListener('input', () => fillEvents.push(node.name || 'comment')));
    uploadButton.addEventListener('click', () => fillEvents.push('upload'));
    ticketForm.append(subjectInput, descriptionArea, checklistBox, uploadButton);
    document.body.append(ticketForm);
    Object.defineProperty(navigator.clipboard, 'readText', { value: async () => fillPayload, configurable: true });
    const bookmarklet = decodeURIComponent($('#fillBookmarklet').getAttribute('href').slice('javascript:'.length));
    (0, eval)(bookmarklet);
    await wait(300);   // gán value không đổi DOM nên until() không bắt được
    check('Điền ticket: Title → Subject, Nội dung → Description, done → Comment ở Checklist, rồi bấm Upload File(s)',
      subjectInput.value === $('#outTitle').textContent && descriptionArea.value === $('#outBody').textContent && commentInput.value === 'done' &&
      fillEvents.join('|') === 'subject|description|comment|upload', { subject: subjectInput.value, comment: commentInput.value, events: fillEvents });
    [subjectInput, descriptionArea, commentInput].forEach(node => { node.value = ''; });
    fillEvents.length = 0;
    const alertCount = alerts.length;
    checklistBox.remove();
    (0, eval)(bookmarklet);
    await wait(300);
    check('Điền ticket: trang không có ô Comment => bỏ qua, vẫn điền Subject / Description rồi bấm Upload, không báo',
      subjectInput.value === $('#outTitle').textContent && fillEvents.join('|') === 'subject|description|upload' && alerts.length === alertCount,
      { events: fillEvents, alerts: alerts.slice(alertCount) });
    [subjectInput, descriptionArea].forEach(node => { node.value = ''; });
    fillEvents.length = 0;
    uploadButton.remove();
    (0, eval)(bookmarklet);
    await wait(300);
    check('Điền ticket: thiếu nút Upload File(s) => báo thiếu, không điền gì', subjectInput.value === '' && fillEvents.length === 0 &&
      String(alerts[alerts.length - 1]).includes('Không thấy Upload File(s)'), alerts[alerts.length - 1]);
    Object.defineProperty(navigator.clipboard, 'readText', { value: async () => 'chữ thường', configurable: true });
    (0, eval)(bookmarklet);
    await wait(300);
    check('Điền ticket: clipboard không phải của Ticket Writer => báo, không điền', subjectInput.value === '' &&
      String(alerts[alerts.length - 1]).includes('Clipboard chưa có ticket'), alerts[alerts.length - 1]);
    ticketForm.remove();
    $('#fillHelp').click();
    check('hộp hướng dẫn bookmark mở, nút kéo là link javascript:', $('#fillDlg').open && $('#fillBookmarklet').href.startsWith('javascript:'));
    $('#fillClose').click();

    // Ô Loại
    const cat = $('#f_category');
    cat.focus();
    type(cat, 'cl');
    cat.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    type(cat, 'internet');
    key(cat, { key: 'Tab' });
    await settle();
    check('Loại chip theo thứ tự chọn (Enter, Tab khi gõ dở)', $('#outTitle').textContent === 'CLOVER - INTERNET - MẤT KẾT NỐI' && cat.value === '',
      $('#outTitle').textContent);

    // Đổi loại giữ nội dung mục chung
    $('textarea[data-key="s1"]').focus();
    clickText('#picker', 'Chuyển CS/MKT');
    await settle();
    check('đổi sang Chuyển CS/MKT giữ nội dung s1', $('#outBody').textContent.includes('Yêu cầu:\n- Terminal lỗi'), $('#outBody').textContent);
    check('đổi loại: con trỏ về ô Loại', focused() === 'f_category', focused());
    clickText('#picker', 'Hỗ trợ merchant');
    await settle();

    // Setup: nút đang tạm ẩn (config/app.js) nhưng vẫn nằm trong DOM nên kịch bản bấm được
    check('nhóm Setup / Training không hiện', $$('#picker button').find(x => x.textContent === 'Setup / Training').offsetParent === null);
    clickText('#picker', 'Setup / Training');
    await settle();
    const labels = $$('#picker .picker-label').map(x => x.textContent);
    check('POS: Thiết bị, Hãng, Quy trình, Checklist (không có Model)', labels.join('|') === 'Thiết bị|Hãng|Quy trình|Checklist', labels);
    check('POS ABC Ship mới mở Tạo DB trước', $('.chk-head').textContent.startsWith('Tạo DB trắng cho máy mới'), $('.chk-head').textContent);
    clickText('#picker', 'Setup POS');
    await settle();
    check('chọn checklist Setup POS', $('.chk-head').textContent.startsWith('Setup POS ABC'));
    check('POS không có dòng Model', !$('#outBody').textContent.includes('Model:'), $('#outBody').textContent.slice(0, 40));

    clickText('#picker', 'Terminal');
    await settle();
    check('Terminal → Valor, có cấp Model', pressed().join('|') === 'Setup / Training|Terminal|Valor (VL)|VL100|Ship mới', pressed());
    check('Valor Ship mới = Training', $('.chk-head').textContent.startsWith('Setup Training tiệm mới'));

    clickText('#picker', 'PAX');
    clickText('#picker', 'A920 Pro');
    await settle();
    $('.ci[data-id="pax-qc"] [data-role=done]').click();
    await settle();
    check('PAX: dòng Model dưới Phone', $('#outBody').textContent.startsWith('Phone: 0901\nModel: A920 Pro\n\nCần setup:\n- [x] Check QC note'), $('#outBody').textContent.slice(0, 80));
    check('thiếu ảnh => khóa copy', $('#copyBody').disabled && $('#warn').textContent.startsWith('Còn 6 mục'), $('#warn').textContent);
    key(document, { key: '2', altKey: true });
    check('Alt+2 khi khóa => báo lý do', String(alerts[alerts.length - 1]).startsWith('Còn 6 mục'), alerts);

    // Dán ảnh vào mục Check MID
    const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), c => c.charCodeAt(0));
    const zone = $('.pzone[data-img-key="chk:pax-mid"]');
    zone.focus();
    const data = new DataTransfer();
    data.items.add(new File([png], 'a.png', { type: 'image/png' }));
    zone.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
    await until(() => $$('.pzone[data-img-key="chk:pax-mid"] .thumb').length === 1);
    await settle();
    check('dán ảnh: thumbnail + tự tick + tiến độ', $$('.pzone[data-img-key="chk:pax-mid"] .thumb').length === 1 &&
      $('.ci[data-id="pax-mid"] [data-role=done]').checked && $('.chk-head .status').textContent.startsWith('1/6'),
      $('.chk-head .status').textContent);
    check('khối Ảnh trong Kết quả', !$('#imgPanel').hidden && imageLabels().includes('Cần setup – Check MID'), $('#imgList').textContent);

    const zip = await captureDownload($('#imgZip'));
    check('Tải tất cả (ZIP): 1 file .zip, bắt đầu bằng PK, nút báo đã tải',
      zip.names.length === 1 && zip.names[0].endsWith('.zip') && zip.bytes[0] === 0x50 && zip.bytes[1] === 0x4b &&
      zip.label === 'Đã tải ✓', { names: zip.names, size: zip.bytes.length, label: zip.label });
    const pdf = await captureDownload($('#imgPdf'));
    const pdfText = new TextDecoder('latin1').decode(pdf.bytes);
    check('Tải PDF: 1 file .pdf, 1 trang cho 1 ảnh, nút báo đã tải',
      pdf.names.length === 1 && pdf.names[0].endsWith('.pdf') && pdfText.startsWith('%PDF-1.4') && pdfText.endsWith('%%EOF\n') &&
      pdfText.includes('/Count 1 ') && pdf.label === 'Đã tải ✓', { names: pdf.names, size: pdf.bytes.length, label: pdf.label });

    // Chụp màn hình: headless không có màn hình thật => giả hộp thoại chọn màn hình bằng luồng từ canvas
    const fakeScreen = document.createElement('canvas');
    fakeScreen.width = 40;
    fakeScreen.height = 30;
    const repaint = setInterval(() => fakeScreen.getContext('2d').fillRect(0, 0, 40, 30), 50);
    const picked = [];
    let cancelPicker = false;
    Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', { value: async () => {
      if (cancelPicker) throw new DOMException('hủy', 'NotAllowedError');
      picked.push(fakeScreen.captureStream());
      return picked[picked.length - 1];
    } });
    const midThumbs = () => $$('.pzone[data-img-key="chk:pax-mid"] .thumb').length;
    const shotOf = (k) => $(`.ci[data-id="${k}"] .shot button`);
    check('mọi ô dán ảnh có nút chụp màn hình, mặc định màn hình kia', $$('.shot').length === $$('.pzone').length &&
      $$('.shot button:first-child').every(b => b.textContent === 'Chụp màn hình kia'), $$('.shot').length);
    shotOf('pax-mid').click();
    await until(() => midThumbs() === 2);
    shotOf('pax-mid').click();
    await until(() => midThumbs() === 3);
    check('chụp: lần đầu chọn màn hình, lần sau chụp ngay, ảnh vào mục', midThumbs() === 3 && picked.length === 1, { thumbs: midThumbs(), picked: picked.length });
    $('.ci[data-id="pax-mid"] .shot-switch').click();
    check('⇄ đổi mọi nút sang màn hình này', $$('.shot button:first-child').every(b => b.textContent === 'Chụp màn hình này'));
    shotOf('pax-mid').click();
    await until(() => midThumbs() === 4);
    check('màn hình này: chọn riêng 1 lần', midThumbs() === 4 && picked.length === 2, { thumbs: midThumbs(), picked: picked.length });
    $('.ci[data-id="pax-mid"] .shot-switch').click();
    picked[0].getTracks().forEach(t => t.stop());   // như bấm "Dừng chia sẻ" của Chrome
    cancelPicker = true;
    shotOf('pax-mid').click();
    await until(() => shotOf('pax-mid').textContent === 'Chưa chụp được màn hình', 5000);
    check('dừng chia sẻ rồi hủy hộp thoại => báo lỗi, không thêm ảnh', midThumbs() === 4 && shotOf('pax-mid').textContent === 'Chưa chụp được màn hình',
      shotOf('pax-mid').textContent);
    clearInterval(repaint);
    picked.forEach(s => s.getTracks().forEach(t => t.stop()));

    $('.chk-group [data-gna]').click();
    await settle();
    check('N/A cả nhóm => mở copy', !$('#copyBody').disabled && $('#outBody').textContent.includes('- [N/A] Check MID'), $('#warn').textContent);

    // Nhánh chưa có checklist
    clickText('#picker', 'Clover');
    clickText('#picker', 'Replace');
    await settle();
    check('Clover Replace: báo chưa có checklist', $('.empty-state h3').textContent === 'Chưa có checklist cho Terminal · Clover · Clover Flex · Replace', $('#form').textContent);
    check('nhánh rỗng: không copy', $('#copyBody').disabled && $('#copyTitle').disabled);

    // Template
    clickText('#picker', 'Viết ticket');
    await settle();
    $('#tplSave').click();
    const savedTemplates = JSON.parse(localStorage.getItem('ticketWriter.templates.v1') || '[]');
    check('lưu template', savedTemplates.length === 1 && savedTemplates[0].type === 'incident', alerts);
    $('#tplOpen').click();
    check('mở hộp template', $('#tplDlg').open && $('#tplList').textContent.includes('CLOVER - INTERNET - MẤT KẾT NỐI'), $('#tplList').textContent);
    $('#tplDlg').close();

    // Chế độ xem
    clickText('#modeSeg', 'Kết quả');
    check('chế độ Kết quả', $('#main').dataset.mode === 'output');
    clickText('#modeSeg', 'Chia đôi');

    // Lưu state
    const saved = JSON.parse(localStorage.getItem('ticketWriter.v1'));
    check('state lưu type + nav', saved.type === 'incident' && saved.nav.group === 'ticket' && saved.ticket.phone === '0901', saved.type);

    // Ticket mới
    $('#resetBtn').click();
    await settle();
    check('Ticket mới xóa nội dung', $('#outBody').textContent === '' && $('#f_phone').value === '');
    check('Ticket mới: con trỏ ở ô Loại', focused() === 'f_category', focused());

    // SMS Promotion: khối tùy chọn trong Hỗ trợ merchant
    const copyAndGet = async (selector) => {
      const before = copiedTexts.length;
      $(selector).click();
      await until(() => copiedTexts.length > before, 5000);
      return copiedTexts[copiedTexts.length - 1];
    };
    check('SMS: chưa tick => ẩn ô SMS, không có khối SMS ở Kết quả', !$('#sms_enabled').checked && $('.sms-fields').hidden && $('#smsBlock').hidden);
    check('SMS: khối có màu riêng', getComputedStyle($('.sms-box')).backgroundColor !== getComputedStyle($('.sec')).backgroundColor);
    type($('#f_summary'), 'đổi giá');
    type($('textarea[data-key="s1"]'), 'Merchant cần đổi giá');
    await settle();
    const plainTicket = [$('#outTitle').textContent, $('#outBody').textContent];
    const plainFill = await copyAndGet('#copyFill');
    $('#sms_enabled').focus();
    $('#sms_enabled').click();
    await settle();
    check('SMS: tick => mở ô SMS + khối SMS ở Kết quả, con trỏ giữ nguyên', !$('.sms-fields').hidden && !$('#smsBlock').hidden && focused() === 'sms_enabled', focused());
    check('SMS: khối ở khu Kết quả, sau Nội dung', !!$('#outPane #smsBlock') && !!($('#outBody').compareDocumentPosition($('#smsBlock')) & Node.DOCUMENT_POSITION_FOLLOWING));
    type($('#sms_shop'), 'ARIA NAIL BAR');
    await settle();
    check('SMS thiếu trường => cảnh báo riêng + khóa Copy SMS, ticket vẫn copy được', $('#copySms').disabled && $('#smsWarn').textContent.startsWith('Còn thiếu: Recipients, Type Customer, Message') &&
      $('#warn').hidden && !$('#copyBody').disabled && !$('#copyFill').disabled, $('#smsWarn').textContent);
    key(document, { key: '3', altKey: true });
    check('Alt+3 khi khóa => báo lý do', String(alerts[alerts.length - 1]).startsWith('Còn thiếu: Recipients'), alerts);
    type($('#sms_recipients'), '3178');
    $('.sms-type[data-type="lastVisit"] input[type=checkbox]').click();
    $('.sms-type[data-type="visitTimes"] input[type=checkbox]').click();
    type($('.sms-type[data-type="visitTimes"] [data-param="max"]'), '5000');
    type($('#sms_message'), 'Sale 15%');
    $$('input[name="smsPrice"]').find(r => r.value === '0.06').click();
    clickText('#form', '+ Thêm option');
    await wait(50);
    type($('input[data-option="0"]'), 'Birthday in October');
    await settle();
    check('SMS: tin nhắn đúng + option tự thêm + mở copy', !$('#copySms').disabled && $('#outSms').textContent.includes(
      'Recipients: 3178 customers\nType Customer:\n- Last Visit <= 365\n- Times visit between 1 - 5000\n- Birthday in October\nMessage:\n"Sale 15%"\nPrice per SMS: $0.06\nEstimate Total: $190.68'),
      $('#outSms').textContent);
    $$('input[name="smsLang"]').find(r => r.value === 'vi').click();
    await settle();
    check('SMS: chọn Tiếng Việt => tin nhắn tiếng Việt', $('#outSms').textContent.startsWith('Chào ARIA NAIL BAR,') &&
      $('#outSms').textContent.includes('Giá mỗi SMS: $0.06\nTổng chi phí dự kiến: $190.68'), $('#outSms').textContent);
    check('SMS: Title + Nội dung ticket không đổi', $('#outTitle').textContent === plainTicket[0] && $('#outBody').textContent === plainTicket[1], $('#outBody').textContent);
    check('SMS: Copy SMS chỉ copy tin nhắn', (await copyAndGet('#copySms')) === $('#outSms').textContent);
    check('SMS: Copy để điền giống hệt khi chưa bật SMS', (await copyAndGet('#copyFill')) === plainFill);
    const smsZone = $('.pzone[data-img-key="sms:customerTypes"]');
    smsZone.focus();
    const smsData = new DataTransfer();
    smsData.items.add(new File([png], 'b.png', { type: 'image/png' }));
    smsZone.dispatchEvent(new ClipboardEvent('paste', { clipboardData: smsData, bubbles: true, cancelable: true }));
    await until(() => $$('.pzone[data-img-key="sms:customerTypes"] .thumb').length === 1);
    await settle();
    check('SMS: dán ảnh vào Type Customer + khối Ảnh', $$('.pzone[data-img-key="sms:customerTypes"] .thumb').length === 1 &&
      !$('#imgPanel').hidden && imageLabels().join('|') === 'Type Customer', $('#imgList').textContent);
    $('#resetBtn').click();
    await settle();
    check('SMS: Ticket mới xóa ticket + form SMS + ảnh SMS, bỏ tick', $('#outBody').textContent === '' && $('#sms_shop').value === '' &&
      !$('input[data-option]') && $('#imgPanel').hidden && !$('#sms_enabled').checked && $('.sms-fields').hidden && $('#smsBlock').hidden);

    // SMS Shipping
    $('#sms_enabled').click();
    type($('#sms_shop'), 'GIỮ LẠI');
    clickText('#picker', 'SMS');
    await settle();
    check('Shipping: nhóm SMS chỉ còn Shipping, ẩn Title, khóa Lưu template', pressed().join('|') === 'SMS|Shipping' && $('#titleBlock').hidden && $('#tplSave').disabled &&
      $('#smsBlock').hidden && !$$('#picker button').some(x => x.textContent === 'Promotion'), pressed());
    type($('#ship_merchant'), 'Ms Terri');
    await settle();
    check('Shipping thiếu Tracking + ngày => cảnh báo + khóa copy', $('#copyBody').disabled && $('#warn').textContent.startsWith('Còn thiếu: Tracking Number, Estimated Delivery.'), $('#warn').textContent);
    type($('#ship_tracking'), '1Z96F3E30394641579');
    check('Shipping: Estimated Delivery là ô text', $('#ship_delivery').type === 'text', $('#ship_delivery').type);
    type($('#ship_delivery'), 'November 02 , 9:30 A.M. - 12:30 P.M.');
    await settle();
    check('Shipping: tin nhắn đúng + mở copy', !$('#copyBody').disabled && $('#warn').hidden &&
      $('#outBody').textContent.startsWith('Dear Ms Terri,\n\nWe wanted to inform you') && $('#outBody').textContent.includes('\n\nTracking Number: 1Z96F3E30394641579\nEstimated Delivery: November 02 , 9:30 A.M. - 12:30 P.M.\n\nImportant:'),
      $('#outBody').textContent);
    $('#resetBtn').click();
    await settle();
    check('Shipping: Ticket mới chỉ xóa form Shipping', $('#outBody').textContent === '' && $('#ship_merchant').value === '' && $('#ship_delivery').value === '', $('#outBody').textContent);
    clickText('#picker', 'Viết ticket');
    await settle();
    check('về Viết ticket: hiện lại Title, mở Lưu template', !$('#titleBlock').hidden && !$('#tplSave').disabled);
    check('Shipping: form SMS Promotion vẫn giữ', $('#sms_shop').value === 'GIỮ LẠI' && !$('.sms-fields').hidden && !$('#smsBlock').hidden, $('#sms_shop').value);
    clickText('#picker', 'Chuyển CS/MKT');
    await settle();
    check('Chuyển CS/MKT: không có khối SMS', !$('.sms-box') && $('#smsBlock').hidden);
  } catch (error) {
    log.push('FAIL exception :: ' + error.stack);
  }
  const port = new URLSearchParams(location.search).get('port');   // smoke_ui.py đang chờ kết quả ở cổng này
  await fetch(`http://127.0.0.1:${port}/result`, {
    method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ log, errors: window.__smokeErrors })
  });
})();
