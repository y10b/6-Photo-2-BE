// repositories/exchangeRepository.js
import prisma from '../prisma/client.js';

export async function findCardById(cardId) {
  return await prisma.userCard.findUnique({
    where: {id: cardId},
    include: {
      user: true,
      photoCard: true,
    },
  });
}

export async function createExchange(requestCardId, targetCardId, description) {
  return await prisma.exchange.create({
    data: {
      requestCardId,
      targetCardId,
      description,
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
          user: true, // ⭐ 이 부분이 꼭 있어야함!
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
