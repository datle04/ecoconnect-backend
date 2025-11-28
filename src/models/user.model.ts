// src/models/user.model.ts
import { Schema, model, Document, Types } from 'mongoose';

// Định nghĩa cấu trúc của Badge
interface IUserBadge {
  badge: Types.ObjectId; // <-- Tham chiếu đến Model 'Badge'
  dateAchieved: Date;
}

// Định nghĩa cấu trúc của Profile
interface IUserProfile {
  skills: string[]; // Kỹ năng
  interests: string[]; // Sở thích thiện nguyện
  location: string; // Khu vực
}

// Định nghĩa cấu trúc của User (cho TypeScript)
export interface IUser extends Document {
  zaloId: string;
  displayName: string;
  avatar: string;
  role: 'VOLUNTEER' | 'ADMIN';
  profile: IUserProfile;
  gamification: {
    points: number;
    badges: Types.Array<IUserBadge>;
  };
}

// (MỚI) Định nghĩa Schema cho IUserBadge
const userBadgeSchema = new Schema({
  badge: { type: Schema.Types.ObjectId, ref: 'Badge', required: true },
  dateAchieved: { type: Date, default: Date.now }
}, { _id: false }); // Không cần _id cho sub-document

const userSchema = new Schema<IUser>({
  zaloId: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  avatar: { type: String },
  role: { type: String, enum: ['VOLUNTEER', 'ADMIN'], default: 'VOLUNTEER' },
  profile: {
    skills: [String],
    interests: [String],
    location: String,
  },
  gamification: {
    points: { type: Number, default: 0 },
    badges: [userBadgeSchema] 
  }
}, { timestamps: true });

const User = model<IUser>('User', userSchema);
export default User;