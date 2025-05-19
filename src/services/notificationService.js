import { notificationRepository } from "../repositories/notificationRepository.js";

export const notificationService = {
  async createNotification(userId, type, content) {
    return await notificationRepository.create(userId, type, content);
  },
};
