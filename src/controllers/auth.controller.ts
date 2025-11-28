// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { getZaloUserInfo } from '../services/zalo.service';

/**
 * Tạo một JWT token cho người dùng
 */
const generateToken = (userId: string) => {
  return jwt.sign(
    { id: userId }, // Payload: Chứa ID người dùng của DB chúng ta
    process.env.JWT_SECRET as string,
    { expiresIn: '30d' } // Token hết hạn trong 30 ngày
  );
};

/**
 * Đăng nhập hoặc Đăng ký bằng Zalo
 * POST /api/auth/zalo/login
 */
export const loginWithZalo = async (req: Request, res: Response) => {
  try {
    // 1. Lấy accessToken từ body (thay vì authCode)
    const { accessToken } = req.body;
    console.log(accessToken);
    
    if (!accessToken) {
      return res.status(400).json({ message: 'accessToken là bắt buộc' });
    }

    // 2. Gọi service để lấy thông tin Zalo user (bằng accessToken)
    const zaloUserInfo = await getZaloUserInfo(accessToken);

    if (!zaloUserInfo.zaloId) {
      return res.status(500).json({ message: 'Không thể lấy thông tin Zalo ID' });
    }

    // 3. Tìm User trong DB bằng zaloId
    let user = await User.findOne({ zaloId: zaloUserInfo.zaloId });

    if (user) {
      // 4a. Nếu User tồn tại -> Đăng nhập
      user.displayName = zaloUserInfo.displayName || user.displayName;
      user.avatar = zaloUserInfo.avatar || user.avatar;
      await user.save();
    } else {
      // 4b. Nếu User không tồn tại -> Đăng ký
      user = new User({
        zaloId: zaloUserInfo.zaloId,
        displayName: zaloUserInfo.displayName,
        avatar: zaloUserInfo.avatar,
      });
      await user.save();
    }

    // 5. Tạo JWT token của hệ thống EcoConnect
    const token = generateToken(user._id as string);

    // 6. Trả về token và thông tin user cho Zalo Mini App
    res.status(200).json({
      token,
      user: {
        id: user._id,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server nội bộ', error: error.message });
  }
};