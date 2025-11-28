// src/models/badge.model.ts
import { Schema, model, Document } from 'mongoose';

export interface IBadge extends Document {
  badgeId: string; // Một ID độc nhất (ví dụ: 'JOIN_10', 'CREATE_3')
  name: string;
  description: string;
  icon_url: string; // Tương lai bạn sẽ thêm icon vào đây
}

const badgeSchema = new Schema<IBadge>({
  badgeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  icon_url: { type: String }, // Sẵn sàng cho tương lai
}, { timestamps: true });

const Badge = model<IBadge>('Badge', badgeSchema);
export default Badge;