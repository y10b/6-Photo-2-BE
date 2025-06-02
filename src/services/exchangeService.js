import {
  findCardById,
  createExchange,
  findExchangeById,
  updateExchangeStatus,
  findExchangesByTargetCardId,
  findExchangesByShopId,
} from '../repositories/exchangeRepository.js';
import { BadRequestError, NotFoundError } from '../utils/customError.js';
import { notificationService } from './notificationService.js';
import prisma from '../prisma/client.js';

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

  // 요청 카드의 상태 확인
  if (requestCard.status !== 'IDLE') {
    throw new BadRequestError('교환을 요청하는 카드는 IDLE 상태여야 합니다.');
  }

  // 대상 카드의 상태 확인
  if (!targetCard.shopListingId) {
    throw new BadRequestError('판매 중인 카드에만 교환을 제안할 수 있습니다.');
  }

  // 판매자 정보 가져오기
  const shop = await prisma.shop.findUnique({
    where: { id: targetCard.shopListingId },
    include: { seller: true },
  });

  if (!shop) {
    throw new NotFoundError('판매 정보를 찾을 수 없습니다.');
  }

  // 판매 유형 확인
  if (shop.listingType !== 'FOR_SALE_AND_TRADE') {
    throw new BadRequestError('교환이 허용되지 않은 판매 게시글입니다.');
  }

  const exchange = await createExchange(
    requestCardId,
    targetCardId,
    description,
  );
  console.log('[Service] 교환 제안 생성 완료:', exchange);

  const confirmed = await findExchangeById(exchange.id);

  // 알림 제안
  const nickname = requestCard.user.nickname;
  const grade = targetCard.photoCard.grade;
  const name = targetCard.photoCard.name;
  const relatedShopId = targetCard.shopListingId;
  const ownerId = shop.seller.id;

  const content = `${nickname}님이 [${grade} | ${name}]의 포토카드 교환을 제안했습니다.`;

  await notificationService.createNotification(
    ownerId,
    'EXCHANGE_PROPOSED',
    content,
    relatedShopId,
  );

  return confirmed;
}

export async function acceptExchange(userId, exchangeId) {
  console.log('[Service] acceptExchange 호출:', { userId, exchangeId });

  const exchange = await findExchangeById(exchangeId);
  if (!exchange) {
    throw new NotFoundError('해당 교환 요청이 존재하지 않습니다.');
  }

  // 교환 상태 확인
  if (exchange.status !== 'REQUESTED') {
    let errorMessage = '이미 처리된 교환 요청입니다.';
    if (exchange.status === 'ACCEPTED') {
      errorMessage = '이미 수락된 교환 요청입니다.';
    } else if (exchange.status === 'REJECTED') {
      errorMessage = '이미 거절된 교환 요청입니다.';
    } else if (exchange.status === 'CANCELLED') {
      errorMessage = '취소된 교환 요청입니다.';
    }
    throw new BadRequestError(errorMessage);
  }

  // 대상 카드 정보 가져오기
  const targetCard = exchange.targetCard;
  console.log('✅ 대상 카드 정보:', {
    id: targetCard.id,
    userId: targetCard.userId,
    shopListingId: targetCard.shopListingId,
  });

  // 판매자 권한 확인
  const shopId = targetCard.shopListingId;
  console.log('✅ 판매 게시글 ID:', shopId);

  if (!shopId) {
    throw new BadRequestError(
      '판매 중인 카드에 대한 교환 요청만 수락할 수 있습니다.',
    );
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      sellerId: true,
      remainingQuantity: true,
    },
  });

  console.log('✅ 판매 게시글 정보:', shop);
  console.log('✅ 현재 로그인한 userId:', userId);

  if (!shop) {
    throw new NotFoundError('판매 정보를 찾을 수 없습니다.');
  }

  if (shop.sellerId !== userId) {
    throw new BadRequestError('판매자만 교환 요청을 수락할 수 있습니다.');
  }

  // 재고 확인
  if (shop.remainingQuantity < 1) {
    throw new BadRequestError('재고가 부족하여 교환을 수락할 수 없습니다.');
  }

  console.log('✅ 판매자 권한 확인 성공');

  const updated = await prisma.$transaction(async tx => {
    // 교환 상태 업데이트
    const acceptedExchange = await tx.exchange.update({
      where: { id: exchangeId },
      data: { status: 'ACCEPTED' },
    });

    // 카드 소유권 이전
    await tx.userCard.update({
      where: { id: exchange.requestCardId },
      data: {
        userId: exchange.targetCard.userId,
        status: 'SOLD',
        shopListingId: null,
      },
    });

    await tx.userCard.update({
      where: { id: exchange.targetCardId },
      data: {
        userId: exchange.requestCard.userId,
        status: 'SOLD',
        shopListingId: null,
      },
    });

    // 판매글의 남은 수량 감소
    await tx.shop.update({
      where: { id: shopId },
      data: {
        remainingQuantity: {
          decrement: 1,
        },
      },
    });

    return acceptedExchange;
  });

  // 알림 수락
  const nickname = exchange.targetCard.user.nickname;
  const grade = exchange.targetCard.photoCard.grade;
  const name = exchange.targetCard.photoCard.name;
  const relatedShopId = exchange.targetCard.shopListingId;
  const ownerId = exchange.requestCard.userId;

  const content = `${nickname}님이 [${grade} | ${name}]의 포토카드 교환을 수락했습니다.`;

  await notificationService.createNotification(
    ownerId,
    'EXCHANGE_ACCEPTED',
    content,
    relatedShopId,
  );

  console.log('[Service] 교환 수락 완료:', updated);
  return updated;
}

export async function rejectExchange(userId, exchangeId) {
  console.log('[Service] rejectExchange 호출:', { userId, exchangeId });

  const exchange = await findExchangeById(exchangeId);
  if (!exchange) {
    throw new NotFoundError('해당 교환 요청이 존재하지 않습니다.');
  }

  // 교환 상태 확인
  if (exchange.status !== 'REQUESTED') {
    throw new BadRequestError('이미 처리된 교환 요청입니다.');
  }

  // 대상 카드 정보 가져오기
  const targetCard = exchange.targetCard;
  console.log('✅ 대상 카드 정보:', {
    id: targetCard.id,
    userId: targetCard.userId,
    shopListingId: targetCard.shopListingId,
  });

  // 판매자 권한 확인 - 직접 shop 정보 조회
  const shopId = targetCard.shopListingId;
  console.log('✅ 판매 게시글 ID:', shopId);

  if (!shopId) {
    throw new BadRequestError(
      '판매 중인 카드에 대한 교환 요청만 거절할 수 있습니다.',
    );
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { sellerId: true },
  });

  console.log('✅ 판매 게시글 정보:', shop);
  console.log('✅ 현재 로그인한 userId:', userId);

  if (!shop) {
    throw new NotFoundError('판매 정보를 찾을 수 없습니다.');
  }

  if (shop.sellerId !== userId) {
    throw new BadRequestError('판매자만 교환 요청을 거절할 수 있습니다.');
  }

  console.log('✅ 판매자 권한 확인 성공');

  const updated = await updateExchangeStatus(exchangeId, 'REJECTED');

  // 알림 거절
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

  console.log('[Service] 교환 거절 완료:', updated);
  return updated;
}

export async function getExchangeProposals(userId, shopId) {
  console.log('[Service] getExchangeProposals 호출:', { userId, shopId });

  // 판매 게시글 정보 조회
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      seller: true,
      listedItems: {
        take: 1, // 대표 카드 하나만 가져옴
      }
    }
  });

  if (!shop) {
    throw new NotFoundError('해당 판매 게시글이 존재하지 않습니다.');
  }

  // 판매자 여부 확인
  const isSeller = shop.sellerId === userId;

  // 판매자가 아니고, 교환 제안자도 아닌 경우 접근 제한
  if (!isSeller) {
    const userProposals = await prisma.exchange.findFirst({
      where: {
        targetCard: { shopListingId: shopId },
        requestCard: { userId: userId }
      }
    });

    if (!userProposals) {
      throw new BadRequestError('해당 판매 게시글의 교환 제안을 조회할 권한이 없습니다.');
    }
  }

  // 교환 제안 목록 조회
  const proposals = await findExchangesByShopId(shopId);

  const formattedProposals = await Promise.all(
    proposals.map(async exchange => {
      const requestCard = exchange.requestCard;
      let photoCard = requestCard?.photoCard;

      if (!photoCard || !photoCard.id) {
        photoCard = await prisma.photoCard.findUnique({
          where: { id: requestCard.photoCardId },
        });
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

  return {
    proposals: formattedProposals,
    isSeller
  };
}
