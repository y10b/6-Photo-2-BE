import {Strategy as LocalStrategy} from 'passport-local';
import userService from '../../services/userService.js';

const localStrategy = new LocalStrategy(
  {
    usernameField: 'email',
  },
  async (email, password, done) => {
    try {
      const user = await userService.getUser(email, password);
      if (!user) {
        return done(null, false, {message: '존재하지 않는 이메일입니다.'});
      }
      const isMatch = await bcrypt.compare(password, user.encryptedPassword);
      if (!isMatch) {
        return done(null, false, {message: '비밀번호가 일치하지 않습니다.'});
      }
      return done(null, user); // req.user = user; req.isAuthenticated() = true
    } catch (error) {
      return done(error); // DB 오류 발생시 에러 반환
    }
  },
);

export default localStrategy;
