import prisma from '../prisma/client.js';
import {BadRequestError, NotFoundError} from '../utils/customError.js';

// 📌 교환 제안 생성
export async function proposeExchange(
  userId,
  targetCardId,
  requestCardId,
  description,
) {
  console.log('🟡 proposeExchange 시작:', {
    userId,
    targetCardId,
    requestCardId,
    description,
  });

  const [targetCard, requestCard] = await Promise.all([
    prisma.userCard.findUnique({
      where: {id: targetCardId},
      include: {user: true},
    }),
    prisma.userCard.findUnique({
      where: {id: requestCardId},
      include: {user: true},
    }),
  ]);

  console.log('✅ 조회된 카드:', {targetCard, requestCard});

  if (!targetCard || !requestCard) {
    throw new NotFoundError('존재하지 않는 카드입니다.');
  }

  if (requestCard.userId !== userId) {
    throw new BadRequestError('본인의 카드만 교환 제안할 수 있습니다.');
  }

  if (targetCard.status !== 'LISTED') {
    throw new BadRequestError('해당 카드는 교환 가능한 상태가 아닙니다.');
  }

  const exchange = await prisma.exchange.create({
    data: {
      requestCardId,
      targetCardId,
      description,
      status: 'REQUESTED',
    },
  });

  console.log('✅ 교환 제안 생성 완료:', exchange);
  return exchange;
}

// 📌 교환 수락
export async function acceptExchange(exchangeId, userId) {
  console.log('🟢 acceptExchange 시작:', {exchangeId, userId});

  const exchange = await prisma.exchange.findUnique({
    where: {id: exchangeId},
    include: {
      targetCard: true,
      requestCard: true,
    },
  });

  if (!exchange) throw new NotFoundError('해당 교환 요청이 존재하지 않습니다.');
  if (exchange.targetCard.userId !== userId)
    throw new BadRequestError('본인의 카드에 대한 요청만 수락할 수 있습니다.');

  // 상태 변경
  const updated = await prisma.exchange.update({
    where: {id: exchangeId},
    data: {
      status: 'ACCEPTED',
    },
  });

  console.log('✅ 교환 수락 완료:', updated);
  return updated;
}

// 📌 교환 거절
export async function rejectExchange(exchangeId, userId) {
  console.log('🔴 rejectExchange 시작:', {exchangeId, userId});

  const exchange = await prisma.exchange.findUnique({
    where: {id: exchangeId},
    include: {
      targetCard: true,
    },
  });

  if (!exchange) throw new NotFoundError('해당 교환 요청이 존재하지 않습니다.');
  if (exchange.targetCard.userId !== userId)
    throw new BadRequestError('본인의 카드에 대한 요청만 거절할 수 있습니다.');

  const updated = await prisma.exchange.update({
    where: {id: exchangeId},
    data: {
      status: 'REJECTED',
    },
  });

  console.log('✅ 교환 거절 완료:', updated);
  return updated;
}

// 📌 교환 제안 목록 조회
export async function getExchangeProposals(cardId) {
  console.log('📥 getExchangeProposals 시작:', {cardId});

  const proposals = await prisma.exchange.findMany({
    where: {
      targetCardId: cardId,
    },
    include: {
      requestCard: {
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
            },
          },
        },
      },
    },
  });

  console.log('✅ 교환 제안 목록 조회 결과:', proposals);
  return proposals;
}
