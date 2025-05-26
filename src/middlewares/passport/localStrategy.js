import { Strategy as LocalStrategy } from "passport-local";
import userService from "../../services/userService.js";

const localStrategy = new LocalStrategy(
  {
    usernameField: "email",
  },
  async (email, password, done) => {
    console.log('📌 [Passport] localStrategy 실행됨:', email); // ✅ 로그 확인
    try {
      const user = await userService.getUser(email, password);
      if (!user) {
        return done(null, false); // req.isAuthenticated() = false
      }
      return done(null, user); // req.user = user; req.isAuthenticated() = true
    } catch (error) {
      return done(error); // DB 오류 발생시 에러 반환
    }
  },
);

export default localStrategy;
