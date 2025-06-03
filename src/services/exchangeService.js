import {
  findExchangesByShopId,
  createExchange,
  updateExchange,
} from '../repositories/exchangeRepository.js';
import { NotFoundError, BadRequestError } from '../utils/customError.js';
import prisma from '../prisma/client.js';

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

export async function createExchangeRequest(userId, shopId, requestCardId, description) {
  console.log('[Service] createExchangeRequest 호출:', { userId, shopId, requestCardId });

  // 판매 게시글 정보 조회
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      seller: true,
      listedItems: {
        take: 1,
      }
    }
  });

  if (!shop) {
    throw new NotFoundError('해당 판매 게시글이 존재하지 않습니다.');
  }

  // 판매자 본인은 교환 요청할 수 없음
  if (shop.sellerId === userId) {
    throw new BadRequestError('자신의 판매 게시글에는 교환 요청을 할 수 없습니다.');
  }

  // 교환 가능한 게시글인지 확인
  if (shop.listingType !== 'FOR_SALE_AND_TRADE') {
    throw new BadRequestError('교환이 불가능한 판매 게시글입니다.');
  }

  // 요청 카드가 존재하는지 확인
  const requestCard = await prisma.userCard.findUnique({
    where: { id: requestCardId },
    include: {
      user: true,
      photoCard: true
    }
  });

  if (!requestCard) {
    throw new NotFoundError('교환 요청할 카드를 찾을 수 없습니다.');
  }

  // 요청 카드가 본인 소유인지 확인
  if (requestCard.userId !== userId) {
    throw new BadRequestError('본인이 소유한 카드만 교환 요청할 수 있습니다.');
  }

  // 이미 교환 요청한 적이 있는지 확인
  const existingExchange = await prisma.exchange.findFirst({
    where: {
      targetCard: { shopListingId: shopId },
      requestCard: { 
        userId: userId,
        id: requestCardId  // 같은 카드로 중복 요청했는지 체크
      }
    }
  });

  if (existingExchange) {
    throw new BadRequestError('이미 같은 카드로 교환 요청한 게시글입니다.');
  }

  // 교환 요청 생성
  const exchange = await createExchange({
    targetCardId: shop.listedItems[0].id,
    requestCardId: requestCardId,
    description: description || '',
    status: 'REQUESTED'
  });

  return {
    id: exchange.id,
    status: exchange.status,
    createdAt: exchange.createdAt
  };
}

export async function updateExchangeStatus(userId, exchangeId, status) {
  console.log('[Service] updateExchangeStatus 호출:', { userId, exchangeId, status });

  // 교환 요청 정보 조회
  const exchange = await prisma.exchange.findUnique({
    where: { id: exchangeId },
    include: {
      targetCard: {
        include: {
          shopListing: true
        }
      }
    }
  });

  if (!exchange) {
    throw new NotFoundError('해당 교환 요청을 찾을 수 없습니다.');
  }

  // 판매자 여부 확인
  const isSeller = exchange.targetCard.shopListing.sellerId === userId;
  if (!isSeller) {
    throw new BadRequestError('교환 요청 상태를 변경할 권한이 없습니다.');
  }

  // 이미 처리된 요청인지 확인
  if (exchange.status !== 'REQUESTED') {
    throw new BadRequestError('이미 처리된 교환 요청입니다.');
  }

  // 상태값 검증
  if (!['ACCEPTED', 'REJECTED'].includes(status)) {
    throw new BadRequestError('유효하지 않은 상태값입니다.');
  }

  // 교환 요청 상태 업데이트
  const updatedExchange = await updateExchange(exchangeId, status);

  return {
    id: updatedExchange.id,
    status: updatedExchange.status,
    updatedAt: updatedExchange.updatedAt
  };
}
