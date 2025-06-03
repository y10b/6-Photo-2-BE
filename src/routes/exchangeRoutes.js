import express from 'express';
import {
  getExchangeProposals,
  createExchangeRequest,
  updateExchangeStatus,
} from '../controllers/exchangeController.js';
import { verifyAccessToken, extractUserFromToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// 교환 제안 목록 조회
router.get('/:shopId', verifyAccessToken, extractUserFromToken, getExchangeProposals);

// 교환 요청 생성
router.post('/:shopId', verifyAccessToken, extractUserFromToken, createExchangeRequest);

// 교환 요청 상태 업데이트 (승인/거절)
router.patch('/:exchangeId/status', verifyAccessToken, extractUserFromToken, updateExchangeStatus);

export default router;
