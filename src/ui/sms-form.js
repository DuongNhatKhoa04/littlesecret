// src/ui/sms-form.js — Khối SMS Promotion trong form ticket: ô tick mở khối, Ngôn ngữ tin nhắn, Tên tiệm, Phone tiệm, Recipients, Type Customer (chọn nhiều, sửa số), Message, Price.
(function (TW) {
  'use strict';

  const { el, button, choiceGroup, autoGrow, isComposing } = TW.ui.dom;
  const { splitTemplate, IMAGE_KEY: SMS_IMAGE_KEY } = TW.domain.sms;
  const { OPTION_FOCUS_KEY } = TW.application.smsService;

  const TYPES_HINT = 'Tick nhóm khách cần gửi (chọn nhiều), sửa số nếu promotion khác. Có điều kiện khác thì "+ Thêm option". ' +
    'Ảnh: click ô dán rồi Ctrl+V, hoặc kéo thả vào khối này.';
  const OPTION_PLACEHOLDER = 'Option khác, vd Birthday in October · Enter: thêm option · Backspace ở ô trống: xóa';

  function createSmsForm({ context, session, smsService, imageZone }) {
    const { labels, customerTypes, prices, languages } = context.sms;
    let fields = null;   // phần mở ra khi tick, null khi loại đang mở không có khối SMS

    function field(name, control) {
      const wrap = el('div', 'field');
      const label = el('label', '', labels[name]);
      if (control.id) label.htmlFor = control.id;
      wrap.append(label, control);
      return wrap;
    }

    function textInput(name, inputMode) {
      const input = el('input', 'text');
      Object.assign(input, { id: 'sms_' + name, type: 'text', value: session.sms()[name], autocomplete: 'off' });
      if (inputMode) input.inputMode = inputMode;
      input.addEventListener('input', () => smsService.setField(name, input.value));
      return field(name, input);
    }

    function messageInput() {
      const textarea = el('textarea', 'text sms-message');
      Object.assign(textarea, { id: 'sms_message', rows: 2, value: session.sms().message, spellcheck: false });
      textarea.addEventListener('input', () => { smsService.setField('message', textarea.value); autoGrow(textarea); });
      return field('message', textarea);
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
      fields.append(languageField(), textInput('shop'), textInput('shopPhone', 'tel'), textInput('recipients', 'numeric'), customerTypesField(), message, priceField());
      const box = el('div', 'sec sms-box');
      box.append(toggle(), fields);
      // Giữ sẵn ô Message: tới lúc frame chạy, khu Nhập có thể đã đổi sang form khác
      const textarea = message.querySelector('textarea');
      requestAnimationFrame(() => { autoGrow(textarea); restoreFocus(focus); });
      return box;
    }

    /** Ô nhập tự giữ giá trị khi gõ; chỉ cần ẩn / hiện theo ô tick. Ô Message lúc ẩn không đo được chiều cao nên đo lại khi hiện. */
    function sync() {
      if (!fields || fields.hidden === !session.sms().enabled) return;
      fields.hidden = !fields.hidden;
      if (!fields.hidden) autoGrow(fields.querySelector('textarea'));
    }

    return { build, sync };
  }

  TW.ui.smsForm = { createSmsForm };
})(window.TW);
