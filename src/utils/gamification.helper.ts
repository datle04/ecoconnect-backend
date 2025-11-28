import { Types } from "mongoose";
import User from "../models/user.model";
import Event from "../models/event.model";
import Badge from "../models/badge.model";

// Định nghĩa các Badge chuẩn của bạn
export const BADGES = {
  JOIN_10: {
    name: 'Tình nguyện viên 10 event',
    description: 'Đã tham gia 10 hoạt động',
    dateAchieved: new Date(),
  },
  CREATE_3: {
    name: 'Nhà tổ chức 3 event',
    description: 'Đã tổ chức 3 hoạt động thành công',
    dateAchieved: new Date(),
  },
};


// (MỚI) Định nghĩa số điểm thưởng
export const POINTS_FOR_PARTICIPATING = 10;
export const POINTS_FOR_CREATING = 50; // Thưởng cho người tổ chức

const BADGES_IDS = {
  JOIN_10: 'JOIN_10',
  CREATE_3: 'CREATE_3',
};

export const checkAndAwardBadges = async (userId: Types.ObjectId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Lấy danh sách ID các badge đã có (để populate và so sánh)
    await user.populate('gamification.badges.badge');
    const existingBadgeIds = user.gamification.badges.map(
      (b: any) => b.badge.badgeId // 'b.badge.badgeId' là 'JOIN_10'
    );
    const badgesToPush = [];

    // 1. Kiểm tra Badge "Tham gia 10 event"
    if (!existingBadgeIds.includes(BADGES_IDS.JOIN_10)) {
      const joinedCount = await Event.countDocuments({
        participants: userId,
        status: 'COMPLETED',
      });

      if (joinedCount >= 10) {
        const badgeDoc = await Badge.findOne({ badgeId: BADGES_IDS.JOIN_10 }); // Tìm _id của badge
        if(badgeDoc) {
          badgesToPush.push({ badge: badgeDoc._id, dateAchieved: new Date() });
        }
      }
    }

    // 2. Kiểm tra Badge "Tổ chức 3 event"
    if (!existingBadgeIds.includes(BADGES_IDS.CREATE_3)) {
      const createdCount = await Event.countDocuments({
        createdBy: userId,
        status: 'COMPLETED',
      });

      if (createdCount >= 3) {
         const badgeDoc = await Badge.findOne({ badgeId: BADGES_IDS.CREATE_3 }); // Tìm _id của badge
        if(badgeDoc) {
          badgesToPush.push({ badge: badgeDoc._id, dateAchieved: new Date() });
        }
      }
    }

    // 3. Cập nhật user nếu có badge mới
    if (badgesToPush.length > 0) {
      user.gamification.badges.push(...badgesToPush);
      await user.save();
      console.log(`Đã trao ${badgesToPush.length} badge cho user ${userId}`);
    }
  } catch (error) {
    console.error(`Lỗi khi kiểm tra badge cho user ${userId}:`, error);
  }
};