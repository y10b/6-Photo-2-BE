import express from 'express';
import {
  proposeExchange,
  acceptExchange,
  rejectExchange,
  getExchangeProposals,
} from '../controllers/exchangeController.js';
import {
  verifyAccessToken,
  extractUserFromToken,
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post(
  '/exchange',
  verifyAccessToken,
  extractUserFromToken,
  proposeExchange,
);

router.post(
  '/exchange/:id/accept',
  verifyAccessToken,
  extractUserFromToken,
  acceptExchange,
);

router.post(
  '/exchange/:id/reject',
  verifyAccessToken,
  extractUserFromToken,
  rejectExchange,
);

// ✅ 인증 미들웨어 꼭 필요! → req.user.id 사용 가능하게
router.get(
  '/exchange/card/:cardId',
  verifyAccessToken,
  extractUserFromToken,
  getExchangeProposals,
);

export default router;
