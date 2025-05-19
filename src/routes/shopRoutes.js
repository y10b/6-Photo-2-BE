import express from "express";
import shopController from "../controllers/shopController.js";

const router = express.Router();

// 임시 인증 미들웨어
const tempAuthMiddleware = (req, res, next) => {
  req.user = { id: 14 };
  next();
};

router.post("/shop", tempAuthMiddleware, shopController.registerShop);
router.put("/shop/:shopId", tempAuthMiddleware, shopController.updateShop);
router.delete("/shop/:shopId", tempAuthMiddleware, shopController.deleteShop);

export default router;
