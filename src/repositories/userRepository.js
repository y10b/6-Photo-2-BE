import prisma from "../prisma/client.js"; // 경로는 프로젝트 구조에 맞게 수정

async function findById(id) {
  return prisma.user.findUnique({
    where: { id: Number(id) }, // id 값이 문자열로 전달될 수 있어 Number로 변환
    include: {
      point: true // 포인트 정보 포함
    }
  });
}

async function findByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      point: true // 포인트 정보 포함
    }
  });
}

async function findByNickname(nickname) {
  return prisma.user.findUnique({
    where: { nickname },
    include: {
      point: true // 포인트 정보 포함
    }
  });
}

async function save(user) {
  return prisma.user.create({
    data: {
      email: user.email,
      nickname: user.nickname,
      encryptedPassword: user.encryptedPassword,
      // image 필드는 현재 스키마에 없어 주석 처리
      // image: user.image,
      point: {
        create: { balance: 0 } // 포인트 초기화 생성
      }
    },
    include: {
      point: true
    }
  });
}

async function update(id, data) {
  return prisma.user.update({
    where: { id: Number(id) },
    data,
    include: {
      point: true
    }
  });
}

async function updatePassword(id, encryptedPassword) {
  return prisma.user.update({
    where: { id: Number(id) },
    data: { encryptedPassword },
    include: {
      point: true
    }
  });
}

// 리프레시 토큰 업데이트
async function updateRefreshToken(id, refreshToken) {
  return prisma.user.update({
    where: { id: Number(id) },
    data: { refreshToken },
    include: {
      point: true
    }
  });
}

// 판매 중인 카드 조회
async function findListedCardsByUserId(userId, limit = 8) {
  return prisma.userCard.findMany({
    where: {
      userId,
      status: "LISTED",
      shopListingId: { not: null },
    },
    include: {
      photoCard: true,
      shopListing: true,
    },
    take: limit,
  });
}

// 보관 중인 카드 조회
async function findIdleCardsByUserId(userId) {
  return prisma.userCard.findMany({
    where: {
      userId,
      status: "IDLE",
    },
    include: {
      photoCard: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// 판매 목록 조회
async function findShopsByUserId(userId) {
  return prisma.shop.findMany({
    where: {
      sellerId: userId,
    },
    include: {
      photoCard: true,
      listedItems: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export default {
  findById,
  findByEmail,
  findByNickname,
  save,
  update,
  updatePassword,
  updateRefreshToken,
  findListedCardsByUserId,
  findIdleCardsByUserId,
  findShopsByUserId
};