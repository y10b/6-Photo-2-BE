// repositories/exchangeRepository.js
import prisma from '../prisma/client.js';

export async function findCardById(cardId) {
  return await prisma.userCard.findUnique({
    where: {id: cardId},
    include: {
      user: true,
      photoCard: true,
      shopListing: true  // shopListing 정보 포함
    },
  });
}

export async function createExchange(requestCardId, targetCardId, description) {
  return await prisma.exchange.create({
    data: {
      requestCardId,
      targetCardId,
      description,
      status: 'REQUESTED'
    },
  });
}

export async function findExchangeById(exchangeId) {
  return await prisma.exchange.findUnique({
    where: {
      id: exchangeId,
    },
    include: {
      requestCard: {
        include: {
          user: true,
          photoCard: true,
        },
      },
      targetCard: {
        include: {
          user: true,
          photoCard: true,
          shopListing: true, // 판매 게시글 정보 포함
        },
      },
    },
  });
}

export async function updateExchangeStatus(id, status) {
  return await prisma.exchange.update({
    where: {id},
    data: {status},
  });
}

export async function findExchangesByTargetCardId(targetCardId) {
  return await prisma.exchange.findMany({
    where: {targetCardId},
    include: {
      requestCard: {
        include: {
          user: true,
          photoCard: true,
        },
      },
    },
    orderBy: {createdAt: 'desc'},
  });
}

// 새로 추가: 판매 게시글 ID로 교환 제안 목록 조회
export async function findExchangesByShopId(shopId) {
  // 해당 shopId에 등록된 모든 UserCard 찾기
  const listedCards = await prisma.userCard.findMany({
    where: {
      shopListingId: shopId,
      status: 'LISTED',
    },
    select: {
      id: true,
    },
  });

  // 찾은 카드 ID 목록
  const cardIds = listedCards.map(card => card.id);

  // 해당 카드들에 대한 교환 제안 찾기
  return await prisma.exchange.findMany({
    where: {
      targetCardId: {
        in: cardIds,
      },
      status: 'REQUESTED', // 요청 상태인 교환만 조회
    },
    include: {
      requestCard: {
        include: {
          user: true,
          photoCard: true,
        },
      },
      targetCard: {
        include: {
          user: true,
          photoCard: true,
          shopListing: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
