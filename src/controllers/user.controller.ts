// src/controllers/user.controller.ts
import { Request, Response } from 'express';
import User from '../models/user.model';
import mongoose from 'mongoose';
import Event from '../models/event.model';

/**
 * Lấy thông tin của người dùng đang đăng nhập
 * GET /api/users/me
 * Yêu cầu: Đã được "protect" bởi authMiddleware
 */
export const getMe = (req: Request, res: Response) => {
  // Middleware "protect" đã chạy trước đó và gắn req.user
  // Chúng ta chỉ cần trả về nó
  res.status(200).json(req.user);
};

/**
 * [PROTECTED] Cập nhật hồ sơ cá nhân của người dùng
 * PUT /api/users/me/profile
 */
export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    // Chỉ cho phép cập nhật các trường trong 'profile'
    const { skills, interests, location } = req.body;

    // Tìm user và cập nhật
    // Chúng ta dùng findByIdAndUpdate để chỉ cập nhật các trường mong muốn
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'profile.skills': skills,
          'profile.interests': interests,
          'profile.location': location,
        },
      },
      { new: true, runValidators: true } // Trả về user đã cập nhật
    ).select('-password'); // Luôn loại trừ các trường nhạy cảm

    if (!updatedUser) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.status(200).json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

/**
 * [PUBLIC] Lấy hồ sơ công khai của một người dùng
 * GET /api/users/:id/profile
 */
export const getUserProfileById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ message: 'User ID không hợp lệ' });
    }

    // Rất quan trọng: Chỉ .select() các trường CÔNG KHAI
    // Tuyệt đối không trả về zaloId, email (nếu có), v.v.
    const user = await User.findById(id)
      .select('displayName avatar profile gamification createdAt')
      .populate('gamification.badges.badge'); // <-- DÙNG POPULATE

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

/**
 * [PROTECTED] Lấy lịch sử event của người dùng hiện tại
 * GET /api/users/me/history
 */
export const getMyHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;

    // 1. Tìm các event người này đã TỔ CHỨC
    const createdEvents = await Event.find({ createdBy: userId })
      .select('title status startTime location') // Chỉ lấy thông tin cần thiết
      .sort({ startTime: -1 });

    // 2. Tìm các event người này đã THAM GIA (và đã hoàn thành/được duyệt)
    const joinedEvents = await Event.find({
      participants: userId, // Tìm các event có user này trong mảng participants
      status: { $in: ['COMPLETED', 'APPROVED'] } // Chỉ lấy event đã/đang diễn ra
    })
      .select('title status startTime location')
      .sort({ startTime: -1 });

    res.status(200).json({
      created: createdEvents,
      joined: joinedEvents,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};