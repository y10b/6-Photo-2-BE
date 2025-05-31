import prisma from '../prisma/client.js';

export async function findCardById(id) {
  console.log('[Repository] findCardById 호출:', id);
  return await prisma.userCard.findUnique({
    where: {id},
    include: {user: true}, // user 정보 포함 필수!
  });
}

export async function createExchange(requestCardId, targetCardId, description) {
  console.log('[Repository] createExchange 호출:', {
    requestCardId,
    targetCardId,
    description,
  });
  return await prisma.exchange.create({
    data: {
      requestCardId,
      targetCardId,
      description: String(description),
      status: 'REQUESTED',
    },
  });
}

export async function findExchangeById(id) {
  return await prisma.exchange.findUnique({
    where: {id},
    include: {
      requestCard: {
        include: {
          user: true,
          photoCard: true,
        },
      },
      targetCard: {
        include: {
          user: true, // ✅ 소유자 확인을 위해 반드시 필요
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
    where: {
      targetCardId,
      status: 'REQUESTED', // ✅ 상태 필터링 추가
    },
    include: {
      targetCard: true,
      requestCard: {
        include: {
          user: true,
          photoCard: true, // photoCard 정보 포함
        },
      },
    },
    orderBy: {createdAt: 'desc'},
  });
}
