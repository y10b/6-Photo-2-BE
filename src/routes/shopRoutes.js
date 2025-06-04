import express from 'express';
import shopController from '../controllers/shopController.js';
import {
  extractUserFromToken,
  verifyAccessToken,
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post(
  '/',
  verifyAccessToken,
  extractUserFromToken,
  shopController.registerShop,
);

router.get(
  '/:shopId',
  verifyAccessToken,
  extractUserFromToken,
  shopController.getShopDetail,
);

router.put(
  '/:shopId',
  verifyAccessToken,
  extractUserFromToken,
  shopController.updateShop,
);

router.delete(
  '/:shopId',
  verifyAccessToken,
  extractUserFromToken,
  shopController.deleteShop,
);

export default router;
