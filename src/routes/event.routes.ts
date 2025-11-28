// src/routes/event.routes.ts
import { Router } from 'express';
import { completeEvent, createEvent, deleteMyEvent, getAllEvents, getEventById, getMyEvents, joinEvent, leaveEvent, updateMyEvent } from '../controllers/event.controller';
import { protect } from '../middlewares/auth.middleware'; // Import "người gác cổng"
import reviewRouter from './review.routes'

const router = Router();

// Chuyển hướng mọi request /api/events/:id/reviews sang reviewRouter
router.use('/:eventId/reviews', reviewRouter);

// === CÁC ROUTE ĐƯỢC BẢO VỆ ===
// Ai muốn TẠO event, PHẢI đi qua "người gác cổng" protect
router.post('/', protect, createEvent);
router.post('/', protect, createEvent);
router.post('/:id/join', protect, joinEvent); 
router.delete('/:id/leave', protect, leaveEvent);
router.patch('/:id/complete', protect, completeEvent);

// === Quản lý event cá nhân ===
// Đặt /my-events TRƯỚC /:id
router.get('/my-events', protect, getMyEvents); 
router.put('/:id', protect, updateMyEvent);    
router.delete('/:id', protect, deleteMyEvent); 


// === public routes ===
router.get('/', getAllEvents);
router.get('/:id', getEventById);

export default router;