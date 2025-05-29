import express from 'express';
import * as photoCardController from '../controllers/purchaseController.js';
import { verifyAccessToken, extractUserFromToken } from "../middlewares/auth.middleware.js";

const purchaseRouter = express.Router();

purchaseRouter.get('/:shopId', verifyAccessToken, extractUserFromToken, photoCardController.getShopDetail);

purchaseRouter.post('/:shopId', verifyAccessToken, extractUserFromToken, photoCardController.purchaseCardController);
export default purchaseRouter;
