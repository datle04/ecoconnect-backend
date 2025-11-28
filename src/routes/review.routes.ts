// src/routes/review.routes.ts
import { Router } from 'express';
import { createReview, getReviewsForEvent } from '../controllers/review.controller';
import { protect } from '../middlewares/auth.middleware';

// Cấu hình { mergeParams: true } là mấu chốt
// Nó cho phép router này "nhận" được :eventId từ router cha (event.routes.ts)
const router = Router({ mergeParams: true });

// POST / (sẽ tương đương /api/events/:eventId/reviews)
router.post('/', protect, createReview);

// GET / (sẽ tương đương /api/events/:eventId/reviews)
router.get('/', getReviewsForEvent);

export default router;