import { expressjwt } from "express-jwt";

function throwUnauthorizedError() {
  // 인증되지 않은 경우 401 에러를 발생시키는 함수
  const error = new Error("Unauthorized");
  error.code = 401;
  throw error;
}

const verifyAccessToken = expressjwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
  requestProperty: "auth", // req.auth에 decoded JWT 정보 저장
});

const verifyRefreshToken = expressjwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
  getToken: (req) => req.cookies.refreshToken, // 쿠키에서 refreshToken 추출
});

// 이메일/비밀번호 유효성 검사 미들웨어
function validateEmailAndPassword(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    const error = new Error("email, password 가 모두 필요합니다.");
    error.code = 422;
    throw error;
  }
  next();
}

// 회원가입 유효성 검사 미들웨어
function validateSignup(req, res, next) {
  const { email, nickname, password } = req.body;
  if (!email || !nickname || !password) {
    const error = new Error("email, nickname, password 가 모두 필요합니다.");
    error.code = 422;
    throw error;
  }
  next();
}

// JWT에서 사용자 정보 추출 미들웨어 (verifyAccessToken 이후 사용)
async function extractUserFromToken(req, res, next) {
  try {
    if (req.auth && req.auth.userId) {
      // req.auth.userId를 req.user로 변환
      req.user = { id: req.auth.userId };
    }
    next();
  } catch (error) {
    next(error);
  }
}

export {
  verifyAccessToken,
  verifyRefreshToken,
  validateEmailAndPassword,
  validateSignup,
  extractUserFromToken,
};