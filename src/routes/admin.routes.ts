// src/routes/admin.routes.ts
import { Router } from 'express';
import {
  approveEvent,
  getAllEventsAdmin,
  getAllTickets,
  rejectEvent,
  updateTicketStatus,
} from '../controllers/admin.controller';
import { protect, isAdmin } from '../middlewares/auth.middleware'; // Import cả 2

const router = Router();

// === BẢO VỆ TẤT CẢ CÁC ROUTE TRONG FILE NÀY ===
// Áp dụng "protect" (phải đăng nhập) VÀ "isAdmin" (phải là Admin)
// cho TẤT CẢ các route được định nghĩa bên dưới.
router.use(protect, isAdmin);

// === Định nghĩa các route ===

// === Event Management ===
router.get('/events', getAllEventsAdmin);
router.patch('/events/:id/approve', approveEvent);
router.patch('/events/:id/reject', rejectEvent);

// === Ticket Management ===
router.get('/tickets', getAllTickets); // <-- ROUTE MỚI
router.patch('/tickets/:id', updateTicketStatus); // <-- ROUTE MỚI

export default router;