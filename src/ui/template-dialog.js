// src/ui/template-dialog.js — Nút "+ Lưu template", hộp "Template" (tìm, dùng, xóa), xuất / nhập JSON. Alt+T mở hộp.
(function (TW) {
  'use strict';

  const { $, el, button, flash, isComposing } = TW.ui.dom;
  const STORAGE_ERROR = 'Không lưu được template vào browser (localStorage bị chặn hoặc đầy).';

  function createTemplateDialog({ templateService, files }) {
    const dialog = $('#tplDlg');
    const search = $('#tplSearch');

    const persisted = (ok) => { if (!ok) alert(STORAGE_ERROR); return ok; };

    function save() {
      const template = templateService.draft();
      if (!template) { alert('Cần nhập Loại hoặc Tóm tắt trước, vì title chính là tên template.'); return; }
      if (templateService.exists(template.name) && !confirm(`Đã có template "${template.name}". Ghi đè?`)) return;
      if (persisted(templateService.save(template))) flash($('#tplSave'), 'Đã lưu ✓');
    }

    function apply(template) {
      const message = 'Template sẽ ghi đè Loại, Tóm tắt, các mục và Kết luận đang nhập (số điện thoại được giữ). Tiếp tục?';
      if (templateService.needsConfirmToApply() && !confirm(message)) return;
      templateService.apply(template);
      dialog.close();
    }

    function remove(template) {
      if (!confirm(`Xóa template "${template.name}"?`)) return;
      persisted(templateService.remove(template));
      renderList();
    }

    function row(template) {
      const wrap = el('div', 'titem');
      const pick = button('pick', '', { onClick: () => apply(template) });
      pick.append(el('b', '', template.name), el('span', '', `${templateService.typeLabel(template)} – ${templateService.conclusionLabel(template)}`));
      wrap.append(pick, button('del', '×', { title: 'Xóa template', ariaLabel: 'Xóa template ' + template.name, onClick: () => remove(template) }));
      return wrap;
    }

    function renderList() {
      const list = $('#tplList');
      const found = templateService.search(search.value);
      const total = templateService.count();
      list.textContent = '';
      $('#tplCount').textContent = `${found.length}/${total} template`;
      if (!found.length) {
        list.append(el('div', 'empty', total ? 'Không có template khớp.' : 'Chưa có template. Điền ticket rồi bấm "+ Lưu template".'));
        return;
      }
      found.forEach(template => list.append(row(template)));
    }

    function open() {
      if (dialog.open) return;
      search.value = '';
      renderList();
      dialog.showModal();
      search.focus();
    }

    async function importFile(file) {
      const data = await files.readJson(file);
      const result = data === undefined ? null : templateService.importData(data);
      if (!result) { alert('File JSON không hợp lệ.'); return; }
      renderList();
      alert(`Đã nhập ${result.added} template mới, ghi đè ${result.replaced}, bỏ qua ${result.skipped} mục không hợp lệ` +
        (result.newCategories ? `, thêm ${result.newCategories} loại mới.` : '.'));
    }

    /** Gọi khi đổi loại: không có loại ticket để lưu (SMS Promotion, nhánh setup chưa có checklist) thì khóa nút. */
    function render() { $('#tplSave').disabled = !templateService.canSave(); }

    $('#tplOpen').addEventListener('click', open);
    $('#tplSave').addEventListener('click', save);
    $('#tplClose').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });   // bấm nền để đóng
    search.addEventListener('input', renderList);
    search.addEventListener('keydown', (event) => {
      if (isComposing(event) || event.key !== 'Enter') return;
      const found = templateService.search(search.value);
      if (found.length) { event.preventDefault(); apply(found[0]); }
    });
    $('#tplExport').addEventListener('click', () => templateService.exportFile());
    $('#tplImport').addEventListener('change', (event) => {
      const file = event.target.files[0];
      event.target.value = '';
      if (file) importFile(file);
    });
    document.addEventListener('keydown', (event) => {
      if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 't') { event.preventDefault(); open(); }
    });

    return { open, render };
  }

  TW.ui.templateDialog = { createTemplateDialog };
})(window.TW);
