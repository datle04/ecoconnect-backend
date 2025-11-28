// src/models/reportTicket.model.ts
import { Schema, model, Document } from 'mongoose';
import { IUser } from './user.model';
import { IEvent } from './event.model';

type ReportType = 'EVENT' | 'USER';
type TicketStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export interface IReportTicket extends Document {
  reporter: IUser['_id']; // Người báo cáo
  reportType: ReportType; // Báo cáo Event hay User?
  reportedEvent?: IEvent['_id']; // ID của Event bị báo cáo (nếu có)
  reportedUser?: IUser['_id']; // ID của User bị báo cáo (nếu có)
  reason: string; // Lý do báo cáo
  status: TicketStatus; // Trạng thái xử lý của Admin
}

const reportTicketSchema = new Schema<IReportTicket>({
  reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reportType: { type: String, enum: ['EVENT', 'USER'], required: true },
  reportedEvent: { type: Schema.Types.ObjectId, ref: 'Event' },
  reportedUser: { type: Schema.Types.ObjectId, ref: 'User' },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'],
    default: 'PENDING'
  }
}, { timestamps: true });

// Cấu hình để đảm bảo có ít nhất một trong hai reportedEvent hoặc reportedUser
reportTicketSchema.pre('validate', function (next) {
  if (!this.reportedEvent && !this.reportedUser) {
    next(new Error('Một ticket phải báo cáo một Event hoặc một User.'));
  } else {
    next();
  }
});

const ReportTicket = model<IReportTicket>('ReportTicket', reportTicketSchema);
export default ReportTicket;