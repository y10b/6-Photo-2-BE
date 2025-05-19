import express from "express";
import { signUp, signIn } from "../controllers/authController.js";
import { validateSignup, validateEmailAndPassword } from "../middlewares/auth.middleware.js";

const router = express.Router();

// 회원가입 라우트 (유효성 검사 미들웨어 추가)
router.post("/signup", validateSignup, signUp);
// 로그인 라우트 (유효성 검사 미들웨어 추가)
router.post("/signin", validateEmailAndPassword, signIn);

export default router;