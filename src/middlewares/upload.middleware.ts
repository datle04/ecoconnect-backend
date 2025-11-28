// src/middleware/upload.middleware.ts
import multer from 'multer';

// Cấu hình multer để lưu file tạm thời trong bộ nhớ (RAM)
const storage = multer.memoryStorage();

// Chỉ chấp nhận file ảnh
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh!') as any, false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

export default upload;