// src/ui/image-zone.js — Gắn ảnh vào 1 mục: nút "+ Thêm ảnh", nút chụp màn hình, ô dán ảnh (Ctrl+V) có thumbnail, kéo thả file, kéo thumbnail đổi thứ tự.
(function (TW) {
  'use strict';

  const { $$, el, button, fileInput, flash, acceptImageDrop } = TW.ui.dom;

  const ZONE_HINT = 'Click vào đây rồi Ctrl+V để dán ảnh';
  const zoneHintWith = (count) => `✓ Đã có ${count} ảnh. Click vào đây rồi Ctrl+V để dán thêm` + (count > 1 ? ', kéo ảnh để đổi thứ tự' : '');
  const ADD_TITLE = 'Dán ảnh đang copy trong clipboard. Clipboard không có ảnh thì mở chọn file.';
  const SHOT_TITLE = 'Lần đầu chọn màn hình trong hộp thoại của Chrome; các lần sau bấm là chụp ngay, ảnh tự vào mục này.';
  const SHOT_FAILED = 'Chưa chụp được màn hình';
  const SCREENS = {
    other: { label: 'Chụp màn hình kia', delayMs: 0, switchTitle: 'Đang chụp màn hình kia. Bấm để đổi sang màn hình đang mở Ticket Writer' },
    // chờ 3s để kịp chuyển sang tab cần chụp
    current: { label: 'Chụp màn hình này sau 3s', delayMs: 3000, switchTitle: 'Đang chụp màn hình đang mở Ticket Writer (sau 3s). Bấm để đổi sang màn hình kia' }
  };
  const DEFAULT_SCREEN = 'other';

  function createImageZone({ images, clipboard, screenCapture, openViewer }) {
    let screen = DEFAULT_SCREEN;   // chung cho mọi mục, chỉ trong phiên: tải lại trang thì về mặc định

    async function addFiles(key, files) {
      const { failed } = await images.add(key, files);
      if (failed) alert('Không đọc được một ảnh, đã bỏ qua.');
    }

    let dragging = null;   // thumbnail đang kéo { key, index }: chỉ đổi thứ tự trong cùng 1 mục

    /** Kéo thả thumbnail để đổi thứ tự ảnh trong mục */
    function wireReorder(thumb, key, index) {
      thumb.draggable = true;
      const isSameItem = () => !!dragging && dragging.key === key;
      thumb.addEventListener('dragstart', (event) => {
        dragging = { key, index };
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', '');
        thumb.classList.add('dragging');
      });
      thumb.addEventListener('dragend', () => { dragging = null; thumb.classList.remove('dragging'); });
      thumb.addEventListener('dragover', (event) => {
        if (!isSameItem()) return;
        event.preventDefault();
        thumb.classList.add('drop-target');
      });
      thumb.addEventListener('dragleave', () => thumb.classList.remove('drop-target'));
      thumb.addEventListener('drop', (event) => {
        if (!isSameItem()) return;
        event.preventDefault();
        event.stopPropagation();
        const from = dragging.index;
        dragging = null;
        images.move(key, from, index);
      });
    }

    function fillThumbs(container, key) {
      container.textContent = '';
      images.list(key).forEach((image, i) => {
        const thumb = el('div', 'thumb');
        const img = el('img');
        img.src = image.src;
        img.alt = 'Ảnh ' + (i + 1);
        img.title = 'Bấm để xem ảnh lớn, kéo để đổi thứ tự';
        img.draggable = false;   // kéo <img> thì Chrome gửi kèm file ảnh => ô dán ảnh tưởng là ảnh mới, thêm trùng
        img.addEventListener('click', () => openViewer(image));
        thumb.append(img, button('', '×', {
          title: 'Xóa ảnh', ariaLabel: 'Xóa ảnh ' + (i + 1), skipTab: true, onClick: () => images.remove(key, i)
        }));
        wireReorder(thumb, key, i);
        container.append(thumb);
      });
    }

    function paint(zone) {
      const key = zone.dataset.imgKey;
      const count = images.list(key).length;
      zone.classList.toggle('has', count > 0);
      zone.querySelector('.pz-hint').textContent = count ? zoneHintWith(count) : ZONE_HINT;
      fillThumbs(zone.querySelector('.thumbs'), key);
    }

    /** Ô dán ảnh: click rồi Ctrl+V; ảnh đã dán hiện ngay bên trong. */
    function zone(key) {
      const node = el('div', 'pzone');
      node.tabIndex = -1;   // không nhận Tab: đứng trong ô nhập của mục rồi Ctrl+V cũng vào đúng mục này
      node.dataset.imgKey = key;
      node.append(el('div', 'pz-hint', ZONE_HINT), el('div', 'thumbs'));
      paint(node);
      return node;
    }

    /** key = null => vẽ lại mọi ô. */
    function refresh(key) {
      $$('.pzone').filter(node => key === null || node.dataset.imgKey === key).forEach(paint);
    }

    // Đọc ảnh trong clipboard như Ctrl+V; không có ảnh / bị từ chối quyền => mở chọn file.
    async function pasteFromClipboard(key, input, trigger) {
      const files = await clipboard.readImages();
      if (files && files.length) { addFiles(key, files); return; }
      if (files) flash(trigger, 'Clipboard chưa có ảnh');
      input.click();
    }

    /** Trả về [nút, input file ẩn] — phải gắn cả hai vào DOM. */
    function addButton(key) {
      const input = fileInput({ accept: 'image/*', multiple: true, onFiles: (files) => addFiles(key, files) });
      const trigger = button('add', '+ Thêm ảnh (Ctrl+V)', { title: ADD_TITLE, skipTab: true });
      trigger.addEventListener('click', () => pasteFromClipboard(key, input, trigger));
      return [trigger, input];
    }

    function paintShot(group) {
      const [take, toggle] = group.children;
      take.textContent = SCREENS[screen].label;
      take.dataset.label = SCREENS[screen].label;   // flash() trả về đúng chữ của màn hình vừa đổi
      toggle.title = SCREENS[screen].switchTitle;
    }

    function switchScreen() {
      screen = screen === DEFAULT_SCREEN ? 'current' : DEFAULT_SCREEN;
      $$('.shot').forEach(paintShot);
    }

    async function takeShot(key, trigger) {
      const file = await screenCapture.capture(screen, SCREENS[screen].delayMs);
      if (file) addFiles(key, [file]);
      else flash(trigger, SHOT_FAILED);
    }

    /** Nút chụp màn hình rồi tự thêm ảnh vào mục, kèm nút ⇄ đổi màn hình kia / màn hình này (đổi chung mọi mục). */
    function shotButton(key) {
      const group = el('span', 'shot');
      const take = button('add', '', { title: SHOT_TITLE, skipTab: true });
      take.addEventListener('click', () => takeShot(key, take));
      group.append(take, button('add shot-switch', '⇄', { ariaLabel: 'Đổi màn hình chụp', skipTab: true, onClick: switchScreen }));
      paintShot(group);
      return group;
    }

    const acceptDrop = (target, key) => acceptImageDrop(target, (files) => addFiles(key, files));

    return { addFiles, zone, refresh, addButton, shotButton, acceptDrop };
  }

  TW.ui.imageZone = { createImageZone };
})(window.TW);
