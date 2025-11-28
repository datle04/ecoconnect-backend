// src/controllers/admin.controller.ts
import { Request, Response } from 'express';
import Event from '../models/event.model';
import mongoose from 'mongoose';
import ReportTicket from '../models/reportTicket.model';

/**
 * [ADMIN] Lấy danh sách TẤT CẢ Events (có filter)
 * GET /api/admin/events
 * Query params: ?status=... & ?location=...
 */
export const getAllEventsAdmin = async (req: Request, res: Response) => {
  try {
    const { status, location } = req.query;

    // 1. Xây dựng đối tượng filter động
    const filter: any = {};

    if (status) {
      filter.status = status; // Ví dụ: 'PENDING_APPROVAL', 'APPROVED', 'CANCELLED'
    }

    if (location) {
      // Dùng regex để tìm kiếm location một cách tương đối (không phân biệt hoa/thường)
      filter.location = { $regex: location, $options: 'i' };
    }

    // (Tương lai bạn có thể thêm filter theo ngày, theo người tạo, v.v.)

    // 2. Tìm kiếm trong DB với filter
    const events = await Event.find(filter)
      .populate('createdBy', 'displayName avatar')
      .sort({ createdAt: -1 }); 

    res.status(200).json(events);
  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

/**
 * [ADMIN] Duyệt một Event
 * PATCH /api/admin/events/:id/approve
 */
export const approveEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ message: 'Event ID không hợp lệ' });
    }

    const event = await Event.findByIdAndUpdate(
      id,
      { status: 'APPROVED' }, // Giá trị cần cập nhật
      { new: true } // Trả về tài liệu đã được cập nhật
    );

    if (!event) {
      return res.status(404).json({ message: 'Không tìm thấy event' });
    }

    // (Tùy chọn nâng cao: Gửi thông báo cho người tạo event rằng event đã được duyệt)

    res.status(200).json({ message: 'Duyệt event thành công', event });
  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

/**
 * [ADMIN] Từ chối một Event
 * PATCH /api/admin/events/:id/reject
 */
export const rejectEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ message: 'Event ID không hợp lệ' });
    }

    // Chúng ta dùng 'CANCELLED' cho các event bị từ chối
    const event = await Event.findByIdAndUpdate(
      id,
      { status: 'CANCELLED' }, 
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Không tìm thấy event' });
    }
    
    // (Tùy chọn nâng cao: Gửi thông báo cho người tạo event lý do bị từ chối)

    res.status(200).json({ message: 'Từ chối event thành công', event });
  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};


/**
 * [ADMIN] Lấy danh sách tất cả Ticket (có filter)
 * GET /api/admin/tickets
 * Query params: ?status=...
 */
export const getAllTickets = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const filter: any = {};

    if (status) {
      filter.status = status; // PENDING, IN_PROGRESS, RESOLVED...
    }

    const tickets = await ReportTicket.find(filter)
      .populate('reporter', 'displayName') // Người báo cáo
      .populate('reportedEvent', 'title') // Event bị báo cáo (nếu có)
      .populate('reportedUser', 'displayName') // User bị báo cáo (nếu có)
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

/**
 * [ADMIN] Cập nhật trạng thái một Ticket (VD: Đánh dấu "Đã xử lý")
 * PATCH /api/admin/tickets/:id
 */
export const updateTicketStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // VD: "RESOLVED", "IN_PROGRESS", "REJECTED"

    if (!status) {
      return res.status(400).json({ message: 'Trạng thái (status) là bắt buộc' });
    }

    const updatedTicket = await ReportTicket.findByIdAndUpdate(
      id,
      { status: status },
      { new: true }
    );

    if (!updatedTicket) {
      return res.status(404).json({ message: 'Không tìm thấy ticket' });
    }

    res.status(200).json({ message: 'Cập nhật ticket thành công', ticket: updatedTicket });
  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};