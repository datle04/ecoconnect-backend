// src/models/review.model.ts
import { Schema, model, Document } from 'mongoose';
import { IUser } from './user.model';
import { IEvent } from './event.model';

export interface IReview extends Document {
  event: IEvent['_id']; // Event được đánh giá
  reviewer: IUser['_id']; // Người tham gia đánh giá
  rating: number; // Điểm (ví dụ: 1-5 sao)
  comment: string; // Nội dung feedback
}

const reviewSchema = new Schema<IReview>({
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String }
}, { timestamps: true });

// Đảm bảo một người chỉ review một event một lần
reviewSchema.index({ event: 1, reviewer: 1 }, { unique: true });

const Review = model<IReview>('Review', reviewSchema);
export default Review;