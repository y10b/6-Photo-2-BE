import express from 'express';
import {
  postExchangeProposal,
  postExchangeProposalWithShopId,
  acceptExchange,
  rejectExchange,
  getExchangeProposals,
  getMyExchangeRequests,
  getMyExchangeableCards
} from '../controllers/exchangeController.js';
import { verifyAccessToken, extractUserFromToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// 기존 라우트 유지
router.post('/exchange', verifyAccessToken, extractUserFromToken, postExchangeProposal);
router.post('/exchange/:id/accept', verifyAccessToken, extractUserFromToken, acceptExchange);
router.post('/exchange/:id/reject', verifyAccessToken, extractUserFromToken, rejectExchange);
router.get('/exchange/:shopId', verifyAccessToken, extractUserFromToken, getExchangeProposals);

// 새로운 라우트 추가
// 판매글 ID를 이용한 교환 제안
router.post('/exchange/:shopId/propose', verifyAccessToken, extractUserFromToken, postExchangeProposalWithShopId);
// 특정 판매글에 대한 내 교환 제안 목록 조회
router.get('/exchange/shop/:shopId/my-requests', verifyAccessToken, extractUserFromToken, getMyExchangeRequests);
// 교환 가능한 내 카드 목록 조회
router.get('/exchange/my-cards', verifyAccessToken, extractUserFromToken, getMyExchangeableCards);

export default router;
