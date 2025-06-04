import express from 'express';
import authController from '../controllers/authController.js';
import {
  validateSignup,
  validateEmailAndPassword,
} from '../middlewares/auth.middleware.js';
import passport from '../config/passport.js'; // 이게 이미 되어 있어야 함

const router = express.Router();

// 회원가입 라우트 (유효성 검사 미들웨어 추가)
router.post('/signup', validateSignup, authController.signUp);
// 로그인 라우트 - Passport + JWT 인증
router.post(
  '/signin',
  validateEmailAndPassword,
  authController.passportLocalLogin,
);
router.post('/refresh', authController.refresh);
router.post('/signout', (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
  });
  res.status(200).json({message: '로그아웃 완료'});
});

// 구글 로그인 시작
router.get('/google', authController.passportGoogleStart);
// 구글 로그인 콜백
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/auth/google/fail',
  }),
  authController.passportGoogleCallback,
);

export default router;
