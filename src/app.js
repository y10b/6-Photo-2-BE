import express from 'express';
import cookieParser from 'cookie-parser';
import errorHandler from './middlewares/error.middleware.js';
import cors from 'cors';
import passport from './config/passport.js';
import path from 'path';

import authRouter from './routes/authRoutes.js';
import apiRouter from './routes/apiRoutes.js';

const app = express();
const PORT = process.env.PORT;

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// CORS 설정
const corsOrigin = process.env.NODE_ENV === 'development'
  ? process.env.DEV_URL
  : process.env.PROD_URL;

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    optionsSuccessStatus: 200,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use(passport.initialize());

// 라우터 등록
app.use('/auth', authRouter);
app.use('/api', apiRouter);

//미들웨어
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`서버가 작동 중 입니다. 포트 번호: ${PORT}`);
});
