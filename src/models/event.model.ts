// src/models/event.model.ts
import { Schema, model, Document, Types } from 'mongoose';
import { IUser } from './user.model';

type EventStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';

export interface IEvent extends Document {
  title: string;
  description: string;
  image: string;
  startTime: Date;
  endTime: Date;
  location: string;
  maxVolunteers: number;
  status: EventStatus;
  createdBy: IUser['_id']; // Người tạo
  participants: Types.Array<IUser['_id']>; // Người tham gia
}

const eventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  location: { type: String, required: true },
  maxVolunteers: { type: Number, default: 10 },
  status: {
    type: String,
    enum: ['PENDING_APPROVAL', 'APPROVED', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING_APPROVAL',
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const Event = model<IEvent>('Event', eventSchema);
export default Event;