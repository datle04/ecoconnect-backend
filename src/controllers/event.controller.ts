// src/controllers/event.controller.ts
import { Request, Response } from 'express';
import Event from '../models/event.model';
import User, { IUser } from '../models/user.model'; // Import kiểu IUser
import mongoose, { Types } from 'mongoose';
import Badge from '../models/badge.model';
import { checkAndAwardBadges, POINTS_FOR_CREATING, POINTS_FOR_PARTICIPATING } from '../utils/gamification.helper';

/**
 * Tạo một Event mới (Community Event)
 * POST /api/events
 * Yêu cầu: Đã đăng nhập (đã qua middleware "protect")
 */
export const createEvent = async (req: Request, res: Response) => {
  try {
    const { title, description, startTime, endTime, location, maxVolunteers, image } = req.body;
    
    // Lấy user ID từ req.user (đã được middleware "protect" gắn vào)
    const user = req.user as IUser;

    // Kiểm tra các trường bắt buộc (bạn có thể thêm nhiều hơn)
    if (!title || !description || !startTime || !location) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
    }

    const newEvent = new Event({
      title,
      description,
      startTime,
      endTime,
      location,
      maxVolunteers,
      image,
      createdBy: user._id, // Gán người tạo event chính là user đang đăng nhập
      status: 'PENDING_APPROVAL', // Mặc định chờ admin duyệt (theo MVP)
    });

    const savedEvent = await newEvent.save();

    res.status(201).json(savedEvent);
  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server khi tạo event', error: error.message });
  }
};

/**
 * Lấy danh sách tất cả Event (đã được duyệt)
 * GET /api/events
 * Yêu cầu: Công khai (Không cần đăng nhập)
 */
export const getAllEvents = async (req: Request, res: Response) => {
  try {
    // Chỉ lấy các event đã được 'APPROVED' để hiển thị công khai
    const events = await Event.find({ status: 'APPROVED' })
      .populate('createdBy', 'displayName avatar') // Lấy thông tin người tạo
      .sort({ startTime: 1 }); // Sắp xếp theo event diễn ra sớm nhất

    res.status(200).json(events);
  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server khi lấy events', error: error.message });
  }
};

/**
 * Lấy chi tiết của 1 Event
 * GET /api/events/:id
 * Yêu cầu: Công khai
 */
export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ message: 'Event ID không hợp lệ' });
    }

    // Dòng code CŨ (chỉ tìm 'APPROVED'):
    // const event = await Event.findOne({ _id: id, status: 'APPROVED' }) ...

    // Dòng code MỚI (Cho phép xem cả 'APPROVED' và 'COMPLETED'):
    const event = await Event.findOne({ 
      _id: id, 
      status: { $in: ['APPROVED', 'COMPLETED'] } // <-- SỬA LẠI DÒNG NÀY
    })
      .populate('createdBy', 'displayName avatar') 
      .populate('participants', 'displayName avatar'); 

    if (!event) {
      return res.status(404).json({ message: 'Không tìm thấy event hoặc event chưa được duyệt' });
    }

    res.status(200).json(event);
  } catch (error: any) {
    // ...
  }
};

/**
 * Tham gia một Event
 * POST /api/events/:id/join
 * Yêu cầu: Đã đăng nhập (đã qua "protect")
 */
export const joinEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; 
    const userId = req.user!._id; 

    if (!mongoose.Types.ObjectId.isValid(id!)) {
      return res.status(400).json({ message: 'Event ID không hợp lệ' });
    }

    const event = await Event.findById(id);

    // 1. Kiểm tra Event
    if (!event) {
      return res.status(404).json({ message: 'Không tìm thấy event' });
    }
    if (event.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Không thể tham gia event chưa được duyệt hoặc đã kết thúc' });
    }

    // 2. Kiểm tra logic tham gia
    // Kiểm tra nếu đã full
    if (event.maxVolunteers > 0 && event.participants.length >= event.maxVolunteers) {
      return res.status(400).json({ message: 'Event đã đủ số lượng người tham gia' });
    }
    // Kiểm tra nếu đã tham gia rồi (dùng .some() để so sánh ObjectId)
    if (event.participants.includes(userId)) {
      return res.status(400).json({ message: 'Bạn đã tham gia event này rồi' });
    }
    
    // 3. Thêm user vào danh sách tham gia
    event.participants.push(userId);
    await event.save();

    res.status(200).json({ message: 'Tham gia event thành công', event });

  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server khi tham gia event', error: error.message });
  }
};

/**
 * Hủy tham gia một Event
 * DELETE /api/events/:id/leave
 * Yêu cầu: Đã đăng nhập (đã qua "protect")
 */
export const leaveEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // ID của Event
    const userId = req.user!._id; // ID của User

    if (!mongoose.Types.ObjectId.isValid(id!)) {
      return res.status(400).json({ message: 'Event ID không hợp lệ' });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: 'Không tìm thấy event' });
    }

    // 1. Kiểm tra xem user có trong danh sách tham gia không
    const isParticipant = event.participants.includes(userId);
    
    if (!isParticipant) {
      return res.status(400).json({ message: 'Bạn chưa tham gia event này' });
    }

    // 2. Xóa user khỏi danh sách (Mongoose có hàm .pull() tiện lợi)
    event.participants.pull(userId);
    await event.save();
    
    res.status(200).json({ message: 'Hủy tham gia event thành công', event });

  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server khi hủy tham gia event', error: error.message });
  }
};

/**
 * [PROTECTED] Lấy danh sách các event do người dùng hiện tại tạo ra
 * GET /api/events/my-events
 */
export const getMyEvents = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;

    // Tìm tất cả event có trường 'createdBy' khớp với ID của người dùng
    const events = await Event.find({ createdBy: userId })
      .sort({ createdAt: -1 }); // Sắp xếp mới nhất lên đầu

    res.status(200).json(events);
  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

/**
 * [PROTECTED] Cập nhật event do người dùng sở hữu
 * PUT /api/events/:id
 */
export const updateMyEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // ID của event
    const userId = req.user!._id; // ID của người tạo
    const { title, description, startTime, endTime, location, maxVolunteers, image } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ message: 'Event ID không hợp lệ' });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: 'Không tìm thấy event' });
    }

    // 1. Kiểm tra quyền sở hữu: Người cập nhật có phải là người tạo không?
    if (String(event.createdBy) !== String(userId)) {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật event này' });
    }

    // 2. (Logic nghiệp vụ) Chỉ cho phép cập nhật event đang chờ duyệt
    if (event.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ message: 'Chỉ có thể cập nhật event đang chờ duyệt' });
    }

    // 3. Cập nhật các trường
    event.title = title || event.title;
    event.description = description || event.description;
    event.startTime = startTime || event.startTime;
    event.endTime = endTime || event.endTime;
    event.location = location || event.location;
    event.maxVolunteers = maxVolunteers || event.maxVolunteers;
    event.image = image || event.image;

    const updatedEvent = await event.save();

    res.status(200).json(updatedEvent);
  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

/**
 * [PROTECTED] Xóa event do người dùng sở hữu
 * DELETE /api/events/:id
 */
export const deleteMyEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ message: 'Event ID không hợp lệ' });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: 'Không tìm thấy event' });
    }

    // 1. Kiểm tra quyền sở hữu
    if (String(event.createdBy) !== String(userId)) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa event này' });
    }

    // 2. (Logic nghiệp vụ) Chỉ cho phép xóa event đang chờ duyệt hoặc đã bị từ chối
    if (event.status === 'APPROVED' || event.status === 'COMPLETED') {
       return res.status(400).json({ message: 'Không thể xóa event đã được duyệt hoặc đã hoàn thành' });
    }
    
    // 3. Xóa event
    await event.deleteOne(); // Dùng .deleteOne() (hoặc .findByIdAndDelete(id))

    res.status(200).json({ message: 'Xóa event thành công' });
  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

/**
 * [PROTECTED] Người tạo đánh dấu Event là đã hoàn thành
 * (PHIÊN BẢN NÂNG CẤP VỚI GAMIFICATION)
 * PATCH /api/events/:id/complete
 */
export const completeEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id; // ID của người tạo (Creator)

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ message: 'Event ID không hợp lệ' });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: 'Không tìm thấy event' });
    }

    // 1. Kiểm tra quyền sở hữu
    if (String(event.createdBy) !== String(userId)) {
      return res.status(403).json({ message: 'Chỉ người tạo mới có quyền hoàn thành event này' });
    }

    // 2. Kiểm tra logic
    if (event.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Chỉ có thể hoàn thành event đã được duyệt' });
    }

    // 3. Cập nhật status
    event.status = 'COMPLETED';
    await event.save(); // Lưu event ngay lập tức

    // === (MỚI) LOGIC GAMIFICATION BẮT ĐẦU ===

    // 4. Cộng điểm cho TẤT CẢ người tham gia 
    const participantIds = event.participants; // Lấy danh sách ID
    if (participantIds && participantIds.length > 0) {
      await User.updateMany(
        { _id: { $in: participantIds } }, // Tìm tất cả user trong danh sách
        { $inc: { 'gamification.points': POINTS_FOR_PARTICIPATING } } // Cộng 10 điểm
      );
    }

    // 5. Cộng điểm cho NGƯỜI TẠO 
    await User.findByIdAndUpdate(userId, {
      $inc: { 'gamification.points': POINTS_FOR_CREATING }, // Cộng 50 điểm
    });

    // 6. Kiểm tra & trao Badges (Chạy ngầm)
    
    // Kiểm tra cho chính người tạo
    checkAndAwardBadges(new Types.ObjectId(userId as string));
    
    // Kiểm tra cho tất cả người tham gia
    if (participantIds && participantIds.length > 0) {
      participantIds.forEach((pId) => checkAndAwardBadges(new Types.ObjectId(pId as string)));
    }

    // === LOGIC GAMIFICATION KẾT THÚC ===

    res.status(200).json({ message: 'Đánh dấu event hoàn thành & đã trao điểm', event });

  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
