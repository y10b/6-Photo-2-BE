import prisma from '../prisma/client.js';

const userRepository = {
  // ID로 사용자 조회 (포인트 포함)
  async findById(id) {
    return prisma.user.findUnique({
      where: { id: Number(id) },
      include: {
        point: true,
      },
    });
  },

  // 이메일로 사용자 조회 (포인트 포함)
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        point: true,
      },
    });
  },

  // 닉네임으로 사용자 조회 (포인트 포함)
  async findByNickname(nickname) {
    return prisma.user.findUnique({
      where: { nickname },
      include: {
        point: true,
      },
    });
  },

  // 사용자 저장 (포인트 0으로 초기화)
  async save(user) {
    return prisma.user.create({
      data: {
        email: user.email,
        nickname: user.nickname,
        encryptedPassword: user.encryptedPassword,
        // image: user.image, // 현재 스키마에 없어서 주석
        point: {
          create: { balance: 0 },
        },
      },
      include: {
        point: true,
      },
    });
  },

  // 사용자 정보 수정
  async update(id, data) {
    return prisma.user.update({
      where: { id: Number(id) },
      data,
      include: {
        point: true,
      },
    });
  },

  // 사용자 비밀번호만 수정
  async updatePassword(id, encryptedPassword) {
    return prisma.user.update({
      where: { id: Number(id) },
      data: { encryptedPassword },
      include: {
        point: true,
      },
    });
  },

  // 사용자 리프레시 토큰 업데이트
  async updateRefreshToken(id, refreshToken) {
    return prisma.user.update({
      where: { id: Number(id) },
      data: { refreshToken },
      include: {
        point: true,
      },
    });
  },

  // 판매 중인 카드 조회 (LISTED 상태, shop 연결 있음)
  async findListedCardsByUserId(userId, limit = 8) {
    return prisma.userCard.findMany({
      where: {
        userId,
        status: 'LISTED',
        shopListingId: { not: null },
      },
      include: {
        photoCard: true,
        shopListing: true,
      },
      take: limit,
    });
  },

  // 보관 중인 카드 조회 (IDLE 상태)
  async findIdleCardsByUserId(userId) {
    return prisma.userCard.findMany({
      where: {
        userId,
        status: 'IDLE',
      },
      include: {
        photoCard: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  // 사용자가 등록한 판매 목록 조회
  async findShopsByUserId(userId) {
    return prisma.shop.findMany({
      where: {
        sellerId: userId,
      },
      include: {
        photoCard: true,
        listedItems: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },
};

export default userRepository;