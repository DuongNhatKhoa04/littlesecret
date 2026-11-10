// src/infrastructure/screen-capture.js — Chụp màn hình bằng getDisplayMedia. Giữ luồng chia sẻ theo từng nguồn để lần sau chụp ngay, không hỏi lại.
(function (TW) {
  'use strict';

  const PNG = 'image/png';
  const FIRST_FRAME_DELAY_MS = 400;   // đợi hộp thoại chọn màn hình của Chrome đóng hẳn, không lọt vào ảnh đầu
  const PICKER_OPTIONS = {
    video: { displaySurface: 'monitor' },   // mở sẵn tab "Toàn màn hình"
    audio: false,
    selfBrowserSurface: 'exclude',          // không cho chọn chính tab Ticket Writer
    surfaceSwitching: 'exclude'
  };

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const isLive = (feed) => !!feed && feed.stream.getVideoTracks().some(track => track.readyState === 'live');

  // Trình duyệt chỉ cho chọn màn hình qua hộp thoại của nó; không có API chọn sẵn màn hình theo vị trí cửa sổ.
  async function openFeed() {
    const stream = await navigator.mediaDevices.getDisplayMedia(PICKER_OPTIONS);
    const video = document.createElement('video');
    video.muted = true;
    video.srcObject = stream;
    await video.play();
    await wait(FIRST_FRAME_DELAY_MS);
    return { stream, video };
  }

  function grabFrame(video) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    return new Promise(resolve => canvas.toBlob(resolve, PNG));
  }

  /** @returns {ScreenCapture} */
  function createScreenCapture() {
    const feeds = {};   // nguồn => { stream, video }; người dùng bấm "Dừng chia sẻ" thì lần sau hỏi lại

    return {
      async capture(source, delayMs = 0) {
        try {
          if (!isLive(feeds[source])) feeds[source] = await openFeed();
          await wait(delayMs);   // đếm sau khi hộp thoại chọn màn hình đã đóng
          const blob = await grabFrame(feeds[source].video);
          return blob ? new File([blob], 'screen.png', { type: PNG }) : null;
        } catch (error) { return null; }
      }
    };
  }

  TW.infra.screenCapture = { createScreenCapture };
})(window.TW);
