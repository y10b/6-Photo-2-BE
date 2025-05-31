import prisma from '../prisma/client.js';
import {
  findCardById,
  createExchange,
  findExchangeById,
  updateExchangeStatus,
  findExchangesByTargetCardId,
} from '../repositories/exchangeRepository.js';
import {BadRequestError, NotFoundError} from '../utils/customError.js';

export async function proposeExchange(
  userId,
  targetCardId,
  requestCardId,
  description,
) {
  console.log('[Service] proposeExchange 호출:', {
    userId,
    targetCardId,
    requestCardId,
    description,
  });

  const requestCard = await findCardById(requestCardId);
  const targetCard = await findCardById(targetCardId);

  if (!requestCard || !targetCard) {
    throw new NotFoundError('존재하지 않는 카드입니다.');
  }

  if (requestCard.user?.id !== userId) {
    throw new BadRequestError('본인의 카드만 교환 제안할 수 있습니다.');
  }

  if (targetCard.status !== 'LISTED') {
    throw new BadRequestError('해당 카드는 교환 가능한 상태가 아닙니다.');
  }

  const exchange = await createExchange(
    requestCardId,
    targetCardId,
    description,
  );
  console.log('[Service] 교환 제안 생성 완료:', exchange);

  const confirmed = await findExchangeById(exchange.id);
  return confirmed;
}

export async function acceptExchange(userId, exchangeId) {
  console.log('[Service] acceptExchange 호출:', {userId, exchangeId});

  const exchange = await findExchangeById(exchangeId);
  if (!exchange) throw new NotFoundError('해당 교환 요청이 존재하지 않습니다.');

  if (exchange.targetCard.userId !== userId) {
    throw new BadRequestError('본인의 카드에 대한 요청만 수락할 수 있습니다.');
  }

  const updated = await prisma.$transaction(async tx => {
    // 상태 변경
    const acceptedExchange = await tx.exchange.update({
      where: {id: exchangeId},
      data: {status: 'ACCEPTED'},
    });

    // 카드 소유권 변경 (userId 스왑)
    await tx.userCard.update({
      where: {id: exchange.requestCardId},
      data: {userId: exchange.targetCard.userId},
    });

    await tx.userCard.update({
      where: {id: exchange.targetCardId},
      data: {userId: exchange.requestCard.userId},
    });

    return acceptedExchange;
  });

  console.log('[Service] 교환 수락 및 소유권 이전 완료:', updated);
  return updated;
}

export async function rejectExchange(userId, exchangeId) {
  console.log('[Service] rejectExchange 호출:', {userId, exchangeId});

  const exchange = await findExchangeById(exchangeId);
  if (!exchange) throw new NotFoundError('해당 교환 요청이 존재하지 않습니다.');

  if (exchange.targetCard.userId !== userId) {
    throw new BadRequestError('본인의 카드에 대한 요청만 거절할 수 있습니다.');
  }

  const updated = await updateExchangeStatus(exchangeId, 'REJECTED');
  console.log('[Service] 교환 거절 완료:', updated);
  return updated;
}

export async function getExchangeProposals(userId, cardId) {
  console.log('[Service] getExchangeProposals 호출:', {userId, cardId});

  const proposals = await findExchangesByTargetCardId(cardId);

  // 필요한 필드만 추려서 반환
  const formattedProposals = proposals.map(exchange => ({
    id: exchange.id,
    exchangeId: exchange.id,
    requestCardId: exchange.requestCardId,
    targetCardId: exchange.targetCardId,
    status: exchange.status,
    description: exchange.description,
    createdAt: exchange.createdAt,
    userNickname: exchange.requestCard.user?.nickname || '유저',
    imageUrl: exchange.requestCard.photoCard?.imageUrl || '/logo.svg',
    name: exchange.requestCard.photoCard?.name || '이름 없음',
    grade: exchange.requestCard.photoCard?.grade || 'COMMON',
    genre: exchange.requestCard.photoCard?.genre || '장르 없음',
    price: exchange.requestCard.photoCard?.price || 0,
    cardDescription: exchange.requestCard.photoCard?.description || '',
  }));

  return formattedProposals;
}
