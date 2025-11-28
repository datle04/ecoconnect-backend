// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken'; // <-- 1. IMPORT Thêm JwtPayload
import User from '../models/user.model';

// 2. ĐỊNH NGHĨA KHUÔN MẪU PAYLOAD CỦA CHÚNG TA
// Nó là một JwtPayload tiêu chuẩn, NHƯNG có thêm trường "id"
interface DecodedToken extends JwtPayload {
  id: string;
}

/**
 * Middleware để xác thực người dùng bằng JWT.
 * Sẽ chặn mọi request không có token hợp lệ.
 * Nếu hợp lệ, nó sẽ tìm user trong DB và gắn vào req.user.
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!token){
        res.status(401).json({message: 'Xác thực thất bại, không có token'})
        return;
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as unknown as DecodedToken;

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        res.status(401).json({ message: 'Không tìm thấy người dùng này' });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Lỗi xác thực token:', error);
      res.status(401).json({ message: 'Xác thực thất bại, token không hợp lệ' });
      return;
    }
  }
};

/**
 * Middleware để kiểm tra quyền Admin.
 * Phải được dùng SAU middleware "protect".
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  // 1. "protect" đã chạy trước, nên chúng ta có req.user
  if (req.user && req.user.role === 'ADMIN') {
    // 2. Nếu là Admin, cho phép đi tiếp
    next();
  } else {
    // 3. Nếu không, trả về lỗi 403 Forbidden (Cấm)
    res.status(403).json({ message: 'Không có quyền Admin' });
  }
};