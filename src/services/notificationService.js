import { notificationRepository } from "../repositories/notificationRepository.js";
import { formatNotificationTime } from "../utils/timeFormat.js";

export const notificationService = {
  // 알림 생성
  async createNotification(userId, type, content) {
    return await notificationRepository.create(userId, type, content);
  },

  // 알림 조회
  async getUserNotification(userId) {
    const notifications = await notificationRepository.findAllByUserId(userId);
    return notifications.map((n) => ({
      id: n.id,
      content: n.content,
      type: n.notificationType,
      isRead: n.isRead,
      formattedTime: formatNotificationTime(n.createdAt),
    }));
  },

  // 읽음 처리
  async markAsRead(id) {
    return await notificationRepository.markAsRead(id);
  },
};
