import bcrypt from 'bcrypt';
import userRepository from '../repositories/userRepository.js';
import authService from './authService.js';
import {init, createId} from '@paralleldrive/cuid2';

const createCuid = init();

// 내 정보 조회
async function getUserById(id) {
  const user = await userRepository.findById(id);

  if (!user) {
    const error = new Error('사용자를 찾을 수 없습니다.');
    error.code = 404;
    throw error;
  }

  return authService.filterUser(user);
}

async function getUser(email, password) {
  const user = await userRepository.findByEmail(email);
  if (!user) return null;

  const isMatch = await bcrypt.compare(password, user.encryptedPassword);
  if (!isMatch) return null;

  return user;
}

// 닉네임으로 사용자 조회
async function getUserByNickname(nickname) {
  // 기본 사용자 정보 조회
  const user = await userRepository.findByNickname(nickname);

  if (!user) {
    const error = new Error('사용자를 찾을 수 없습니다.');
    error.code = 404;
    throw error;
  }

  // 판매 중인 카드 조회
  const listedCards = await userRepository.findListedCardsByUserId(user.id);

  // 응답 데이터 가공
  const cards = listedCards.map(card => ({
    userCardId: card.id,
    imageUrl: card.photoCard.imageUrl,
    title: card.photoCard.name,
    description: card.photoCard.description,
    cardGenre: card.photoCard.genre,
    cardGrade: card.photoCard.grade,
    price: card.shopListing?.price || 0,
    saleStatus: card.status,
  }));

  return {
    id: user.id,
    nickname: user.nickname,
    pointBalance: user.point?.balance || 0,
    createdAt: user.createdAt,
    listedCards: cards,
  };
}

// 내 정보 수정
async function updateUser(id, data) {
  const {nickname, email} = data;
  const updateData = {};

  // 닉네임 중복 확인
  if (nickname) {
    const existingUser = await userRepository.findByNickname(nickname);
    if (existingUser && existingUser.id !== Number(id)) {
      const error = new Error('이미 사용 중인 닉네임입니다.');
      error.code = 409;
      throw error;
    }
    updateData.nickname = nickname;
  }

  // 이메일 중복 확인
  if (email) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser && existingUser.id !== Number(id)) {
      const error = new Error('이미 사용 중인 이메일입니다.');
      error.code = 409;
      throw error;
    }
    updateData.email = email;
  }

  const updated = await userRepository.update(id, updateData);
  return authService.filterUser(updated);
}

// 사용자의 카드 목록 조회
async function getCardsByUserId(userId) {
  const cards = await userRepository.findIdleCardsByUserId(userId);

  // 응답 데이터 가공
  const formattedCards = cards.map(card => ({
    userCardId: card.id,
    imageUrl: card.photoCard.imageUrl,
    title: card.photoCard.name,
    description: card.photoCard.description,
    cardGenre: card.photoCard.genre,
    cardGrade: card.photoCard.grade,
    status: card.status,
    createdAt: card.createdAt,
  }));

  return {
    totalCount: formattedCards.length,
    cards: formattedCards,
  };
}

// 사용자의 판매 카드 목록 조회
async function getSalesByUserId(userId) {
  const shops = await userRepository.findShopsByUserId(userId);

  // 응답 데이터 가공
  const sales = shops.map(shop => ({
    shopId: shop.id,
    photoCardId: shop.photoCardId,
    imageUrl: shop.photoCard.imageUrl,
    title: shop.photoCard.name,
    description: shop.photoCard.description,
    cardGenre: shop.photoCard.genre,
    cardGrade: shop.photoCard.grade,
    price: shop.price,
    initialQuantity: shop.initialQuantity,
    remainingQuantity: shop.remainingQuantity,
    listingType: shop.listingType,
    exchangeInfo:
      shop.listingType === 'FOR_SALE_AND_TRADE'
        ? {
            grade: shop.exchangeGrade,
            genre: shop.exchangeGenre,
            description: shop.exchangeDescription,
          }
        : null,
    createdAt: shop.createdAt,
  }));

  return {
    totalCount: sales.length,
    sales,
  };
}

async function oauthCreateOrUpdate(provider, providerId, email, name) {
  // 1. email로 먼저 유저를 찾는다
  const existingUser = await userRepository.findByEmail(email);

  if (existingUser) {
    // 이미 있으면 provider, providerId,만 업데이트
    const updatedUser = await userRepository.update(existingUser.id, {
      provider,
      providerId,
    });
    return filterSensitiveUserData(updatedUser);
  } else {
    // 없으면 새로 생성
    // Trim name if too long to keep the final nickname within reasonable length
    const trimmedName = name.length > 20 ? name.substring(0, 20) : name;
    const shortCuid = createCuid().slice(0, 8); // Take first 8 chars of cuid for brevity
    const uniqueNickname = `${trimmedName}_${shortCuid}`;

    const createdUser = await userRepository.save({
      provider,
      providerId,
      email,
      nickname: uniqueNickname,
    });
    return filterSensitiveUserData(createdUser);
  }
}

function filterSensitiveUserData(user) {
  const {encryptedPassword, refreshToken, ...rest} = user;
  return rest;
}

export default {
  getUser,
  getUserById,
  getUserByNickname,
  updateUser,
  getCardsByUserId,
  getSalesByUserId,
  oauthCreateOrUpdate,
  filterSensitiveUserData,
};
