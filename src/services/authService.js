import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userRepository from '../repositories/userRepository.js';

const SALT_ROUNDS = 10;

// 회원가입
async function register({email, nickname, password}) {
  // 1. 이메일 중복 검사
  const existingEmail = await userRepository.findByEmail(email);
  if (existingEmail) {
    const error = new Error('이미 존재하는 이메일입니다.');
    error.code = 409;
    throw error;
  }

  // 2. 닉네임 중복 검사
  const existingNickname = await userRepository.findByNickname(nickname);
  if (existingNickname) {
    const error = new Error('이미 존재하는 닉네임입니다.');
    error.code = 409;
    throw error;
  }

  // 3. 비밀번호 해싱
  const encryptedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // 4. 사용자 생성
  const newUser = await userRepository.save({
    email,
    nickname,
    encryptedPassword,
  });

  return filterUser(newUser);
}

// 로그인
async function login({email, password}) {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    const error = new Error('존재하지 않는 이메일입니다.');
    error.code = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.encryptedPassword);
  if (!isMatch) {
    const error = new Error('비밀번호가 일치하지 않습니다.');
    error.code = 401;
    throw error;
  }

  // 토큰 생성
  const accessToken = generateToken(user, 'access');
  const refreshToken = generateToken(user, 'refresh');

  // 리프레시 토큰 저장
  await userRepository.updateRefreshToken(user.id, refreshToken);

  return {
    user: filterUser(user),
    accessToken,
    refreshToken,
  };
}

// JWT 토큰 생성
function generateToken(user, type = 'access') {
  const payload = {userId: user.id};
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const expiresIn = type === 'refresh' ? '14d' : '1h';

  return jwt.sign(payload, secret, {expiresIn});
}

// 리프레시 토큰으로 액세스 토큰 갱신
async function refreshAccessToken(refreshToken) {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(refreshToken, secret);

    // 사용자 정보 조회
    const user = await userRepository.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      const error = new Error('유효하지 않은 리프레시 토큰입니다.');
      error.code = 401;
      throw error;
    }

    // 새 액세스 토큰 발급
    const newAccessToken = generateToken(user, 'access');

    return {accessToken: newAccessToken};
  } catch (err) {
    const error = new Error('토큰을 갱신할 수 없습니다.');
    error.code = 401;
    throw error;
  }
}

// 비밀번호 변경
async function changePassword(id, currentPassword, newPassword) {
  // 1. 현재 사용자 정보 조회
  const user = await userRepository.findById(id);

  if (!user) {
    const error = new Error('사용자를 찾을 수 없습니다.');
    error.code = 404;
    throw error;
  }

  // 2. 현재 비밀번호 검증
  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.encryptedPassword,
  );
  if (!isCurrentPasswordValid) {
    const error = new Error('현재 비밀번호가 일치하지 않습니다.');
    error.code = 400;
    throw error;
  }

  // 3. 새 비밀번호 해싱 및 업데이트
  const encryptedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const updated = await userRepository.updatePassword(id, encryptedPassword);

  return filterUser(updated);
}

// 비밀번호 등 민감 정보 제거
function filterUser(user) {
  if (!user) {
    throw new Error('user 객체가 null 또는 undefined입니다.');
  }
  const {encryptedPassword, refreshToken, point, ...safeUser} = user;

  // 포인트 정보 가공
  const result = {
    ...safeUser,
    pointBalance: point?.balance || 0,
  };
  return result;
}

export default {
  register,
  login,
  generateToken,
  refreshAccessToken,
  changePassword,
  filterUser,
};
