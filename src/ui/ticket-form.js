// src/ui/ticket-form.js — Khu Nhập: trường chung, checklist (nếu có), các mục, Kết luận, khối SMS Promotion (nếu có).
(function (TW) {
  'use strict';

  const { $$, el, button, choiceGroup, autoGrow, isComposing, focusNext } = TW.ui.dom;
  const { isConclusionSection, isSectionHidden } = TW.domain.ticket;

  const IDEA_HINT = 'Enter: ý mới · Shift+Enter: xuống dòng · Tab: field kế tiếp · Ctrl+V: dán ảnh';

  function createTicketForm({ root, context, session, ticketService, categoryCombo, ideaList, imageZone, checklistView, smsForm }) {
    const { app, catalog } = context;

    function textField(field, inputMode) {
      const wrap = el('div', 'field');
      const label = el('label', '', app.labels[field]);
      label.htmlFor = 'f_' + field;
      const input = el('input', 'text');
      Object.assign(input, { id: 'f_' + field, type: 'text', value: session.ticket()[field], autocomplete: 'off' });
      if (inputMode) input.inputMode = inputMode;
      input.addEventListener('input', () => ticketService.setField(field, input.value));
      input.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' || isComposing(event)) return;
        event.preventDefault();
        focusNext(input, root);
      });
      wrap.append(label, input);
      return wrap;
    }

    function langField() {
      const wrap = el('div', 'field');
      wrap.append(el('label', '', app.labels.lang), choiceGroup({
        name: 'lang', value: session.ticket().lang,
        options: app.langs.map(code => ({ value: code, label: code })),
        onChange: (code) => ticketService.setField('lang', code)
      }));
      return wrap;
    }

    function conclusionBody(box) {
      box.append(choiceGroup({
        name: 'conclusion', value: session.ticket().conclusion,
        options: app.conclusions.map(c => ({ value: c.value, label: c.value, hint: c.hint })),
        onChange: (value) => ticketService.setConclusion(value)
      }));
      const shown = app.conclusions.filter(c => c.showInBody).map(c => `"${c.value}"`).join(', ');
      if (shown) box.append(el('div', 'hint', `Chỉ ${shown} mới được ghi vào nội dung ticket.`));
    }

    function ideasBody(box, section) {
      const add = button('add', '+ Thêm ý', { skipTab: true, onClick: () => ticketService.appendIdea(section.key) });
      const [addImage, fileInput] = imageZone.addButton(section.key);
      const shot = imageZone.shotButton(section.key);
      addImage.style.marginLeft = '8px';
      shot.style.marginLeft = '8px';
      box.append(ideaList.build(section), imageZone.zone(section.key), add, addImage, shot, fileInput, el('div', 'hint', IDEA_HINT));
      imageZone.acceptDrop(box, section.key);
    }

    function sectionBox(section) {
      const box = el('div', 'sec');
      const heading = el('h3', '', section.label);
      if (section.actionFor) {
        box.dataset.actionBox = '1';
        const badge = el('span', 'req', 'Bắt buộc');
        badge.dataset.reqBadge = '1';
        heading.append(badge);
      }
      box.append(heading);
      if (isConclusionSection(section)) conclusionBody(box); else ideasBody(box, section);
      return box;
    }

    function labelOf(list, id) { const found = list.find(x => x.id === id); return found ? found.label : id; }

    /** Nhánh setup chưa có checklist. */
    function emptyState() {
      const path = session.setupPath();
      const device = catalog.devices.find(d => d.id === path.device);
      const names = [device.label, labelOf(device.brands, path.brand), path.model, labelOf(catalog.flows, path.flow)].filter(Boolean);
      const box = el('div', 'sec empty-state');
      box.append(el('h3', '', `Chưa có checklist cho ${names.join(' · ')}`),
        el('div', 'hint', `Thêm file config/setup/${path.device}/${path.brand}/${path.flow}/<tên>.js (xem docs/CONFIG.md), rồi thêm <script> vào index.html.`));
      return box;
    }

    /** Mục actionFor: hiện / ẩn và nhãn Bắt buộc theo Kết luận đang chọn. */
    function syncAction() {
      const conclusion = session.conclusion();
      const need = !!(conclusion && conclusion.requiresAction);
      $$('[data-req-badge]', root).forEach(badge => { badge.hidden = !need; });
      $$('[data-action-box]', root).forEach(box => { box.hidden = isSectionHidden({ actionFor: true }, conclusion); });
    }

    function sync() {
      syncAction();
      checklistView.sync();
      smsForm.sync();
    }

    /** Không chỉ định ô (mở trang, đổi loại, Ticket mới, dùng template) => vào ô Loại để gõ ngay. */
    function restoreFocus(focus) {
      $$('textarea', root).forEach(autoGrow);
      // Form có thể đã bị thay (đổi sang SMS Shipping, nhánh chưa có checklist) trước khi khung hình này chạy; focus của khối SMS do sms-form lo
      const target = focus ? root.querySelector(`textarea[data-key="${focus.key}"][data-i="${focus.index}"]`) : root.querySelector('#f_category');
      if (!target) return;
      target.focus();
      target.setSelectionRange(target.value.length, target.value.length);
    }

    /** Dựng lại toàn bộ form (khi đổi loại / thêm / xóa ý). Gõ chữ thì chỉ sync(). */
    function build(focus) {
      root.textContent = '';
      const type = session.activeType();
      if (!type) { root.append(emptyState()); return; }
      root.append(categoryCombo.build(), textField('summary'), textField('phone', 'tel'));
      if (type.showLang) root.append(langField());
      if (type.checklist) root.append(checklistView.build(type));   // checklist đứng trước, Note nằm sau
      type.sections.forEach(section => root.append(sectionBox(section)));
      if (type.smsPromotion) root.append(smsForm.build(focus));
      sync();
      requestAnimationFrame(() => restoreFocus(focus));
    }

    return { build, sync };
  }

  TW.ui.ticketForm = { createTicketForm };
})(window.TW);
