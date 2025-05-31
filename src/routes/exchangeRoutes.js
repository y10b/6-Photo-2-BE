import express from 'express';
import {
  postExchangeProposal,
  acceptExchange,
  rejectExchange,
  getExchangeProposals,
  cancelExchange, // 새로 추가
} from '../controllers/exchangeController.js';
import { verifyAccessToken, extractUserFromToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/exchange', verifyAccessToken, extractUserFromToken, postExchangeProposal);
router.post('/exchange/:id/accept', verifyAccessToken, extractUserFromToken, acceptExchange);
router.post('/exchange/:id/reject', verifyAccessToken, extractUserFromToken, rejectExchange);
router.post('/exchange/:id/cancel', verifyAccessToken, extractUserFromToken, cancelExchange); // 새로 추가
router.get('/exchange/card/:cardId', verifyAccessToken, extractUserFromToken, getExchangeProposals);

export default router;
