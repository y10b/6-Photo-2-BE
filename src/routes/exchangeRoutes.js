import express from 'express';
import {
  getExchangeProposals,
} from '../controllers/exchangeController.js';
import { verifyAccessToken, extractUserFromToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// 교환 제안 목록 조회 라우트만 유지
router.get('/exchange/:shopId', verifyAccessToken, extractUserFromToken, getExchangeProposals);

export default router;
