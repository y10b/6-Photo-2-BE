import express from 'express';
import {notificationController} from '../controllers/notificationController.js';
import {
  extractUserFromToken,
  verifyAccessToken,
} from '../middlewares/auth.middleware.js';

const notificationRouter = express.Router();

// 임시 인증 미들웨어
const tempAuthMiddleware = (req, res, next) => {
  req.user = {id: 14};
  next();
};

notificationRouter.post(
  '/',
  verifyAccessToken,
  extractUserFromToken,
  notificationController.create,
);
notificationRouter.get(
  '/',
  verifyAccessToken,
  extractUserFromToken,
  notificationController.list,
);
notificationRouter.patch('/:id/read', notificationController.markAsRead);

export default notificationRouter;
