// src/services/zalo.service.ts
import axios from 'axios';
import { IUser } from '../models/user.model'; // Import kiểu IUser

// Kiểu dữ liệu trả về từ Zalo
interface IZaloUserInfo {
  id: string;
  name: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

/**
 * Lấy thông tin người dùng Zalo bằng Access Token (được cung cấp từ client)
 * Đây là cách xác thực an toàn.
 */
export const getZaloUserInfo = async (accessToken: string): Promise<Partial<IUser>> => {
  try {
    // 1. Lấy thông tin người dùng bằng accessToken
    const url = 'https://graph.zalo.me/v2.0/me';
    const response = await axios.get<IZaloUserInfo>(url, {
      params: {
        access_token: accessToken,
        fields: 'id,name,picture', // Các trường bạn muốn lấy
      },
    });

    const { id, name, picture } = response.data;

    // 2. Chuẩn hóa dữ liệu trả về theo Model của chúng ta
    return {
      zaloId: id,
      displayName: name,
      avatar: picture?.data?.url || '',
    };
  } catch (error: any) {
    // Nếu token hết hạn hoặc không hợp lệ, Zalo sẽ trả về lỗi 401
    console.error('Lỗi khi lấy Zalo User Info (Token có thể không hợp lệ):', error.response?.data || error.message);
    throw new Error('Lỗi khi xác thực với Zalo (Token không hợp lệ)');
  }
};