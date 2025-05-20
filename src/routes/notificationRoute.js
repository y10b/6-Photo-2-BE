import express from "express";
import { notificationController } from "../controllers/notificationController.js";

const notificationRouter = express.Router();

// 임시 인증 미들웨어
const tempAuthMiddleware = (req, res, next) => {
  req.user = { id: 14 };
  next();
};

notificationRouter.post("/", tempAuthMiddleware, notificationController.create);
notificationRouter.get("/", tempAuthMiddleware, notificationController.list);
notificationRouter.patch("/:id/read", notificationController.markAsRead);

export default notificationRouter;
