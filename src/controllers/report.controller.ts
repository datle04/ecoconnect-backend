// src/controllers/report.controller.ts
import { Request, Response } from 'express';
import ReportTicket from '../models/reportTicket.model';
import mongoose from 'mongoose';

/**
 * [PROTECTED] Tạo một Báo cáo (Ticket) mới
 * POST /api/report
 */
export const createReportTicket = async (req: Request, res: Response) => {
  try {
    const { reportType, reportedEvent, reportedUser, reason } = req.body;
    const reporter = req.user!._id; // Lấy từ middleware "protect"

    // 1. Kiểm tra dữ liệu đầu vào
    if (!reportType || !reason) {
      return res.status(400).json({ message: 'Loại báo cáo và lý do là bắt buộc' });
    }
    
    // 2. Phải báo cáo 1 Event hoặc 1 User (theo Model)
    if (!reportedEvent && !reportedUser) {
      return res.status(400).json({ message: 'Phải cung cấp Event ID hoặc User ID để báo cáo' });
    }
    
    // 3. (Tùy chọn) Kiểm tra xem có tự báo cáo chính mình không
    if (reportedUser && String(reportedUser) === String(reporter)) {
       return res.status(400).json({ message: 'Bạn không thể tự báo cáo chính mình' });
    }

    // 4. Tạo ticket
    const newTicket = new ReportTicket({
      reporter,
      reportType,
      reportedEvent: reportedEvent || undefined,
      reportedUser: reportedUser || undefined,
      reason,
      status: 'PENDING', // Mặc định là chờ xử lý
    });

    await newTicket.save();
    res.status(201).json({ message: 'Gửi báo cáo thành công', ticket: newTicket });

  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};