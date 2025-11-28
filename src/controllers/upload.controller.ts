// src/controllers/upload.controller.ts
import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';

// Hàm helper để tải file buffer lên Cloudinary
const uploadToCloudinary = (fileBuffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'image' },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error('Không nhận được kết quả từ Cloudinary'));
        }
      }
    );
    // Ghi buffer vào stream
    uploadStream.end(fileBuffer);
  });
};

/**
 * [PROTECTED] Xử lý tải file ảnh lên
 * POST /api/upload
 */
export const uploadImage = async (req: Request, res: Response) => {
  try {
    // 1. Kiểm tra file (middleware "upload" đã gắn file vào req)
    if (!req.file) {
      return res.status(400).json({ message: 'Không có file nào được tải lên' });
    }

    // 2. Lấy file buffer từ req.file (do multer memoryStorage)
    const fileBuffer = req.file.buffer;

    // 3. Tải buffer lên Cloudinary
    const secureUrl = await uploadToCloudinary(fileBuffer);

    // 4. Trả URL về cho frontend
    res.status(200).json({ secure_url: secureUrl });

  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server khi tải ảnh', error: error.message });
  }
};