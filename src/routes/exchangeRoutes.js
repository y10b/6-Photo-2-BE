import express from 'express';
import {
  postExchangeProposal,
  acceptExchange,
  rejectExchange,
  getExchangeProposals,
  cancelExchange,
  getShopExchangeProposals, // 새로 추가: 판매 게시글에 대한 교환 제안 목록 조회
} from '../controllers/exchangeController.js';
import { verifyAccessToken, extractUserFromToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/exchange', verifyAccessToken, extractUserFromToken, postExchangeProposal);
router.post('/exchange/:id/accept', verifyAccessToken, extractUserFromToken, acceptExchange);
router.post('/exchange/:id/reject', verifyAccessToken, extractUserFromToken, rejectExchange);
router.post('/exchange/:id/cancel', verifyAccessToken, extractUserFromToken, cancelExchange);
router.get('/exchange/card/:cardId', verifyAccessToken, extractUserFromToken, getExchangeProposals);
router.get('/exchange/shop/:shopId', verifyAccessToken, extractUserFromToken, getShopExchangeProposals); // 새로 추가

export default router;
