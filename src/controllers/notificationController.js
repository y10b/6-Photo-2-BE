import { notificationService } from "../services/notificationService.js";

export const notificationController = {
  async create(req, res, next) {
    try {
      const { userId, type, content } = req.body;
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
};
