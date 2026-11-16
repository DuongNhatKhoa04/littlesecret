// src/domain/offline-ticket.js — Ticket offline (ticket system không vào được): file JSON để mở lại vào form, tên file JSON / ZIP / PDF khớp nhau.
(function (TW) {
  'use strict';

  const { toFileName } = TW.domain.imageArchive;
  const { asString, pad2 } = TW.domain.text;

  const FORMAT = 'ticket-writer-offline';   // nhận ra đúng file của tính năng này khi mở lại
  const FORMAT_VERSION = 1;
  const ID_PREFIX = 'OFF-';


  /** OFF-YYYYMMDD-HHmmss theo giờ máy lúc lưu. */
  const createOfflineId = (date) => ID_PREFIX + `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}-` +
    `${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`;

  /** Tên chung (không đuôi) cho file .json / .zip / .pdf của cùng 1 ticket offline: mã đứng đầu để tìm và ghép lại. */
  const offlineBaseName = (id, title) => toFileName(title ? `${id} - ${title}` : id);

  /**
   * @param {{ id: string, savedAt: number, type: string, zipcode: string, ticketType: string, title: string, body: string,
   *   ticket: object, images: { zip: string, pdf: string } }} input   zip = file ZIP chứa file này, pdf = file PDF trong ZIP đó; '' = không có
   */
  function createOfflineFile({ id, savedAt, type, zipcode, ticketType, title, body, ticket, images }) {
    return { format: FORMAT, version: FORMAT_VERSION, id, savedAt, type, zipcode, ticketType, title, body, images, ticket };
  }

  /** Dữ liệu từ file người dùng chọn: không đúng dạng / loại không còn => null; trường chữ hỏng => rỗng. */
  function parseOfflineFile(data, typeExists) {
    if (!data || typeof data !== 'object' || data.format !== FORMAT || !asString(data.id) || !typeExists(data.type) ||
      !data.ticket || typeof data.ticket !== 'object') return null;
    const images = data.images && typeof data.images === 'object' ? data.images : {};
    return {
      id: data.id, type: data.type, ticket: data.ticket,
      zipcode: asString(data.zipcode), ticketType: asString(data.ticketType),
      images: { zip: asString(images.zip), pdf: asString(images.pdf) }
    };
  }

  TW.domain.offlineTicket = { createOfflineId, offlineBaseName, createOfflineFile, parseOfflineFile };
})(window.TW);
