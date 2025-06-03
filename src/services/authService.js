import dotenv from 'dotenv';
import path from 'path';
import {fileURLToPath} from 'url';

// ESM에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ .env 파일 명시적으로 로드
dotenv.config({path: path.resolve(__dirname, '../../.env')});

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userRepository from '../repositories/userRepository.js';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    '❌ JWT_SECRET이 설정되지 않았습니다. .env 위치 또는 dotenv.config() 경로를 확인하세요.',
  );
}

const authService = {
  // 회원가입
  async register({ email, nickname, password }) {
    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) {
      const error = new Error('이미 존재하는 이메일입니다.');
      error.code = 409;
      throw error;
    }

    const existingNickname = await userRepository.findByNickname(nickname);
    if (existingNickname) {
      const error = new Error('이미 존재하는 닉네임입니다.');
      error.code = 409;
      throw error;
    }

    const encryptedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await userRepository.save({
      email,
      nickname,
      encryptedPassword,
    });

    return this.filterUser(newUser);
  },

  // 로그인
  async login({ email, password }) {
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

    const accessToken = this.generateToken(user, 'access');
    const refreshToken = this.generateToken(user, 'refresh');

    await userRepository.updateRefreshToken(user.id, refreshToken);

    return {
      user: this.filterUser(user),
      accessToken,
      refreshToken,
    };
  },

  // 토큰 생성
  generateToken(user, type = 'access') {
    const payload = { userId: user.id };
    const expiresIn = type === 'refresh' ? '14d' : '1h';
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  },

  // 리프레시 토큰으로 access 토큰 재발급
  async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET);
      const user = await userRepository.findById(decoded.userId);

      if (!user || user.refreshToken !== refreshToken) {
        const error = new Error('유효하지 않은 리프레시 토큰입니다.');
        error.code = 401;
        throw error;
      }

      const newAccessToken = this.generateToken(user, 'access');
      return { accessToken: newAccessToken };
    } catch {
      const error = new Error('토큰을 갱신할 수 없습니다.');
      error.code = 401;
      throw error;
    }
  },

  // 비밀번호 변경
  async changePassword(id, currentPassword, newPassword) {
    const user = await userRepository.findById(id);

    if (!user) {
      const error = new Error('사용자를 찾을 수 없습니다.');
      error.code = 404;
      throw error;
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.encryptedPassword,
    );
    if (!isCurrentPasswordValid) {
      const error = new Error('현재 비밀번호가 일치하지 않습니다.');
      error.code = 400;
      throw error;
    }

    const encryptedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const updated = await userRepository.updatePassword(id, encryptedPassword);

    return this.filterUser(updated);
  },

  // 비밀번호/토큰 제거
  filterUser(user) {
    if (!user) {
      throw new Error('user 객체가 null 또는 undefined입니다.');
    }

    const { encryptedPassword, refreshToken, point, ...safeUser } = user;
    return {
      ...safeUser,
      pointBalance: point?.balance || 0,
    };
  },
};

export default authService;
