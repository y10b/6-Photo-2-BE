import { notificationService } from "../services/notificationService.js";

export const notificationController = {
  // 알림 생성
  async create(req, res, next) {
    try {
      const userId = req.user.id;
      const { type, content } = req.body;
      const result = await notificationService.createNotification(
        userId,
        type,
        content
      );

      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  },

  // 알림 조회
  async list(req, res, next) {
    try {
      const userId = parseInt(req.user.id);
      const result = await notificationService.getUserNotification(userId);

      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  },

  // 읽음 처리
  async markAsRead(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const result = await notificationService.markAsRead(id);

      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  },
};
