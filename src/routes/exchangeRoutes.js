import express from 'express';
import {
  postExchangeProposal,
  acceptExchange,
  rejectExchange,
  getExchangeProposals,
} from '../controllers/exchangeController.js';
import { verifyAccessToken, extractUserFromToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// 미들웨어 체인 순서 확인
router.post('/exchange', verifyAccessToken, extractUserFromToken, postExchangeProposal);
router.post('/exchange/:id/accept', verifyAccessToken, extractUserFromToken, acceptExchange);
router.post('/exchange/:id/reject', verifyAccessToken, extractUserFromToken, rejectExchange);
router.get('/exchange/:shopId', verifyAccessToken, extractUserFromToken, getExchangeProposals);

export default router;
