import express from 'express';
import {
  getAllCards,
  getCardDetail,
  getMySales,
  getMyIDLECards,
  createMyCard,
  getCardCreationQuota,
} from '../controllers/photoController.js';
import {
  verifyAccessToken,
  extractUserFromToken,
} from '../middlewares/auth.middleware.js';

const router = express.Router();

// 전체 카드 조회 (인증 불필요)
router.get('/cards', getAllCards);

// 카드 상세 조회 (인증 필요)
router.get(
  '/cards/:id',
  verifyAccessToken,
  extractUserFromToken,
  getCardDetail,
);

// 마이페이지 (인증 필요)
router.use('/mypage', verifyAccessToken, extractUserFromToken);
router.get('/mypage/idle-cards', getMyIDLECards);
router.post('/mypage/create', createMyCard);
router.get('/mypage/sales', getMySales);
router.get('/mypage/creation-quota', getCardCreationQuota);

export default router;
