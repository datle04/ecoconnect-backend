// src/routes/report.routes.ts
import { Router } from 'express';
import { createReportTicket } from '../controllers/report.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Chỉ cần đăng nhập (protect) là có thể gửi báo cáo
router.post('/', protect, createReportTicket);

export default router;