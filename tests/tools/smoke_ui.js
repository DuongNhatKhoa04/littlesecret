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
    check('mặc định ở tab Hỗ trợ merchant (1 hàng tab, không còn nút nhóm Viết ticket / SMS)', pressed().join('|') === 'Hỗ trợ merchant' && !$$('#picker button').some(x => x.textContent === 'Viết ticket' || x.textContent === 'SMS'), pressed());
    $('#moreBtn').click();
    const menuOpened = $('#moreMenu').matches(':popover-open');
    $('#moreMenu').hidePopover();
    check('menu Khác: mở được, có Lưu ticket ra file / Sao lưu / Đổi bên + version; credit dưới tên app',
      menuOpened && ['offSave', 'offOpen', 'backupSave', 'backupOpen', 'tplSave', 'swapBtn', 'ver'].every(id => $('#moreMenu').contains($('#' + id))) &&
      $('#ver').textContent.startsWith('v20') && $('.brand .credit').textContent === 'Developed by Ryan', [menuOpened, $('#ver').textContent]);
    await wait(50);
    check('mở trang: con trỏ ở ô Loại', focused() === 'f_category', focused());
    check('ô dán ảnh không nhận Tab', $$('.pzone').length > 0 && $$('.pzone').every(z => z.tabIndex === -1));
    const estimate = await navigator.storage.estimate();
    check('đọc được dung lượng trình duyệt trên file://', estimate.quota > 0, JSON.stringify(estimate));
    check('nút nhận ảnh iOS: tạm ẩn (phoneUpload.hidden)', $('#phoneBtn').hidden);
    check('ô Tóm tắt: có danh sách gợi ý', $('#f_summary').getAttribute('aria-controls') === 'f_summaryHistory' && $('#f_summaryHistory').hidden);
    check('bình thường: không có thanh cảnh báo', $('#notices').hidden, $('#notices').textContent);
    const bg = () => getComputedStyle(document.body).backgroundColor;
    const themeOf = () => [document.documentElement.dataset.theme || 'auto', $('#themeBtn').textContent];
    check('giao diện mặc định: Tự động', themeOf().join('|') === 'auto|Tự động', themeOf());
    $('#themeBtn').click();
    const lightBg = bg();
    check('bấm giao diện => Sáng', themeOf().join('|') === 'light|Sáng', themeOf());
    $('#themeBtn').click();
    check('bấm giao diện => Tối, đổi màu nền', themeOf().join('|') === 'dark|Tối' && bg() !== lightBg, [themeOf(), lightBg, bg()]);
    $('#themeBtn').click();
    check('bấm giao diện => về Tự động', themeOf()[0] === 'auto', themeOf());
    const paletteOf = () => [document.documentElement.dataset.palette || 'default', $$('#paletteSeg [aria-pressed="true"]').map(node => node.getAttribute('aria-label')).join(), $('#paletteName').textContent];
    const defaultBg = bg();
    check('màu giao diện mặc định: Tím (không gắn data-palette), menu Khác có ô tròn Tím / Hồng, dòng Đã chọn: Tím',
      paletteOf().join('|') === 'default|Tím|Tím' && $$('#paletteSeg .swatch').map(node => node.title).join() === 'Tím,Hồng', paletteOf());
    $('#moreMenu').showPopover();
    $('#paletteSeg [data-palette="pink"]').click();
    check('bấm ô tròn Hồng: menu Khác vẫn mở để so màu', $('#moreMenu').matches(':popover-open'));
    $('#moreMenu').hidePopover();
    check('chọn Hồng => data-palette="pink", Đã chọn: Hồng, đổi màu nền, lưu trên máy', paletteOf().join('|') === 'pink|Hồng|Hồng' && bg() !== defaultBg &&
      localStorage.getItem('ticketWriter.palette.v1') === '"pink"', [paletteOf(), bg(), localStorage.getItem('ticketWriter.palette.v1')]);
    $('#paletteSeg [data-palette="castorice"]').click();
    check('chọn lại Tím => bỏ data-palette, nền như cũ', paletteOf().join('|') === 'default|Tím|Tím' && bg() === defaultBg, [paletteOf(), bg()]);
    type($('#f_summary'), 'mất kết nối');
    $('#f_summary').focus();
    key($('#f_summary'), { key: 'Enter' });
    check('Enter ở Tóm tắt => sang Phone', focused() === 'f_phone', focused());
    $('#f_summary').dispatchEvent(new Event('change'));   // rời ô => lưu gợi ý
    $('#f_summary').focus();
    type($('#f_summary'), 'mat');
    const suggestions = () => $$('#f_summaryHistory .combo-opt span').map(s => s.textContent);
    check('gợi ý Tóm tắt: gõ không dấu vẫn ra, lưu IN HOA', !$('#f_summaryHistory').hidden && suggestions().join('|') === 'MẤT KẾT NỐI', suggestions());
    key($('#f_summary'), { key: 'ArrowDown' });
    key($('#f_summary'), { key: 'Enter' });
    check('gợi ý Tóm tắt: ↓ + Enter chọn gợi ý, ở lại ô', $('#f_summary').value === 'MẤT KẾT NỐI' && $('#f_summaryHistory').hidden && focused() === 'f_summary',
      [$('#f_summary').value, focused()]);
    type($('#f_summary'), 'm');
    $('#f_summaryHistory .combo-del').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    check('gợi ý Tóm tắt: × xóa gợi ý, ô giữ chữ đang gõ', $('#f_summaryHistory').hidden && $('#f_summary').value === 'm' &&
      !JSON.parse(localStorage.getItem('ticketWriter.summaries.v1')).length, localStorage.getItem('ticketWriter.summaries.v1'));
    type($('#f_summary'), 'mất kết nối');
    type($('#f_phone'), '09a01');
    check('Phone: chỉ nhận số, tự format', $('#f_phone').value === '(090) 1', $('#f_phone').value);
    key($('#f_phone'), { key: 'Enter' });
    check('Enter ở Phone => sang Tên merchant', focused() === 'f_merchant', focused());
    type($('#f_merchant'), 'Mr. Vương');
    key($('#f_merchant'), { key: 'Enter' });
    check('Enter ở Tên merchant => sang ý đầu Vấn đề (bỏ qua nút phụ)', focused() === 's1', focused());
    const roleButton = () => $$('.contact-row .seg button').find(node => node.textContent === 'Owner');
    roleButton().click();
    await settle();
    const withRole = $('#outBody').textContent;
    roleButton().click();
    await settle();
    check('Vai trò tại tiệm cùng hàng Phone: chọn => "Phone: … - Mr. Vương - Owner", bấm lại => bỏ',
      withRole.includes(' - Mr. Vương - Owner') && !$('#outBody').textContent.includes('Owner') && !!$('.contact-row #f_merchant'), withRole);
    type($('textarea[data-key="s1"]'), 'terminal lỗi');
    await settle();
    check('title', $('#outTitle').textContent === 'MẤT KẾT NỐI', $('#outTitle').textContent);
    check('nội dung + viết hoa đầu dòng, mặc định Resolved (không in Kết luận)', $('#outBody').textContent === 'Phone: (090) 1 - Mr. Vương\n\nVấn đề:\n- Terminal lỗi', $('#outBody').textContent);
    check('Resolved bước đầu copy được', !$('#copyBody').disabled);

    $('textarea[data-key="s1"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await wait(50);
    check('Enter tạo ý mới + focus', $$('textarea[data-key="s1"]').length === 2 && document.activeElement.dataset.i === '1');

    check('Kết luận chỉ có Resolved / Pending - Needs to follow up', $$('input[name="conclusion"]').map(r => r.value).join('|') === 'Resolved|Pending - Needs to follow up');
    type($('textarea[data-key="s2"]'), 'restart');
    $$('input[name="conclusion"]').find(r => r.value === 'Resolved').click();
    await settle();
    check('Resolved: không có Nguyên nhân / Kết quả, ẩn Việc cần làm tiếp, không in dòng Kết luận, copy được', !$('#copyBody').disabled && $('#warn').hidden &&
      !$('textarea[data-key="s3"]') && !$('textarea[data-key="s4"]') && !$('[data-action-box]').checkVisibility() &&
      $('#outBody').textContent.endsWith('Đã support:\n- Restart'), $('#outBody').textContent);
    $$('input[name="conclusion"]').find(r => r.value === 'Pending - Needs to follow up').click();
    await settle();
    check('Pending: hiện Việc cần làm tiếp, chưa điền vẫn copy được, không nhãn Bắt buộc', !$('#copyBody').disabled && $('#warn').hidden &&
      $('[data-action-box]').checkVisibility() && !$('[data-req-badge]').checkVisibility() &&
      $('#outBody').textContent.endsWith('Đã support:\n- Restart\n\nKết luận: Pending - Needs to follow up'), $('#outBody').textContent);
    type($('textarea[data-key="s5"]'), 'gọi lại check');
    await settle();
    check('Việc cần làm tiếp in sau Kết luận', $('#outBody').textContent.endsWith('Kết luận: Pending - Needs to follow up\n\nViệc cần làm tiếp:\n- Gọi lại check'), $('#outBody').textContent);
    $$('input[name="conclusion"]').find(r => r.value === 'Resolved').click();
    await settle();
    check('đổi lại Resolved: ẩn + không in Việc cần làm tiếp, chữ đã nhập vẫn giữ', !$('[data-action-box]').checkVisibility() &&
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
    await settle();
    check('Loại: Enter chọn 1 loại, con trỏ tự sang Tóm tắt', $('#outTitle').textContent === 'CLOVER - MẤT KẾT NỐI' && focused() === 'f_summary',
      [$('#outTitle').textContent, focused()]);
    cat.focus();
    type(cat, 'internet');
    key(cat, { key: 'Tab' });
    await settle();
    check('Loại: chọn loại khác (Tab khi gõ dở) => thay loại cũ, sang Tóm tắt',
      $('#outTitle').textContent === 'INTERNET - MẤT KẾT NỐI' && $$('.chip').length === 1 && cat.value === '' && focused() === 'f_summary',
      [$('#outTitle').textContent, $$('.chip').length, focused()]);

    // Chuyển case: form + tin nhắn group riêng, ticket đang nhập vẫn giữ
    clickText('#picker', 'Chuyển case');
    await settle();
    check('Chuyển case: form riêng, ẩn Title, khóa Lưu template, chưa nhập => rỗng', !$('#f_summary') && $('#titleBlock').hidden && $('#tplSave').disabled && $('#outBody').textContent === '',
      $('#outBody').textContent);
    check('Chuyển case: mặc định team Tech', !!$('#pass_lead') && !$('#pass_zip'), [!!$('#pass_lead'), !!$('#pass_zip')]);
    clickText('#form', 'Sales');
    await settle();
    type($('#pass_shop'), 'ARIA NAIL BAR');
    await settle();
    check('Chuyển case Sales: thiếu trường bắt buộc => khóa Copy, báo thiếu', $('#copyBody').disabled && $('#warn').textContent.includes('CBN, ZIP Code'),
      $('#warn').textContent);
    type($('#pass_zip'), '75001');
    type($('#pass_phone'), '5551234567');
    clickText('#form', 'Owner');
    await settle();
    check('Chuyển case Sales: đủ => mở Copy, Phone tự format, cuối tin Many thanks team! + tag Sales',
      !$('#copyBody').disabled &&
      $('#outBody').textContent === 'LEAD: ARIA NAIL BAR – 75001\nCBN: (555) 123-4567 – Owner\nMany thanks team!\n@daisy_sale_leader @Kyo_SaleAdmin @Stella_SalesAdmin',
      $('#outBody').textContent);
    check('Chuyển case: nút Lưu offline và Mở file offline bị khóa', $('#offSave').disabled && $('#offOpen').disabled);
    clickText('#form', 'MKT');
    await settle();
    check('Chuyển case MKT: Issue có ô dán ảnh + Thêm ảnh + Chụp màn hình, MKT bắt buộc cả Tên người liên hệ',
      !!$('[data-img-key="pass:issue"] .pzone') && !!$('[data-img-key="pass:issue"] .shot') && $('#warn').textContent.includes('Tên người liên hệ'),
      $('#warn').textContent);
    const rowIds = $$('.pass-row').map(row => [...row.querySelectorAll('[id^="pass_"]')].map(node => node.id).join('+'));
    check('Chuyển case MKT: GẤP ngay dưới Issue; CBN + Tên + Vai trò là hàng đầu, Tên tiệm + ZIP chung 1 hàng',
      !!$('#pass_issue + .pass-urgent') && rowIds.join(' | ') === 'pass_phone+pass_contact | pass_shop+pass_zip' && $$('.pass-row')[0].querySelector('.seg') !== null &&
      $('#pass_phone').compareDocumentPosition($('#pass_lead')) === Node.DOCUMENT_POSITION_FOLLOWING, rowIds.join(' | '));
    clickText('#form', 'Tech');
    await settle();
    check('Chuyển case Tech: có ô GẤP dưới Issue + lưu ý, giữ Phone đã nhập', !!$('#pass_issue + .pass-urgent') && !!$('.pass-tips') && $('#pass_phone').value === '(555) 123-4567');
    type($('#pass_contact'), 'nguyễn văn an');
    type($('#pass_issue'), 'terminal lỗi\nmất mạng');
    check('Chuyển case: Tên người liên hệ viết hoa chữ đầu mỗi từ, Issue viết hoa đầu dòng',
      $('#pass_contact').value === 'Nguyễn Văn An' && $('#pass_issue').value === 'Terminal lỗi\nMất mạng', [$('#pass_contact').value, $('#pass_issue').value]);
    type($('#pass_contact'), '');
    type($('#pass_issue'), '');
    $('.pass-urgent input').click();
    await settle();
    check('Chuyển case Tech: tick GẤP => 🔥🔥🔥 URGENT!! trước Tên tiệm, thiếu trường vẫn khóa Copy',
      $('#outBody').textContent.startsWith('🔥🔥🔥 URGENT!!\nARIA NAIL BAR\nCBN: (555) 123-4567 - Owner') && $('#copyBody').disabled && !$('#pass_urgentNote'),
      $('#outBody').textContent);
    type($('#pass_tagAdd'), 'support moi');
    $('.pass-tag-add button').click();
    await settle();
    [...document.querySelectorAll('.pass-tag input')][0].click();
    await settle();
    const techTagLine = $('#outBody').textContent.split('\n').pop();
    check('Chuyển case: thêm tag tay (tự thêm @, _), bỏ tick người đầu => không tag người đó, focus lại ô thêm',
      techTagLine.endsWith('@support_moi') && !techTagLine.includes($('.pass-tag span').textContent) && document.activeElement === $('#pass_tagAdd'), techTagLine);
    $('#resetBtn').click();
    await settle();
    check('Chuyển case: Ticket mới chỉ xóa form Chuyển case, về team đầu', $('#outBody').textContent === '' && $('#pass_shop').value === '');
    clickText('#form', 'Tech');
    await settle();
    const chipNames = () => $$('.pass-tag span').map(node => node.textContent);
    check('Chuyển case: Ticket mới bỏ người support thêm tay, giữ người chính và ô tick',
      !chipNames().includes('@support_moi') && chipNames().length > 0 && !$$('.pass-tag input')[0].checked, chipNames());
    $('#pass_tagAdd').focus();
    type($('#pass_tagAdd'), 'supp');
    const tagSuggestions = $$('#pass_tagHistory .combo-opt span').map(node => node.textContent);
    key($('#pass_tagAdd'), { key: 'ArrowDown' });
    key($('#pass_tagAdd'), { key: 'Enter' });
    await settle();
    check('Chuyển case: gõ ô Thêm tag (thiếu @) ra gợi ý tên đã thêm, ↓ + Enter thêm lại',
      tagSuggestions.join('|') === '@support_moi' && chipNames().filter(name => name === '@support_moi').length === 1, [tagSuggestions, chipNames()]);
    $('.pass-tag button').click();
    $$('.pass-tag input')[0].click();
    await settle();
    clickText('#form', 'MKT');
    await settle();
    // Ctrl+V chữ do bookmark "Lấy thông tin tiệm" copy (đọc clipboard thật thì headless bị chặn): điền form, không dán thô vào ô
    const shopData = new DataTransfer();
    shopData.setData('text/plain', JSON.stringify({ app: 'ticket-writer-shop', lead: 'https://portal/lead/1', shop: 'SMOKE NAILS', mid: '123', zip: '75001' }));
    $('#pass_contact').dispatchEvent(new ClipboardEvent('paste', { clipboardData: shopData, bubbles: true, cancelable: true }));
    await settle();
    check('Chuyển case: có nút Dán thông tin tiệm; Ctrl+V chữ của bookmark => điền Link Lead, Tên tiệm, MID, ZIP',
      !!$$('.pass-shop button').find(node => node.textContent === 'Dán thông tin tiệm') && $('#pass_shop').value === 'SMOKE NAILS' && $('#pass_zip').value === '75001' &&
      $('#pass_contact').value === '' && $('#outBody').textContent.startsWith('https://portal/lead/1\nSMOKE NAILS'), $('#outBody').textContent);
    const bodyData = new DataTransfer();
    bodyData.setData('text/plain', JSON.stringify({ app: 'ticket-writer-shop', shop: 'BODY NAILS' }));
    document.activeElement.blur();
    document.body.dispatchEvent(new ClipboardEvent('paste', { clipboardData: bodyData, bubbles: true, cancelable: true }));
    await settle();
    check('Chuyển case: Ctrl+V không đứng trong ô nào cũng điền (không cần quyền clipboard); cạnh nút có gợi ý Ctrl+V',
      $('#pass_shop').value === 'BODY NAILS' && $('#pass_zip').value === '75001' && $('#pass_shopStatus').textContent.startsWith('Đã điền: Tên tiệm'),
      [$('#pass_shop').value, $('#pass_shopStatus').textContent]);
    clickText('#form', 'CS');
    await settle();
    const ticketData = new DataTransfer();
    ticketData.setData('text/plain', JSON.stringify({ app: 'ticket-writer-shop', ticket: 'https://portal/v2/helpdesk/ticket/9#', shop: 'TICKET NAILS', mid: '4966', issue: 'PAX - SUCCESS' }));
    document.body.dispatchEvent(new ClipboardEvent('paste', { clipboardData: ticketData, bubbles: true, cancelable: true }));
    await settle();
    check('Chuyển case CS: Ctrl+V chữ bookmark lấy trên trang ticket => điền Link Ticket, Tên tiệm, MID, Issue; không còn ô tick Assign',
      $('#pass_ticket').value === 'https://portal/v2/helpdesk/ticket/9#' && $('#pass_issue').value === 'PAX - SUCCESS' && !$('#pass_assign') &&
      $('#outBody').textContent.startsWith('https://portal/v2/helpdesk/ticket/9#\nTICKET NAILS 75001\nMID: 4966'), $('#outBody').textContent);
    // Gửi Telegram: chỉ mở hộp xem trước, không gửi thật (smoke không gọi mạng)
    check('Chuyển case: có nút Gửi Telegram, khóa khi tin chưa đủ trường bắt buộc', !$('#sendTg').hidden && $('#sendTg').disabled === $('#copyBody').disabled);
    $('#sendTg').disabled = false;
    $('#sendTg').click();
    check('Gửi Telegram: hộp xem trước có group CS, chưa có token => hiện ô token, khóa Gửi',
      $('#tgDlg').open && $('#tgTitle').textContent === 'Gửi vào group CS' && !$('#tgTokenRow').hidden && $('#tgSend').disabled, [$('#tgTitle').textContent, $('#tgProblem').textContent]);
    $('#tgClose').click();
    key($('#pass_issue'), { key: 'g', altKey: true });   // đang gõ trong ô vẫn mở được
    check('Alt+G = Gửi Telegram: mở hộp xem trước, không gửi thẳng', $('#tgDlg').open && $('#tgTitle').textContent === 'Gửi vào group CS');
    $('#tgClose').click();
    $('#resetBtn').click();
    await settle();
    clickText('#picker', 'Hỗ trợ merchant');
    await settle();
    check('về Hỗ trợ merchant: ticket, ô Loại + Loại đã chọn vẫn giữ, con trỏ ở ô Loại',
      focused() === 'f_category' && $('#outTitle').textContent === 'INTERNET - MẤT KẾT NỐI' && $('#outBody').textContent.includes('Terminal lỗi'),
      [focused(), $('#outTitle').textContent]);
    const ticketPhone = $('#f_phone').value;
    $('.pass-jump button').click();
    await settle();
    check('nút Chuyển case CS ở ticket: sang Chuyển case team CS, mang Phone + Tên merchant',
      !!$('#pass_ticket') && $('#pass_phone').value === ticketPhone && $('#pass_contact').value === 'Mr. Vương' && ticketPhone !== '' &&
      $('#outBody').textContent.includes('CBN: ' + ticketPhone + ' - Mr. Vương'), [$('#pass_phone') && $('#pass_phone').value, ticketPhone]);
    key($('#pass_phone'), { key: 'n', altKey: true });   // Ticket mới bằng phím, đang đứng trong ô nhập
    await settle();
    check('Alt+N = Ticket mới (đang gõ trong ô vẫn chạy): xóa form Chuyển case, con trỏ vào ô nhập đầu tiên',
      $('#pass_phone').value === '' && $('#outBody').textContent === '' && /^pass_/.test(focused()), [$('#pass_phone').value, focused()]);
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
    check('PAX: dòng Model dưới Phone', $('#outBody').textContent.startsWith('Phone: (090) 1 - Mr. Vương\nModel: A920 Pro\n\nCần setup:\n- [x] Check QC note'), $('#outBody').textContent.slice(0, 80));
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

    // Kéo thumbnail đổi thứ tự: dán thêm 1 ảnh khác, kéo nó lên đầu, rồi xóa để các bước sau vẫn chỉ có 1 ảnh
    const reorderThumbs = () => $$('.pzone[data-img-key="chk:pax-mid"] .thumb');
    const other = document.createElement('canvas');
    other.width = other.height = 2;
    other.getContext('2d').fillRect(0, 0, 1, 1);
    const otherData = new DataTransfer();
    otherData.items.add(new File([await new Promise(r => other.toBlob(r, 'image/png'))], 'b.png', { type: 'image/png' }));
    zone.dispatchEvent(new ClipboardEvent('paste', { clipboardData: otherData, bubbles: true, cancelable: true }));
    await until(() => reorderThumbs().length === 2);
    const reorderSrcs = () => reorderThumbs().map(t => t.querySelector('img').src);
    const [firstSrc, secondSrc] = reorderSrcs();
    const drag = new DataTransfer();
    reorderThumbs()[1].dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: drag }));
    reorderThumbs()[0].dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: drag }));
    reorderThumbs()[0].dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: drag }));
    await settle();
    check('kéo thumbnail đổi thứ tự ảnh trong mục', reorderSrcs()[0] === secondSrc && reorderSrcs()[1] === firstSrc && reorderThumbs().length === 2, reorderSrcs().length);
    // Kéo sang mục khác (Note): thả vào ô trống => thêm cuối mục đó; rồi kéo lên ảnh của mục cũ => về đúng vị trí đầu
    const noteZone = $('.pzone[data-img-key="s6"]');
    const dragTo = (thumb, target) => {
      const data = new DataTransfer();
      thumb.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: data }));
      target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }));
      target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }));
      thumb.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: data }));
    };
    const noteThumbs = () => [...noteZone.querySelectorAll('.thumb')];   // $$ của script này luôn tìm trên cả trang
    const noteSrcs = () => noteThumbs().map(t => t.querySelector('img').src);
    const noteBefore = noteSrcs().length;   // các bước trước có thể đã dán ảnh vào Note
    dragTo(reorderThumbs()[0], noteZone);
    await settle();
    check('kéo ảnh sang mục khác (thả vào ô ảnh) => thêm cuối mục đó, mục cũ bớt 1',
      reorderThumbs().length === 1 && noteSrcs().length === noteBefore + 1 && noteSrcs()[noteBefore] === secondSrc && !noteZone.classList.contains('drop-target'),
      { from: reorderThumbs().length, to: noteSrcs().length, noteBefore });
    dragTo(noteThumbs()[noteBefore], reorderThumbs()[0]);
    await settle();
    check('kéo ảnh về mục cũ (thả lên 1 ảnh) => chèn đúng vị trí đó', noteSrcs().length === noteBefore && reorderSrcs()[0] === secondSrc && reorderSrcs()[1] === firstSrc);
    reorderThumbs()[0].querySelector('button').click();
    await settle();
    check('xóa ảnh vừa thêm: còn đúng ảnh ban đầu', reorderThumbs().length === 1 && reorderSrcs()[0] === firstSrc);

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
    check('⇄ đổi mọi nút sang màn hình này', $$('.shot button:first-child').every(b => b.textContent === 'Chụp màn hình này sau 3s'));
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

    // Lưu offline: chỉ 1 file ZIP (JSON + ảnh + PDF cùng tên bên trong), rồi Ticket mới và mở lại chính file ZIP đó
    const offBody = $('#outBody').textContent;
    const offNames = [];
    const offBlobs = {};
    const realAnchorClick = HTMLAnchorElement.prototype.click;
    const realObjectUrl = URL.createObjectURL;
    let lastBlob = null;
    URL.createObjectURL = (blob) => { lastBlob = blob; return realObjectUrl.call(URL, blob); };
    HTMLAnchorElement.prototype.click = function () { offNames.push(this.download); offBlobs[this.download] = lastBlob; };
    $('#offSave').click();
    check('Lưu offline: hỏi zipcode + ticket type + tier (0.5 – 3), có ảnh thì hiện ô PDF', $('#offSaveDlg').open && !$('#offPdfRow').hidden &&
      $$('#offTier option').map(o => o.value).join(' ') === ' 0.5 1 1.5 2 2.5 3' && $('#offTier').required, $$('#offTier option').map(o => o.value));
    type($('#offZip'), '02134');
    type($('#offType'), 'Setup');
    $('#offTier').value = '1.5';
    $('#offPdf').checked = true;
    $('#offSaveOk').click();
    await until(() => !$('#offSaveDlg').open, 10000);
    await wait(1000);   // đợi thêm: nếu có file thứ 2 thì Chrome thật sẽ chặn
    HTMLAnchorElement.prototype.click = realAnchorClick;
    URL.createObjectURL = realObjectUrl;
    const offBase = (offNames[0] || '').replace(/\.zip$/, '');
    const offZip = offBlobs[offNames[0]];
    const zipText = offZip ? new TextDecoder().decode(new Uint8Array(await offZip.arrayBuffer())) : '';
    check('Lưu offline: chỉ tải đúng 1 file ZIP tên OFF-…, bên trong có JSON + PDF cùng tên',
      offNames.length === 1 && /^OFF-\d{8}-\d{6} - INTERNET - MAT KET NOI$/.test(offBase) &&
      zipText.startsWith('PK') && zipText.includes(offBase + '.json') && zipText.includes(offBase + '.pdf') && zipText.includes('"zipcode": "02134"') && zipText.includes('"tier": "1.5"'), offNames);
    $('#resetBtn').click();
    await settle();
    check('Ticket mới trước khi mở file offline', !$('#outBody').textContent.includes('Check MID'), $('#outBody').textContent.slice(0, 40));
    const offFile = new DataTransfer();
    offFile.items.add(new File([offZip], offNames[0], { type: 'application/zip' }));
    $('#offImport').files = offFile.files;
    $('#offImport').dispatchEvent(new Event('change', { bubbles: true }));
    await until(() => $('#outBody').textContent === offBody, 5000);
    check('Mở file offline (.zip): về đúng nhánh PAX, nội dung giống lúc lưu, báo zipcode + ticket type + tier + file ảnh',
      $('#outBody').textContent === offBody && pressed().includes('PAX') &&
      String(alerts[alerts.length - 1]).includes('Business zipcode: 02134\nTicket type: Setup\nTier: 1.5\nẢnh + PDF: trong file ' + offBase + '.zip'),
      [pressed(), alerts[alerts.length - 1]]);

    // Nhánh chưa có checklist
    clickText('#picker', 'Clover');
    clickText('#picker', 'Replace');
    await settle();
    check('Clover Replace: báo chưa có checklist', $('.empty-state h3').textContent === 'Chưa có checklist cho Terminal · Clover · Clover Flex · Replace', $('#form').textContent);
    check('nhánh rỗng: không copy', $('#copyBody').disabled && $('#copyTitle').disabled);

    // Template
    clickText('#picker', 'Hỗ trợ merchant');
    await settle();
    $('#tplSave').click();
    const savedTemplates = JSON.parse(localStorage.getItem('ticketWriter.templates.v1') || '[]');
    check('lưu template', savedTemplates.length === 1 && savedTemplates[0].type === 'incident', alerts);
    $('#tplOpen').click();
    check('mở hộp template', $('#tplDlg').open && $('#tplList').textContent.includes('INTERNET - MẤT KẾT NỐI'), $('#tplList').textContent);
    $('#tplDlg').close();

    // Chế độ xem
    clickText('#modeSeg', 'Kết quả');
    check('chế độ Kết quả', $('#main').dataset.mode === 'output');
    clickText('#modeSeg', 'Chia đôi');

    // Lưu state
    const saved = JSON.parse(localStorage.getItem('ticketWriter.v1'));
    check('state lưu type + nav', saved.type === 'incident' && saved.nav.group === 'ticket' && saved.ticket.phone === '(090) 1' && saved.ticket.merchant === 'Mr. Vương', saved.type);

    // Xóa hết ảnh: chỉ xóa ảnh, nội dung ticket giữ nguyên
    const clearData = new DataTransfer();
    clearData.items.add(new File([png], 'c.png', { type: 'image/png' }));
    $('.pzone[data-img-key="s1"]').dispatchEvent(new ClipboardEvent('paste', { clipboardData: clearData, bubbles: true, cancelable: true }));
    await until(() => !$('#imgPanel').hidden);
    const bodyBeforeClear = $('#outBody').textContent;
    $('#imgClear').click();
    await settle();
    check('Xóa hết ảnh: hết ảnh, nội dung ticket giữ nguyên',
      $('#imgPanel').hidden && $$('.pzone .thumb').length === 0 && bodyBeforeClear !== '' && $('#outBody').textContent === bodyBeforeClear,
      [$('#imgPanel').hidden, $$('.pzone .thumb').length]);

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
    check('SMS thiếu trường => cảnh báo riêng + khóa Copy SMS, ticket vẫn copy được', $('#copySms').disabled && $('#smsWarn').textContent.startsWith('Còn thiếu: Phone tiệm, Recipients, Type Customer, Message') &&
      $('#warn').hidden && !$('#copyBody').disabled && !$('#copyFill').disabled, $('#smsWarn').textContent);
    key(document, { key: '3', altKey: true });
    check('Alt+3 khi khóa => báo lý do', String(alerts[alerts.length - 1]).startsWith('Còn thiếu: Phone tiệm'), alerts);
    type($('#sms_shopPhone'), '5551234567');
    type($('#sms_recipients'), '3178');
    $('.sms-type[data-type="lastVisit"] input[type=checkbox]').click();
    $('.sms-type[data-type="visitTimes"] input[type=checkbox]').click();
    type($('.sms-type[data-type="visitTimes"] [data-param="max"]'), '5000');
    type($('#sms_message'), 'Sale 15%\nToday only');
    $$('input[name="smsPrice"]').find(r => r.value === '0.06').click();
    clickText('#form', '+ Thêm option');
    await wait(50);
    type($('input[data-option="0"]'), 'Birthday in October');
    await settle();
    check('SMS: tin nhắn đúng + option tự thêm + mở copy', !$('#copySms').disabled && $('#outSms').textContent.includes(
      'Recipients: 3178 customers\nType Customer:\n- Last Visit <= 365\n- Times visit between 1 - 5000\n- Birthday in October\nMessage:\n"ARIA NAIL BAR (555) 123-4567. Sale 15% Today only Reply STOP To Optout."\nPrice per SMS: $0.06\nEstimate Total: $190.68') &&
      $('#outSms').textContent.startsWith('Greeting,\n'),
      $('#outSms').textContent);
    $$('input[name="smsLang"]').find(r => r.value === 'vi').click();
    await settle();
    check('SMS: chọn Tiếng Việt => tin nhắn tiếng Việt', $('#outSms').textContent.startsWith('Xin chào,') &&
      $('#outSms').textContent.includes('Giá mỗi SMS: $0.06\nTổng chi phí dự kiến: $190.68'), $('#outSms').textContent);
    const smsDetails = $('#outSms').textContent.split('\n\n')[2].split('\n').slice(0, -2).join('\n');   // Số khách nhận → hết Nội dung tin nhắn, bỏ 2 dòng giá
    check('SMS: Title không đổi, chi tiết SMS (không có giá) in vào Đã support', $('#outTitle').textContent === plainTicket[0] &&
      $('#outBody').textContent === plainTicket[1] + '\n\nĐã support:\n' + smsDetails && !$('#outBody').textContent.includes('Giá mỗi SMS'), $('#outBody').textContent);
    check('SMS: Copy Confirm SMS copy toàn bộ tin gửi tiệm', (await copyAndGet('#copyPromo')) === $('#outSms').textContent);
    const smsCopy = await copyAndGet('#copySms');
    check('SMS: Copy SMS chỉ nội dung Message, không tên tiệm / phone / Reply STOP', smsCopy === 'Sale 15% Today only', smsCopy);
    const smsFill = await copyAndGet('#copyFill');
    check('SMS: Copy để điền có chi tiết SMS', smsFill !== plainFill && smsFill.includes(smsDetails.split('\n')[0]), smsFill);
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
    clickText('#picker', 'SMS Shipping');
    await settle();
    check('Shipping: tab SMS Shipping, ẩn Title, khóa Lưu template', pressed().join('|') === 'SMS Shipping' && $('#titleBlock').hidden && $('#tplSave').disabled &&
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

    // SMS Xin review
    clickText('#picker', 'Xin review');
    await settle();
    check('Xin review: ẩn Title, khóa Lưu template, chưa nhập thì chưa báo', pressed().join('|') === 'Xin review' && $('#titleBlock').hidden && $('#tplSave').disabled &&
      $('#copyBody').disabled && $('#warn').hidden, pressed());
    const suggested = () => $$('#review_states option').map(x => x.value).join('|');
    check('Xin review: chưa gõ => gợi ý đủ 51 bang', $$('#review_states option').length === 51);
    type($('#review_state'), 'b');
    await settle();
    check('Xin review: gõ b => không gợi ý theo tên bang', suggested() === '', suggested());
    type($('#review_state'), 't');
    await settle();
    check('Xin review: gõ t => gợi ý TN, TX kèm tên bang', suggested() === 'TN|TX' && $('#review_states option').label === 'Tennessee', suggested());
    type($('#review_state'), 'ZZ');
    await settle();
    check('Xin review: bang sai => cảnh báo + khóa copy', $('#copyBody').disabled && $('#outBody').textContent === '' && $('#warn').textContent.startsWith('Còn thiếu: Bang hợp lệ'), $('#warn').textContent);
    type($('#review_state'), 'tx');
    await settle();
    check('Xin review: TX => link Arlington, hiện chi nhánh, mở copy', !$('#copyBody').disabled && $('#warn').hidden && $('#review_branch').textContent === 'Chi nhánh: Arlington' &&
      $('#outBody').textContent.startsWith('Greeting,\n\nThank you for contacting MAC USA.') && $('#outBody').textContent.includes('on Google: https://g.page/r/CSNU0_lEme3rEBM/review\n\nHave a nice day!'), $('#outBody').textContent);
    $$('input[name="reviewLang"]').find(r => r.value === 'vi').click();
    type($('#review_state'), 'LA');
    await settle();
    check('Xin review: Tiếng Việt + LA => link Houston', $('#review_branch').textContent === 'Chi nhánh: Houston' &&
      $('#outBody').textContent.startsWith('Xin chào,\n\nCảm ơn anh/chị đã liên hệ MAC USA.') && $('#outBody').textContent.includes('tại đây: https://g.page/r/CXbRhObNeE8NEBM/review\n\nChúc anh/chị một ngày tốt lành!'), $('#outBody').textContent);
    type($('#review_staff'), 'Ryan');
    await settle();
    check('Xin review: tên nhân viên lưu riêng trên máy, không vào tin nhắn',
      localStorage.getItem('ticketWriter.staff.v1') === '"Ryan"' && !$('#outBody').textContent.includes('Ryan'), localStorage.getItem('ticketWriter.staff.v1'));
    $('#resetBtn').click();
    await settle();
    check('Xin review: Ticket mới xóa form, giữ tên nhân viên', $('#outBody').textContent === '' && $('#review_state').value === '' && $('#review_branch').textContent === '' &&
      $('#review_staff').value === 'Ryan', [$('#outBody').textContent, $('#review_staff').value]);
    clickText('#picker', 'Hỗ trợ merchant');
    await settle();
    check('về Viết ticket: hiện lại Title, mở Lưu template', !$('#titleBlock').hidden && !$('#tplSave').disabled);
    check('Shipping: form SMS Promotion vẫn giữ', $('#sms_shop').value === 'GIỮ LẠI' && !$('.sms-fields').hidden && !$('#smsBlock').hidden, $('#sms_shop').value);
    clickText('#picker', 'Chuyển case');
    await settle();
    check('Chuyển case: không có khối SMS', !$('.sms-box') && $('#smsBlock').hidden);

    const backup = await captureDownload($('#backupSave'));
    const backupFile = JSON.parse(new TextDecoder().decode(backup.bytes) || '{}');
    check('Sao lưu: tải 1 file JSON có gợi ý Tóm tắt, gợi ý tag; không có ticket đang nhập, tên nhân viên, mã phone-upload',
      backup.names.length === 1 && /^ticket-writer-backup-\d{8}-\d{4}\.json$/.test(backup.names[0]) && backupFile.format === 'ticket-writer-backup' &&
      Array.isArray(backupFile.data['ticketWriter.summaries.v1']) && 'ticketWriter.passTags.v1' in backupFile.data &&
      !['ticketWriter.v1', 'ticketWriter.staff.v1', 'ticketWriter.phone.v1'].some(key => key in backupFile.data),
      [backup.names, Object.keys(backupFile.data || {})]);
    const notBackup = new DataTransfer();
    notBackup.items.add(new File(['{"format":"khac"}'], 'x.json', { type: 'application/json' }));
    $('#backupImport').files = notBackup.files;
    $('#backupImport').dispatchEvent(new Event('change'));
    await until(() => String(alerts[alerts.length - 1]).startsWith('File không phải file sao lưu'), 5000);
    check('Khôi phục: file không phải sao lưu => báo, không tải lại trang', String(alerts[alerts.length - 1]).startsWith('File không phải file sao lưu'), alerts.slice(-1));
  } catch (error) {
    log.push('FAIL exception :: ' + error.stack);
  }
  const port = new URLSearchParams(location.search).get('port');   // smoke_ui.py đang chờ kết quả ở cổng này
  await fetch(`http://127.0.0.1:${port}/result`, {
    method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ log, errors: window.__smokeErrors })
  });
})();
