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
 * @property {(file: File) => Promise<any>} readJson                  undefined = không phải JSON hợp lệ; file .zip thì đọc file .json bên trong
 * @property {(report: ImageReport) => Promise<Blob | null>} createPdf   tạo PDF không tải (để gói vào ZIP); null = không tạo được
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
 * Lưu ảnh đang dán theo từng mục để tải lại trang không mất.
 * @typedef {Object} ImageStore
 * @property {() => Promise<Object<string, SavedImage[]>>} loadAll   {} khi không có / lỗi
 * @property {(key: string, images: SavedImage[]) => Promise<boolean>} save   danh sách rỗng = xóa mục; false khi không lưu được
 * @property {() => Promise<boolean>} clear
 */

/**
 * Dung lượng trình duyệt cho trang này (localStorage + IndexedDB).
 * @typedef {Object} StorageQuota
 * @property {() => Promise<{ usage: number, quota: number } | null>} estimate   null = trình duyệt không cho biết
 */

/**
 * Lấy ảnh iPad / iPhone gửi lên phone-upload, lấy link iPad (chạy cùng máy), mỗi lần 1 ảnh, lấy xong là xóa khỏi hàng chờ.
 * @typedef {Object} PhoneInbox
 * @property {(url: string) => Promise<{ ok: boolean, file: File | null }>} next   ok: false = không gọi được phone-upload; file: null = hàng chờ trống
 * @property {(url: string) => Promise<IpadLink>} info     link iPad hiện tại (để vẽ QR)
 * @property {(url: string) => Promise<IpadLink>} rotate   đổi mã iPad ngay, trả link mới
 */

/**
 * Link để iPad mở trang gửi ảnh. Mã iPad tự hết hạn (12 tiếng) hoặc đổi khi bấm Đổi mã ngay.
 * @typedef {Object} IpadLink
 * @property {boolean} ok         false = không gọi được phone-upload
 * @property {string[]} urls      http://<IP LAN>:<port>/u/<mã iPad>, mỗi card mạng 1 link
 * @property {string} expiresAt   ISO 8601 (UTC)

/**
 * @typedef {Object} SavedImage
 * @property {Blob} blob
 * @property {boolean} copied
 */

/**
 * Ảnh đang giữ trong bộ nhớ (bản lưu ở ImageStore chỉ có blob + copied).
 * @typedef {Object} StoredImage
 * @property {string} src       data URL của file gốc
 * @property {Blob} blob
 * @property {boolean} copied   đã bấm Copy ảnh thành công
 */
