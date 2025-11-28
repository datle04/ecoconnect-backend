// src/controllers/review.controller.ts
import { Request, Response } from 'express';
import Review from '../models/review.model'; // Model chúng ta đã tạo
import Event from '../models/event.model';
import mongoose from 'mongoose';

/**
 * [PROTECTED] Tạo một Review mới cho Event
 * POST /api/events/:eventId/reviews
 */
export const createReview = async (req: Request, res: Response) => {
  const { rating, comment } = req.body;
  const { eventId } = req.params; 
  const userId = req.user!._id;

  try {
    const event = await Event.findById(eventId);

    // 1. Kiểm tra Event
    if (!event) {
      return res.status(404).json({ message: 'Không tìm thấy event' });
    }
    
    // 2. Logic nghiệp vụ: Chỉ review được event "COMPLETED"
    if (event.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'Chỉ có thể review event đã hoàn thành' });
    }

    // 3. Logic nghiệp vụ: Chỉ người "đã tham gia" mới được review
    if (!event.participants.includes(userId)) {
      return res.status(403).json({ message: 'Bạn phải tham gia event mới được review' });
    }

    // 4. Logic nghiệp vụ: Đã review rồi thì không được review nữa
    const existingReview = await Review.findOne({ event: eventId, reviewer: userId });
    if (existingReview) {
      return res.status(400).json({ message: 'Bạn đã review event này rồi' });
    }

    // 5. Tạo review
    const review = new Review({
      event: eventId,
      reviewer: userId,
      rating,
      comment,
    });

    await review.save();
    res.status(201).json(review);

  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

/**
 * [PUBLIC] Lấy tất cả review của một Event
 * GET /api/events/:eventId/reviews
 */
export const getReviewsForEvent = async (req: Request, res: Response) => {
  const { eventId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(eventId as string)) {
      return res.status(400).json({ message: 'Event ID không hợp lệ' });
    }

    const reviews = await Review.find({ event: eventId })
      .populate('reviewer', 'displayName avatar') // Lấy tên và avatar người review
      .sort({ createdAt: -1 }); // Mới nhất lên đầu

    res.status(200).json(reviews);
  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};