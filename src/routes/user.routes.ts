// src/routes/user.routes.ts
import { Router } from 'express';
import { getMe, getMyHistory, getUserProfileById, updateMyProfile } from '../controllers/user.controller';
import { protect } from '../middlewares/auth.middleware'; // <-- IMPORT "NGƯỜI GÁC CỔNG"

const router = Router();

// Áp dụng middleware "protect" cho route này.
// Bất cứ ai gọi /me, phải chạy qua "protect" trước.
router.get('/me', protect, getMe);
router.put('/me/profile', protect, updateMyProfile); 
router.get('/me/history', protect, getMyHistory); 

// === CÁC ROUTE CÔNG KHAI  ===
router.get('/:id/profile', getUserProfileById); 

export default router;