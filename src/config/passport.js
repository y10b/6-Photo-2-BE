import passport from "passport";
import jwt from "../middlewares/passport/jwtStrategy.js";
import localStrategy from "../middlewares/passport/localStrategy.js";
import googleStrategy from "../middlewares/passport/googleStrategy.js";

// Local 로그인
passport.use(localStrategy);

// JWT 전략 (Access / Refresh)
passport.use("access-token", jwt.accessTokenStrategy);
passport.use("refresh-token", jwt.refreshTokenStrategy);

// 구글 소셜 로그인
passport.use("google", googleStrategy);

export default passport;