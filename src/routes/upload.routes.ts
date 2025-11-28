// src/routes/upload.routes.ts
import { Router } from 'express';
import { uploadImage } from '../controllers/upload.controller';
import { protect } from '../middlewares/auth.middleware';
import upload from '../middlewares/upload.middleware';

const router = Router();

// API này yêu cầu:
// 1. Phải đăng nhập (protect)
// 2. Phải là file "image" (tên field là "image" mà frontend gửi lên)
router.post(
  '/',
  protect,
  upload.single('image'), // 'image' là tên field
  uploadImage
);

export default router;