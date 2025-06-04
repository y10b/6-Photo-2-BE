import express from 'express';
import * as purchaseController from '../controllers/purchaseController.js';
import { verifyAccessToken, extractUserFromToken } from "../middlewares/auth.middleware.js";

const purchaseRouter = express.Router();

purchaseRouter.get('/:shopId', verifyAccessToken, extractUserFromToken, purchaseController.getShopDetail);

purchaseRouter.post('/:shopId', verifyAccessToken, extractUserFromToken, purchaseController.purchaseCardController);
export default purchaseRouter;
