import userRepository from '../repositories/userRepository.js';
import authService from '../services/authService.js';
import passport from '../config/passport.js';

// 회원가입 핸들러
export async function signUp(req, res, next) {
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
}

// 로그인 핸들러
export async function signIn(req, res, next) {
  try {
    const {email, password} = req.body;
    if (!email || !password) {
      return res.status(400).json({message: '이메일과 비밀번호가 필요합니다.'});
    }

    const result = await authService.login({email, password});

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });

    res.json({
      user: authService.filterUser(result.user),
      accessToken: result.accessToken,
    });
  } catch (err) {
    next(err);
  }
}

// 토큰 갱신 핸들러
export async function refresh(req, res, next) {
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
}

// 패스포트 Local 로그인 핸들러
export function passportLocalLogin(req, res, next) {
  passport.authenticate('local', {session: false}, async (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({
        message: info?.message || '이메일 또는 비밀번호가 일치하지 않습니다.',
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
  })(req, res, next);
}

// 구글 로그인 시작 (passport.authenticate 직접 반환)
export const passportGoogleStart = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

// 구글 콜백 핸들러
export async function passportGoogleCallback(req, res, next) {
  try {
    const user = req.user;

    if (!user || !user.id) {
      console.error(
        '❌ Google 로그인 실패: req.user가 없음 또는 user.id가 없음',
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

    return res.redirect(`http://localhost:3000?token=${accessToken}`);
  } catch (err) {
    next(err);
  }
}

export default {
  signUp,
  signIn,
  refresh,
  passportLocalLogin,
  passportGoogleStart,
  passportGoogleCallback,
};
