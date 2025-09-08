import express from 'express';
import photoRouter from './photoRoutes.js';
import shopRouter from './shopRoutes.js';
import purchaseRouter from './purchaseRoutes.js';
import notificationRouter from './notificationRoute.js';
import exchangeRouter from './exchangeRoutes.js';
import userRouter from './userRoutes.js';
import uploadRouter from './uploadRoutes.js';

const apiRouter = express.Router();

// API 라우터들을 /api 경로 하위에 등록
apiRouter.use('/', photoRouter);           // /api/cards, /api/mypage 등
apiRouter.use('/shop', shopRouter);        // /api/shop
apiRouter.use('/users', userRouter);       // /api/users
apiRouter.use('/purchase', purchaseRouter); // /api/purchase
apiRouter.use('/exchange', exchangeRouter); // /api/exchange
apiRouter.use('/notification', notificationRouter); // /api/notification
apiRouter.use('/upload', uploadRouter);    // /api/upload

export default apiRouter;

