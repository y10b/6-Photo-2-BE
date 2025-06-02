import prisma from '../prisma/client.js';

export async function findCardById(cardId) {
  return await prisma.userCard.findUnique({
    where: {id: cardId},
    include: {
      user: true,
      photoCard: true,
      shopListing: true  
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
          shopListing: true, 
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

// 판매 게시글 ID로 교환 제안 목록 조회
export async function findExchangesByShopId(shopId) {
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
      status: 'REQUESTED', 
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
