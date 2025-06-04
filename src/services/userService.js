import bcrypt from 'bcrypt';
import userRepository from '../repositories/userRepository.js';
import authService from './authService.js';
import {init} from '@paralleldrive/cuid2';

const createCuid = init();

const userService = {
  /**
   * 사용자 ID로 내 정보 조회
   */
  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      const error = new Error('사용자를 찾을 수 없습니다.');
      error.code = 404;
      throw error;
    }
    return authService.filterUser(user);
  },

  /**
   * 이메일/비밀번호로 사용자 인증
   */
  async getUser(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.encryptedPassword);
    if (!isMatch) return null;

    return user;
  },

  /**
   * 닉네임으로 사용자 조회 (판매중인 카드 포함)
   */
  async getUserByNickname(nickname) {
    const user = await userRepository.findByNickname(nickname);
    if (!user) {
      const error = new Error('사용자를 찾을 수 없습니다.');
      error.code = 404;
      throw error;
    }

    const listedCards = await userRepository.findListedCardsByUserId(user.id);
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
  },

  /**
   * 내 정보 수정 (닉네임, 이메일 중복 체크 포함)
   */
  async updateUser(id, data) {
    const {nickname, email} = data;
    const updateData = {};

    if (nickname) {
      const existingUser = await userRepository.findByNickname(nickname);
      if (existingUser && existingUser.id !== Number(id)) {
        const error = new Error('이미 사용 중인 닉네임입니다.');
        error.code = 409;
        throw error;
      }
      updateData.nickname = nickname;
    }

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
  },

  /**
   * 내가 보유한 카드(IDLE 상태) 목록 조회
   */
  async getCardsByUserId(userId) {
    const cards = await userRepository.findIdleCardsByUserId(userId);

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
  },

  /**
   * 내가 판매 중인 카드(shop 등록 포함) 목록 조회
   */
  async getSalesByUserId(userId) {
    const shops = await userRepository.findShopsByUserId(userId);

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
  },

  /**
   * 소셜 로그인(Google 등) 시 사용자 생성 또는 provider 정보 업데이트
   */
  async oauthCreateOrUpdate(provider, providerId, email, name) {
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      const updatedUser = await userRepository.update(existingUser.id, {
        provider,
        providerId,
      });
      return this.filterSensitiveUserData(updatedUser);
    } else {
      const trimmedName = name.length > 20 ? name.substring(0, 20) : name;
      const shortCuid = createCuid().slice(0, 8);
      const uniqueNickname = `${trimmedName}_${shortCuid}`;

      const createdUser = await userRepository.save({
        provider,
        providerId,
        email,
        nickname: uniqueNickname,
      });
      return this.filterSensitiveUserData(createdUser);
    }
  },

  /**
   * 비밀번호 및 리프레시 토큰 제거한 사용자 정보 반환
   */
  filterSensitiveUserData(user) {
    const {encryptedPassword, refreshToken, ...rest} = user;
    return rest;
  },
};

export default userService;
