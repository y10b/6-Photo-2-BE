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

  console.log('=== 디버깅: 본인 카드 검증 ===');
  console.log('현재 로그인한 userId:', userId);
  console.log('requestCard:', requestCard);
  console.log('requestCard.user:', requestCard?.user);
  console.log('requestCard.user.id:', requestCard?.user?.id);

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
  console.log('[Service] DB 재조회 결과:', confirmed);

  return confirmed;
}

export async function acceptExchange(userId, exchangeId) {
  console.log('[Service] acceptExchange 호출:', {userId, exchangeId});

  const exchange = await findExchangeById(exchangeId);
  if (!exchange) throw new NotFoundError('해당 교환 요청이 존재하지 않습니다.');

  if (exchange.targetCard.userId !== userId)
    throw new BadRequestError('본인의 카드에 대한 요청만 수락할 수 있습니다.');

  const updated = await updateExchangeStatus(exchangeId, 'ACCEPTED');
  console.log('[Service] 교환 수락 완료:', updated);
  return updated;
}

export async function rejectExchange(userId, exchangeId) {
  console.log('[Service] rejectExchange 호출:', {userId, exchangeId});

  const exchange = await findExchangeById(exchangeId);
  if (!exchange) throw new NotFoundError('해당 교환 요청이 존재하지 않습니다.');

  if (exchange.targetCard.userId !== userId)
    throw new BadRequestError('본인의 카드에 대한 요청만 거절할 수 있습니다.');

  const updated = await updateExchangeStatus(exchangeId, 'REJECTED');
  console.log('[Service] 교환 거절 완료:', updated);
  return updated;
}

export async function getExchangeProposals(userId, cardId) {
  console.log('[Service] getExchangeProposals 호출:', {userId, cardId});

  const proposals = await findExchangesByTargetCardId(cardId);

  const formattedProposals = await Promise.all(
    proposals.map(async exchange => {
      const requestCard = exchange.requestCard;
      let photoCard = requestCard?.photoCard;

      if (!photoCard || !photoCard.id) {
        photoCard = await prisma.photoCard.findUnique({
          where: {id: requestCard.photoCardId},
        });
        console.log(
          `[Service] 교환 ID ${exchange.id}의 photoCard 직접 조회 결과:`,
          photoCard,
        );
      }

      return {
        id: exchange.id,
        exchangeId: exchange.id,
        requestCardId: exchange.requestCardId,
        targetCardId: exchange.targetCardId,
        status: exchange.status,
        description: exchange.description,
        createdAt: exchange.createdAt,
        userNickname: requestCard.user?.nickname || '유저',
        imageUrl: photoCard?.imageUrl || '/logo.svg',
        name: photoCard?.name || '이름 없음',
        grade: photoCard?.grade || 'COMMON',
        genre: photoCard?.genre || '장르 없음',
        price: photoCard?.price || 0,
        cardDescription: photoCard?.description || '',
      };
    }),
  );

  console.log('[Service] 교환 제안 최종 변환 결과:', formattedProposals);
  return formattedProposals;
}

export async function cancelExchange(userId, exchangeId) {
  console.log('[Service] cancelExchange 호출:', {userId, exchangeId});

  const exchange = await findExchangeById(exchangeId);
  if (!exchange) throw new NotFoundError('해당 교환 요청이 존재하지 않습니다.');

  // 교환 요청을 보낸 사람만 취소할 수 있도록 검증
  // requestCard의 userId와 현재 로그인한 userId가 일치해야 함
  if (exchange.requestCard.userId !== userId)
    throw new BadRequestError('본인이 보낸 교환 요청만 취소할 수 있습니다.');

  // 이미 처리된 교환 요청은 취소할 수 없음
  if (exchange.status !== 'REQUESTED')
    throw new BadRequestError('이미 처리된 교환 요청은 취소할 수 없습니다.');

  const updated = await updateExchangeStatus(exchangeId, 'CANCELLED');
  console.log('[Service] 교환 취소 완료:', updated);
  return updated;
}
