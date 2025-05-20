import express from "express";
import {
  proposeExchange,
  acceptExchange,
  rejectExchange,
  getExchangeProposals,
} from "../controllers/exchangeController.js";
import {
  verifyAccessToken,
  extractUserFromToken,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// ✅ 두 개의 미들웨어를 순차적으로 연결해야 req.user.id 사용 가능
router.post(
  "/exchange",
  verifyAccessToken,
  extractUserFromToken,
  proposeExchange
);
router.post(
  "/exchange/:id/accept",
  verifyAccessToken,
  extractUserFromToken,
  acceptExchange
);
router.post(
  "/exchange/:id/reject",
  verifyAccessToken,
  extractUserFromToken,
  rejectExchange
);
router.get(
  "/exchange/card/:cardId",
  verifyAccessToken,
  extractUserFromToken,
  getExchangeProposals
);

export default router;
