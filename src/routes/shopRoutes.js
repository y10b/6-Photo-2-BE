import express from 'express';
import shopController from '../controllers/shopController.js';
import {
  extractUserFromToken,
  verifyAccessToken,
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post(
  '/shop',
  verifyAccessToken,
  extractUserFromToken,
  shopController.registerShop,
);

router.get(
  '/shop/:shopId',
  verifyAccessToken,
  extractUserFromToken,
  shopController.getShopDetail,
);

router.put(
  '/shop/:shopId',
  verifyAccessToken,
  extractUserFromToken,
  shopController.updateShop,
);

router.delete(
  '/shop/:shopId',
  verifyAccessToken,
  extractUserFromToken,
  shopController.deleteShop,
);

export default router;
