import express from 'express';
import {
  getMe,
  updateMe,
  getMyCards,
  getMySales,
  getUserByNickname,
} from '../controllers/userController.js';
import {
  verifyAccessToken,
  extractUserFromToken,
} from '../middlewares/auth.middleware.js';
import {pointController} from '../controllers/pointController.js';

const router = express.Router();

// 사용자 정보 관련 라우트
router
  .route('/me')
  .get(verifyAccessToken, extractUserFromToken, getMe)
  .patch(verifyAccessToken, extractUserFromToken, updateMe);

// 내 카드 목록
router.get('/me/cards', verifyAccessToken, extractUserFromToken, getMyCards);

// 내 판매 목록
router.get('/me/sales', verifyAccessToken, extractUserFromToken, getMySales);

// 다른 사용자 정보 조회
router.get('/:nickname', getUserByNickname);

// 포인트 뽑기 관련 라우트
router.get(
  '/me/point/check',
  verifyAccessToken,
  extractUserFromToken,
  pointController.checkCooldown,
); // 쿨타임 확인
router.post(
  '/me/point/draw',
  verifyAccessToken,
  extractUserFromToken,
  pointController.draw,
); // 포인트 뽑기

export default router;
