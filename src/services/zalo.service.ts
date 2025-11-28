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
    const url = 'https://graph.zalo.me/v2.0/me';
    
    // === THÊM LOG DEBUG ===
    console.log("[ZaloService] Đang gọi Zalo API với token:", accessToken.substring(0, 10) + "...");
    
    const response = await axios.get<IZaloUserInfo>(url, {
      params: {
        access_token: accessToken,
        fields: 'id,name,picture',
      },
    });

    // === LOG KẾT QUẢ TRẢ VỀ ===
    console.log("[ZaloService] Zalo Response Data:", JSON.stringify(response.data, null, 2));

    const { id, name, picture } = response.data;

    // Kiểm tra kỹ hơn
    if (!id) {
        console.error("[ZaloService] Lỗi: Không tìm thấy 'id' trong phản hồi Zalo!");
        // Trả về object rỗng để controller xử lý lỗi
        return {}; 
    }

    return {
      zaloId: id,
      displayName: name,
      avatar: picture?.data?.url || '',
    };
  } catch (error: any) {
    // Log lỗi chi tiết nếu axios thất bại (ví dụ: 401, 403)
    console.error('[ZaloService] Lỗi gọi API Zalo:', error.response?.data || error.message);
    throw new Error('Lỗi khi xác thực với Zalo');
  }
};