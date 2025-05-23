import express from 'express';
import {
  getAllCards,
  getCardDetail,
  getMySales,
  getMyIDLECards,
} from '../controllers/photoController.js';
// import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/cards", getAllCards);
router.get("/cards/:id", getCardDetail);
router.get("/mypage/cards", (req, res, next) => {
  req.user = { id: 2 }; // 임시 로그인 사용자 ID
  getMyCards(req, res, next);
});
router.get("/mypage/idle-cards", (req, res, next) => {
  req.user = { id: 2 }; // 임시 로그인 사용자 ID
  getMyIDLECards(req, res, next);
});
router.get("/mypage/sales", (req, res, next) => {
  req.user = { id: 2 }; // 임시 로그인 사용자 ID
  getMySales(req, res, next);
});


export default router;
