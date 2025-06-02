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
      targetCard: {
        include: {
          photoCard: true, // 📌 targetCard의 등급, 이름을 위해 필요
          user: true,
        },
      },
      requestCard: {
        include: {
          photoCard: true,
          user: true, // 요청자 닉네임 등 알림용
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
      targetCard: true,
      requestCard: {
        include: {
          user: true,
          photoCard: true, // photoCard 정보 포함
        },
      },
    },
  });
}
