import userRepository from '../repositories/userRepository.js';
import authService from '../services/authService.js';
import passport from '../config/passport.js';

const authController = {
  // 회원가입 핸들러
  async signUp(req, res, next) {
    try {
      const {email, nickname, password, image} = req.body;
      if (!email || !nickname || !password) {
        return res.status(400).json({message: '모든 필드를 입력해주세요.'});
      }

      const user = await authService.register({
        email,
        nickname,
        password,
        image,
      });
      res.status(201).json(authService.filterUser(user));
    } catch (err) {
      next(err);
    }
  },

  // 리프레시 토큰으로 액세스 토큰 재발급
  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(400).json({message: '리프레시 토큰이 필요합니다.'});
      }

      const result = await authService.refreshAccessToken(refreshToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // passport-local 로그인 핸들러
  passportLocalLogin(req, res, next) {
    passport.authenticate(
      'local',
      {session: false},
      async (err, user, info) => {
        if (err || !user) {
          return res.status(401).json({
            message:
              info?.message || '이메일 또는 비밀번호가 일치하지 않습니다.',
          });
        }

        const accessToken = authService.generateToken(user, 'access');
        const refreshToken = authService.generateToken(user, 'refresh');

        await userRepository.updateRefreshToken(user.id, refreshToken);

        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          sameSite: 'none',
          secure: true,
        });

        return res.status(200).json({
          message: '로그인 성공',
          user: authService.filterUser(user),
          accessToken,
        });
      },
    )(req, res, next);
  },

  // 구글 로그인 시작 (passport-google 전략 실행)
  passportGoogleStart: passport.authenticate('google', {
    scope: ['profile', 'email'],
  }),

  // 구글 로그인 콜백 핸들러
  async passportGoogleCallback(req, res, next) {
    try {
      const user = req.user;

      if (!user || !user.id) {
        console.error(
          'Google 로그인 실패: req.user가 없음 또는 user.id가 없음',
        );
        return res
          .status(500)
          .json({message: 'Google 로그인 실패: 유저 정보 없음'});
      }

      const accessToken = authService.generateToken(user, 'access');
      const refreshToken = authService.generateToken(user, 'refresh');

      await userRepository.updateRefreshToken(user.id, refreshToken);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
      });

      return res.redirect(
        `${process.env.CLIENT_URL}/auth/callback?token=${accessToken}`,
      );
    } catch (err) {
      next(err);
    }
  },
};

export default authController;
