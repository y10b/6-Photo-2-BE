import express from 'express';
import * as photoCardController from '../controllers/purchaseController.js';

const purchaseRouter = express.Router();

purchaseRouter.get('/:id', photoCardController.getPhotoCardDetail);

export default purchaseRouter;
