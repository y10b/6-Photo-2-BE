import {
  findCardById,
  createExchange,
  findExchangeById,
  updateExchangeStatus,
  findExchangesByTargetCardId,
} from '../repositories/exchangeRepository.js';
import {BadRequestError, NotFoundError} from '../utils/customError.js';
import {notificationService} from './notificationService.js';

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

  // 알림 생성
  const exchanged = await findExchangeById(exchange.id);

  const nickname = requestCard.user.nickname;
  const grade = exchanged.targetCard.photoCard.grade;
  const name = exchanged.targetCard.photoCard.name;
  const ownerId = targetCard.userId;
  const relatedShopId = targetCard.shopListingId;

  const content = `${nickname}님이 [${grade} | ${name}]의 포토카드 교환을 제안했습니다.`;
  await notificationService.createNotification(
    ownerId,
    'EXCHANGE_PROPOSED',
    content,
    relatedShopId ?? 0,
  );

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

  // 알림 수락
  const nickname = exchange.targetCard.user.nickname;
  const grade = exchange.targetCard.photoCard.grade;
  const name = exchange.targetCard.photoCard.name;
  const relatedShopId = exchange.targetCard.shopListingId ?? 0;
  const ownerId = exchange.requestCard.userId;

  const content = `${nickname}님이 [${grade} | ${name}]의 포토카드 교환을 수락했습니다.`;
  await notificationService.createNotification(
    ownerId,
    'EXCHANGE_ACCEPTED',
    content,
    relatedShopId,
  );

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

  //알림 거절
  const nickname = exchange.targetCard.user.nickname;
  const grade = exchange.targetCard.photoCard.grade;
  const name = exchange.targetCard.photoCard.name;
  const relatedShopId = exchange.targetCard.shopListingId ?? 0;
  const ownerId = exchange.requestCard.userId;

  const content = `${nickname}님이 [${grade} | ${name}]의 포토카드 교환을 거절했습니다.`;
  await notificationService.createNotification(
    ownerId,
    'EXCHANGE_DECLINED',
    content,
    relatedShopId,
  );

  return updated;
}

export async function getExchangeProposals(userId, cardId) {
  console.log('[Service] getExchangeProposals 호출:', {userId, cardId});

  // TODO: userId 검증 로직 필요하면 추가
  const proposals = await findExchangesByTargetCardId(cardId);
  console.log('[Service] 교환 제안 목록:', proposals);
  return proposals;
}
