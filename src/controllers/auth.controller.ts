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
    const { accessToken } = req.body;
    console.log("1. [DEBUG] Đã nhận AccessToken:", accessToken.substring(0, 10) + "...");

    // BƯỚC KIỂM TRA 1: Gọi Zalo API
    console.log("2. [DEBUG] Đang gọi getZaloUserInfo...");
    const zaloUserInfo = await getZaloUserInfo(accessToken);
    console.log("3. [DEBUG] Đã lấy thông tin Zalo:", zaloUserInfo.displayName);

    if (!zaloUserInfo.zaloId) {
        console.log("!!! [ERROR] Không có Zalo ID");
        return res.status(500).json({ message: 'Không thể lấy thông tin Zalo ID' });
    }

    // BƯỚC KIỂM TRA 2: Gọi Database
    console.log("4. [DEBUG] Đang tìm User trong DB...");
    let user = await User.findOne({ zaloId: zaloUserInfo.zaloId });
    console.log("5. [DEBUG] Kết quả tìm User:", user ? "Đã tồn tại" : "Chưa tồn tại");

    if (user) {
      user.displayName = zaloUserInfo.displayName || user.displayName;
      user.avatar = zaloUserInfo.avatar || user.avatar;
      await user.save();
      console.log("6. [DEBUG] Đã cập nhật User");
    } else {
      console.log("6. [DEBUG] Đang tạo User mới...");
      user = new User({
        zaloId: zaloUserInfo.zaloId,
        displayName: zaloUserInfo.displayName,
        avatar: zaloUserInfo.avatar,
      });
      await user.save();
      console.log("7. [DEBUG] Đã lưu User mới");
    }

    // BƯỚC KIỂM TRA 3: Tạo JWT
    console.log("8. [DEBUG] Đang tạo JWT Token...");
    // Kiểm tra xem JWT_SECRET có tồn tại không
    if (!process.env.JWT_SECRET) {
        throw new Error("Thiếu biến môi trường JWT_SECRET!");
    }
    const token = generateToken(user._id as string);
    console.log("9. [DEBUG] Tạo Token thành công");

    res.status(200).json({
      token,
      user: {
        id: user._id,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
      },
    });
    console.log("10. [DEBUG] Đã gửi phản hồi về Frontend -> XONG");

  } catch (error: any) {
    console.error("!!! [CRITICAL ERROR] Lỗi xảy ra tại Backend:", error);
    res.status(500).json({ message: 'Lỗi server nội bộ', error: error.message });
  }
};