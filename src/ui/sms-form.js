// src/ui/sms-form.js — Khối SMS Promotion trong form ticket: ô tick mở khối, Ngôn ngữ tin nhắn, Tên tiệm, Phone tiệm, Recipients, Type Customer (chọn nhiều, sửa số), Message, Price.
(function (TW) {
  'use strict';

  const { el, button, choiceGroup, autoGrow, isComposing, labeledField, textInput, maskPhone } = TW.ui.dom;
  const { splitTemplate, fillTemplate, IMAGE_KEY: SMS_IMAGE_KEY } = TW.domain.sms;
  const { promoSegments } = TW.domain.smsMessage;
  const { OPTION_FOCUS_KEY } = TW.application.smsService;

  const TYPES_HINT = 'Tick nhóm khách cần gửi (chọn nhiều), sửa số nếu promotion khác. Có điều kiện khác thì "+ Thêm option". ' +
    'Ảnh: click ô dán rồi Ctrl+V, hoặc kéo thả vào khối này.';
  const SEGMENT_ID = 'sms_segments';
  const OPTION_PLACEHOLDER = 'Option khác, vd Birthday in October · Enter: thêm option · Backspace ở ô trống: xóa';

  function createSmsForm({ context, session, smsService, imageZone }) {
    const { labels, customerTypes, prices, languages } = context.sms;
    let fields = null;   // phần mở ra khi tick, null khi loại đang mở không có khối SMS

    const field = (name, control, ...extra) => labeledField(labels[name], control, ...extra);

    /** options: inputMode, format (xem dom.textInput). */
    const textField = (name, options = {}) =>
      field(name, textInput({ id: 'sms_' + name, value: session.sms()[name], onInput: (value) => smsService.setField(name, value), ...options }));

    /**
     * Dòng dưới ô Message: số ký tự / segment / bảng mã của tin khách nhận; UCS-2 thì chỉ ra ký tự gây ra để FRT tự sửa nếu muốn,
     * và tô màu cảnh báo (1 ký tự như nháy cong có thể làm tin tốn gấp 2–3 segment).
     */
    function renderSegments(line = fields && fields.querySelector('#' + SEGMENT_ID)) {
      if (!line) return;
      const count = promoSegments({ sms: session.sms(), config: context.sms });
      const info = fillTemplate(labels.segmentInfo, { units: String(count.units), segments: String(count.segments), encoding: count.encoding });
      const isUcs2 = count.unsupported.length > 0;
      line.textContent = isUcs2 ? info + fillTemplate(labels.segmentUnsupported, { chars: count.unsupported.join(' ') }) : info;
      line.classList.toggle('ucs2', isUcs2);
    }

    function messageInput() {
      const textarea = el('textarea', 'text sms-message');
      Object.assign(textarea, { id: 'sms_message', rows: 2, value: session.sms().message, spellcheck: false });
      textarea.addEventListener('input', () => { smsService.setField('message', textarea.value); autoGrow(textarea); });
      const segments = el('p', 'status sms-segments');
      segments.id = SEGMENT_ID;
      renderSegments(segments);
      return field('message', textarea, segments);
    }

    function numberInput(type, param) {
      const input = el('input', 'text sms-num');
      Object.assign(input, { type: 'text', inputMode: 'numeric', autocomplete: 'off', value: session.sms().customerTypes[type.id].values[param] });
      input.dataset.param = param;
      input.setAttribute('aria-label', `${type.text} – ${param}`);
      input.addEventListener('input', () => smsService.setCustomerValue(type.id, param, input.value));
      return input;
    }

    /** 1 dòng: ô tick + câu mẫu, chỗ {tên} thành ô số sửa được. */
    function customerTypeRow(type) {
      const row = el('label', 'sms-type');
      row.dataset.type = type.id;
      const box = el('input');
      Object.assign(box, { type: 'checkbox', checked: session.sms().customerTypes[type.id].on });
      box.addEventListener('change', () => smsService.setCustomerType(type.id, box.checked));
      row.append(box, ...splitTemplate(type.text).map(part => part.param ? numberInput(type, part.param) : el('span', '', part.text)));
      return row;
    }

    function onOptionKeydown(event, input, index) {
      if (isComposing(event)) return;
      if (event.key === 'Enter') {
        event.preventDefault();
        smsService.insertOption(index + 1);
      } else if (event.key === 'Backspace' && input.value === '') {
        event.preventDefault();
        smsService.removeOption(index);
      }
    }

    /** Option tự gõ, in ra sau các mục có sẵn. */
    function optionRow(text, index) {
      const row = el('div', 'sms-option');
      const input = el('input', 'text');
      Object.assign(input, { type: 'text', value: text, placeholder: OPTION_PLACEHOLDER, autocomplete: 'off' });
      input.dataset.option = index;
      input.addEventListener('input', () => smsService.setOption(index, input.value));
      input.addEventListener('keydown', (event) => onOptionKeydown(event, input, index));
      row.append(input, button('', '×', { title: 'Xóa option', ariaLabel: 'Xóa option', skipTab: true, onClick: () => smsService.removeOption(index) }));
      return row;
    }

    function customerTypesField() {
      const list = el('div', 'sms-types');
      customerTypes.forEach(type => list.append(customerTypeRow(type)));
      session.sms().customOptions.forEach((text, index) => list.append(optionRow(text, index)));
      const addOption = button('add', '+ Thêm option', {
        skipTab: true, onClick: () => smsService.insertOption(session.sms().customOptions.length)
      });
      const [addImage, fileInput] = imageZone.addButton(SMS_IMAGE_KEY);
      const tools = el('div', 'sms-tools');
      tools.append(addOption, addImage, imageZone.shotButton(SMS_IMAGE_KEY), fileInput);
      const wrap = field('customerTypes', list);
      wrap.classList.add('sms-types-box');
      wrap.dataset.imgKey = SMS_IMAGE_KEY;   // Ctrl+V ảnh khi đang đứng trong khối này => vào ảnh Type Customer
      wrap.append(tools, imageZone.zone(SMS_IMAGE_KEY), el('div', 'hint', TYPES_HINT));
      imageZone.acceptDrop(wrap, SMS_IMAGE_KEY);
      return wrap;
    }

    function restoreFocus(focus) {
      if (!focus || focus.key !== OPTION_FOCUS_KEY) return;
      const target = fields.querySelector(`input[data-option="${focus.index}"]`);
      if (target) target.focus();
    }

    function priceField() {
      return field('price', choiceGroup({
        name: 'smsPrice', value: session.sms().price,
        options: prices.map(price => ({ value: price, label: price })),
        onChange: (price) => smsService.setField('price', price)
      }));
    }

    function languageField() {
      return field('language', choiceGroup({
        name: 'smsLang', value: session.sms().lang,
        options: languages.map(language => ({ value: language.id, label: language.label })),
        onChange: (lang) => smsService.setField('lang', lang)
      }));
    }

    function toggle() {
      const label = el('label', 'sms-toggle');
      const box = el('input');
      Object.assign(box, { id: 'sms_enabled', type: 'checkbox', checked: session.sms().enabled });
      box.addEventListener('change', () => smsService.setEnabled(box.checked));
      label.append(box, el('b', '', labels.toggle));
      return label;
    }

    /** Trả về khối để form ticket gắn vào. Luôn dựng đủ ô, chưa tick thì ẩn: tick không làm mất con trỏ. */
    function build(focus) {
      const message = messageInput();
      fields = el('div', 'sms-fields');
      fields.hidden = !session.sms().enabled;
      fields.append(languageField(), textField('shop'), textField('shopPhone', { inputMode: 'tel', format: maskPhone }), textField('recipients', { inputMode: 'numeric' }), customerTypesField(), message, priceField());
      const box = el('div', 'sec sms-box');
      box.append(toggle(), fields);
      // Giữ sẵn ô Message: tới lúc frame chạy, khu Nhập có thể đã đổi sang form khác
      const textarea = message.querySelector('textarea');
      requestAnimationFrame(() => { autoGrow(textarea); restoreFocus(focus); });
      return box;
    }

    /** Ô nhập tự giữ giá trị khi gõ; chỉ cần ẩn / hiện theo ô tick. Ô Message lúc ẩn không đo được chiều cao nên đo lại khi hiện. */
    function sync() {
      renderSegments();   // Tên tiệm / Phone / Message đổi thì số segment đổi theo
      if (!fields || fields.hidden === !session.sms().enabled) return;
      fields.hidden = !fields.hidden;
      if (!fields.hidden) autoGrow(fields.querySelector('textarea'));
    }

    return { build, sync };
  }

  TW.ui.smsForm = { createSmsForm };
})(window.TW);
