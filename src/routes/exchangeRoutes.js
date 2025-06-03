import express from 'express';
import {
  getExchangeProposals,
  createExchangeRequest,
  updateExchangeStatus,
  cancelExchangeRequest,
  getMyExchangeRequests,
} from '../controllers/exchangeController.js';
import { verifyAccessToken, extractUserFromToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// 내가 보낸 교환 요청 목록 조회 (구매자용)
router.get('/my', verifyAccessToken, extractUserFromToken, getMyExchangeRequests);

// 교환 제안 목록 조회 (판매자용)
router.get('/:shopId', verifyAccessToken, extractUserFromToken, getExchangeProposals);

// 교환 요청 생성 (구매자용)
router.post('/:shopId', verifyAccessToken, extractUserFromToken, createExchangeRequest);

// 교환 요청 상태 변경 (판매자용)
router.patch('/:exchangeId/status', verifyAccessToken, extractUserFromToken, updateExchangeStatus);

// 교환 요청 취소 (구매자용)
router.delete('/:exchangeId', verifyAccessToken, extractUserFromToken, cancelExchangeRequest);

export default router;
