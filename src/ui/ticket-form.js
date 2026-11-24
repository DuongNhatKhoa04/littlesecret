// src/ui/ticket-form.js — Khu Nhập: trường chung, checklist (nếu có), các mục, Kết luận, khối SMS Promotion (nếu có).
(function (TW) {
  'use strict';

  const { $$, el, button, choiceGroup, toggleSegmented, autoGrow, isComposing, focusNext, labeledField, textInput, maskPhone } = TW.ui.dom;
  const { isConclusionSection, isSectionHidden } = TW.domain.ticket;

  const IDEA_HINT = 'Enter: ý mới · Shift+Enter: xuống dòng · Tab: field kế tiếp · Ctrl+V: dán ảnh';

  function createTicketForm({ root, context, session, ticketService, categoryCombo, ideaList, imageZone, checklistView, smsForm, summaryCombo }) {
    const { app, catalog } = context;

    /** options: inputMode, format (xem dom.textInput). Enter = sang ô kế tiếp. */
    function textField(field, options = {}) {
      const input = textInput({ id: 'f_' + field, value: session.ticket()[field], onInput: (value) => ticketService.setField(field, value), ...options });
      input.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' || isComposing(event) || event.defaultPrevented) return;   // defaultPrevented: Enter đã chọn gợi ý
        event.preventDefault();
        focusNext(input, root);
      });
      return labeledField(app.labels[field], input);
    }

    const summaryField = () => summaryCombo.attach(textField('summary'));

    /** Vai trò: nút phụ, Enter ở Tên merchant vẫn sang thẳng ý đầu tiên. */
    const roleField = () => labeledField(app.labels.role, toggleSegmented({
      options: app.roles, value: session.ticket().role, ariaLabel: app.labels.role, skipTab: true,
      onChange: (role) => ticketService.setField('role', role)
    }));

    /** Phone + Tên merchant + Vai trò (không bắt buộc) cùng 1 hàng; in ra "Phone: (111) 111-1111 - Mr. Vương - Owner". */
    function contactRow() {
      const row = el('div', 'field-row contact-row');
      row.append(textField('phone', { inputMode: 'tel', format: maskPhone }), textField('merchant'), roleField());
      return row;
    }

    const langField = () => labeledField(app.labels.lang, choiceGroup({
      name: 'lang', value: session.ticket().lang,
      options: app.langs.map(code => ({ value: code, label: code })),
      onChange: (code) => ticketService.setField('lang', code)
    }));

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

    /** Không chỉ định ô (mở trang, đổi loại, Ticket mới, dùng template) => vào ô Loại (loại không có ô Loại thì ô Tóm tắt) để gõ ngay. */
    function restoreFocus(focus) {
      $$('textarea', root).forEach(autoGrow);
      // Form có thể đã bị thay (đổi sang SMS Shipping, nhánh chưa có checklist) trước khi khung hình này chạy; focus của khối SMS do sms-form lo
      const target = focus ? root.querySelector(`textarea[data-key="${focus.key}"][data-i="${focus.index}"]`) : root.querySelector('#f_category, #f_summary');
      if (!target) return;
      target.focus();
      target.setSelectionRange(target.value.length, target.value.length);
    }

    /** Dựng lại toàn bộ form (khi đổi loại / thêm / xóa ý). Gõ chữ thì chỉ sync(). */
    function build(focus) {
      root.textContent = '';
      const type = session.activeType();
      if (!type) { root.append(emptyState()); return; }
      if (!type.noCategory) root.append(categoryCombo.build());
      root.append(summaryField(), contactRow());
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
