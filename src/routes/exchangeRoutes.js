import express from 'express';
import {
  postExchangeProposal,
  acceptExchange,
  rejectExchange,
  getExchangeProposals,
} from '../controllers/exchangeController.js';
import {
  verifyAccessToken,
  extractUserFromToken,
} from '../middlewares/auth.middleware.js';

const router = express.Router();

// 교환 제안 생성
router.post(
  '/exchange',
  verifyAccessToken,
  extractUserFromToken,
  postExchangeProposal, // ✅ 이름 수정
);

// 교환 수락
router.post(
  '/exchange/:id/accept',
  verifyAccessToken,
  extractUserFromToken,
  acceptExchange,
);

// 교환 거절
router.post(
  '/exchange/:id/reject',
  verifyAccessToken,
  extractUserFromToken,
  rejectExchange,
);

// 카드별 교환 제안 목록 조회
router.get(
  '/exchange/card/:cardId',
  verifyAccessToken,
  extractUserFromToken,
  getExchangeProposals,
);

export default router;
