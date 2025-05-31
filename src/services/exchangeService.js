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
  console.log('[Service] DB 재조회 결과:', confirmed);

  return confirmed;
}

export async function acceptExchange(userId, exchangeId) {
  console.log('[Service] acceptExchange 호출:', {userId, exchangeId});

  const exchange = await findExchangeById(exchangeId);
  if (!exchange) throw new NotFoundError('해당 교환 요청이 존재하지 않습니다.');

  // 교환 요청의 대상 카드 소유자 정보 로깅
  console.log('✅ exchange.targetCard.userId:', exchange?.targetCard?.userId);
  console.log('✅ 현재 로그인한 userId:', userId);

  // 판매자 권한 확인 로직 수정
  // 현재 로그인한 사용자가 대상 카드의 소유자인지 확인
  if (exchange.targetCard.userId !== userId) {
    // 추가 로깅으로 문제 파악
    console.log('❌ 권한 오류: 카드 소유자와 현재 사용자가 일치하지 않음');
    console.log('targetCard 전체 정보:', exchange.targetCard);
    throw new BadRequestError('본인의 카드에 대한 요청만 수락할 수 있습니다.');
  }

  const updated = await updateExchangeStatus(exchangeId, 'ACCEPTED');
  console.log('[Service] 교환 수락 완료:', updated);
  return updated;
}

export async function rejectExchange(userId, exchangeId) {
  console.log('[Service] rejectExchange 호출:', {userId, exchangeId});

  const exchange = await findExchangeById(exchangeId);
  if (!exchange) throw new NotFoundError('해당 교환 요청이 존재하지 않습니다.');

  console.log('✅ exchange.targetCard.userId:', exchange?.targetCard?.userId);
  console.log('✅ 현재 로그인한 userId:', userId);

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

  if (exchange.requestCard.userId !== userId) {
    throw new BadRequestError('본인이 보낸 교환 요청만 취소할 수 있습니다.');
  }

  if (exchange.status !== 'REQUESTED') {
    throw new BadRequestError('이미 처리된 교환 요청은 취소할 수 없습니다.');
  }

  const updated = await updateExchangeStatus(exchangeId, 'CANCELLED');
  console.log('[Service] 교환 취소 완료:', updated);
  return updated;
}
