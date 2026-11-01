// src/core/ports.js — CHỈ chứa typedef JSDoc của các port (interface). Không có code chạy, không cần <script>.
// application/ chỉ phụ thuộc vào các port này; infrastructure/ cung cấp bản cài đặt; main.js nối hai bên.

/**
 * Lưu/đọc giá trị JSON theo key.
 * @typedef {Object} KeyValueStore
 * @property {(key: string) => any} read        trả null khi không có / lỗi
 * @property {(key: string, value: any) => boolean} write   false khi không lưu được
 */

/**
 * @typedef {Object} TextClipboard
 * @property {(text: string) => Promise<boolean>} writeText
 */

/**
 * @typedef {Object} ImageClipboard
 * @property {(image: StoredImage) => Promise<boolean>} writeImage
 * @property {() => Promise<File[] | null>} readImages   null = trình duyệt không hỗ trợ / bị từ chối quyền
 */

/**
 * Chụp 1 khung hình màn hình thành file PNG. Mỗi nguồn nhớ màn hình đã chọn trong phiên.
 * @typedef {Object} ScreenCapture
 * @property {(source: string) => Promise<File | null>} capture   null = người dùng hủy / trình duyệt không hỗ trợ
 */

/**
 * Điền Subject / Description / Comment (Checklist) rồi bấm Upload File(s) trên trang ticket (hệ thống ngoài) qua clipboard + bookmarklet.
 * @typedef {Object} TicketFill
 * @property {(title: string, body: string) => string} payload   chữ để copy; bookmarklet đọc lại từ clipboard
 * @property {() => string} bookmarkletUrl   link javascript: để kéo lên thanh bookmark
 */

/**
 * @typedef {Object} FileAdapter
 * @property {(file: File) => Promise<string | null>} readAsDataUrl   null = không đọc được
 * @property {(file: File) => Promise<any>} readJson                  undefined = không phải JSON hợp lệ
 * @property {(fileName: string, text: string) => void} download
 * @property {(fileName: string, entries: ZipEntry[]) => Promise<boolean>} downloadZip   false = không tạo được file ZIP
 * @property {(fileName: string, report: ImageReport) => Promise<boolean>} downloadPdf   false = không tạo được file PDF
 */

/**
 * 1 file trong file ZIP.
 * @typedef {Object} ZipEntry
 * @property {string} name   tên file bên trong ZIP
 * @property {Blob} blob
 */

/**
 * File PDF ảnh: mỗi trang 1 ảnh, đầu trang ghi nhãn.
 * @typedef {Object} ImageReport
 * @property {string} title   tiêu đề trong thuộc tính file PDF (có thể rỗng)
 * @property {{ label: string, blob: Blob }[]} entries   theo thứ tự trang
 */

/**
 * Ảnh đang giữ trong bộ nhớ (không bao giờ lưu xuống storage).
 * @typedef {Object} StoredImage
 * @property {string} src       data URL của file gốc
 * @property {Blob} blob
 * @property {boolean} copied   đã bấm Copy ảnh thành công
 */
