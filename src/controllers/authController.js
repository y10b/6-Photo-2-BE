import authService from '../services/authService.js';

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
    res.status(201).json(user);
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
      user: result.user,
      accessToken: result.accessToken
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

export default {
  signUp,
  signIn,
  refresh
};