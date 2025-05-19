import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prisma/client.js";

const SALT_ROUNDS = 10;

// 회원가입
async function register({ email, nickname, password }) {
  // 1. 이메일 중복 검사
  const existingEmail = await prisma.user.findUnique({
    where: { email }
  });
  if (existingEmail) {
    const error = new Error("이미 존재하는 이메일입니다.");
    error.code = 409;
    throw error;
  }

  // 2. 닉네임 중복 검사
  const existingNickname = await prisma.user.findUnique({
    where: { nickname }
  });
  if (existingNickname) {
    const error = new Error("이미 존재하는 닉네임입니다.");
    error.code = 409;
    throw error;
  }

  // 3. 비밀번호 해싱
  const encryptedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // 4. 사용자 생성 (포인트는 나중에 추가)
  const newUser = await prisma.user.create({
    data: {
      email,
      nickname,
      encryptedPassword,
    },
  });

  return filterUser(newUser);
}

// 로그인
async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    const error = new Error("존재하지 않는 이메일입니다.");
    error.code = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.encryptedPassword);
  if (!isMatch) {
    const error = new Error("비밀번호가 일치하지 않습니다.");
    error.code = 401;
    throw error;
  }

  return filterUser(user);
}

// JWT 토큰 생성
function generateToken(user, type = "access") {
  const payload = { userId: user.id };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: type === "refresh" ? "14d" : "1h",
  });
}

// 내 정보 조회
async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    // 포인트 정보는 일단 제외
  });
  
  if (!user) {
    const error = new Error("사용자를 찾을 수 없습니다.");
    error.code = 404;
    throw error;
  }
  
  return filterUser(user);
}

// 내 정보 수정
async function updateUser(id, data) {
  const updated = await prisma.user.update({
    where: { id },
    data: {
      nickname: data.nickname, // 닉네임만 수정 가능하도록 제한
    },
    // 포인트 정보는 일단 제외
  });
  
  return filterUser(updated);
}

// 비밀번호 변경
async function changePassword(id, currentPassword, newPassword) {
  // 1. 현재 사용자 정보 조회
  const user = await prisma.user.findUnique({
    where: { id }
  });
  
  if (!user) {
    const error = new Error("사용자를 찾을 수 없습니다.");
    error.code = 404;
    throw error;
  }

  // 2. 현재 비밀번호 검증
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.encryptedPassword);
  if (!isCurrentPasswordValid) {
    const error = new Error("현재 비밀번호가 일치하지 않습니다.");
    error.code = 400;
    throw error;
  }

  // 3. 새 비밀번호 해싱 및 업데이트
  const encryptedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const updated = await prisma.user.update({
    where: { id },
    data: { encryptedPassword },
    // 포인트 정보는 일단 제외
  });
  
  return filterUser(updated);
}

// 비밀번호 등 민감 정보 제거
function filterUser(user) {
  const { encryptedPassword, refreshToken, ...safeUser } = user;
  return safeUser;
}

export default {
  register,
  login,
  generateToken,
  getUserById,
  updateUser,
  changePassword,
};