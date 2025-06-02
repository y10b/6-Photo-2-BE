import express from 'express';
import userController from '../controllers/userController.js';
import {
  verifyAccessToken,
  extractUserFromToken,
} from '../middlewares/auth.middleware.js';
import pointController from '../controllers/pointController.js';
import prisma from '../prisma/client.js';

const router = express.Router();

// 사용자 정보 관련 라우트
router
  .route('/me')
  .get(verifyAccessToken, extractUserFromToken, userController.getMe)
  .patch(verifyAccessToken, extractUserFromToken, userController.updateMe);

// 내 카드 목록
router.get(
  '/me/cards',
  verifyAccessToken,
  extractUserFromToken,
  userController.getMyCards,
);

// 내 판매 목록
router.get(
  '/me/sales',
  verifyAccessToken,
  extractUserFromToken,
  userController.getMySales,
);

// 다른 사용자 정보 조회
router.get('/:nickname', userController.getUserByNickname);

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

// 개발용: 로그인된 유저의 쿨타임을 임의 시간으로 설정
router.patch(
  '/set-point-cooldown',
  verifyAccessToken,
  extractUserFromToken,
  async (req, res) => {
    const userId = req.user.id;
    const {remainSeconds} = req.body;

    if (
      typeof remainSeconds !== 'number' ||
      remainSeconds < 0 ||
      remainSeconds > 3600
    ) {
      return res
        .status(400)
        .json({message: 'remainSeconds는 0~3600 사이 숫자여야 합니다.'});
    }

    // 현재 시각 기준, 남은 시간을 맞춰서 lastDrawAt 설정
    const now = new Date();
    const adjustedLastDrawAt = new Date(
      now.getTime() - (3600 - remainSeconds) * 1000,
    );

    await prisma.point.upsert({
      where: {userId},
      update: {lastDrawAt: adjustedLastDrawAt},
      create: {
        userId,
        balance: 0,
        lastDrawAt: adjustedLastDrawAt,
      },
    });

    res.json({success: true, remainSeconds});
  },
);

export default router;
