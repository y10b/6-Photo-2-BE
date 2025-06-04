import {
  findExchangesByShopId,
  createExchange,
  updateExchange,
  deleteExchange,
  findMyExchangeRequests,
} from '../repositories/exchangeRepository.js';
import { NotFoundError, BadRequestError } from '../utils/customError.js';
import prisma from '../prisma/client.js';
import { notificationService } from './notificationService.js';

export async function getExchangeProposals(userId, shopId) {

  // 판매 게시글 정보 조회
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      seller: true,
      listedItems: {
        take: 1, // 대표 카드 하나만 가져옴
      },
    },
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
        requestCard: { userId: userId },
      },
    });

    if (!userProposals) {
      throw new BadRequestError(
        '해당 판매 게시글의 교환 제안을 조회할 권한이 없습니다.',
      );
    }
  }

  // 교환 제안 목록 조회
  const proposals = await findExchangesByShopId(shopId);

  // 응답 데이터 포맷팅
  const formattedProposals = proposals.map(proposal => ({
    id: proposal.id,
    status: proposal.status,
    description: proposal.description,
    createdAt: proposal.createdAt,
    updatedAt: proposal.updatedAt,
    userNickname: proposal.requestCard.user.nickname,
    targetCard: {
      id: proposal.targetCard.id,
      photoCard: {
        id: proposal.targetCard.photoCard.id,
        name: proposal.targetCard.photoCard.name,
        imageUrl: proposal.targetCard.photoCard.imageUrl,
        genre: proposal.targetCard.photoCard.genre,
        grade: proposal.targetCard.photoCard.grade,
      },
      shopListing: {
        id: proposal.targetCard.shopListing.id,
        seller: {
          id: proposal.targetCard.user.id,
          nickname: proposal.targetCard.user.nickname,
        },
      },
    },
    requestCard: {
      id: proposal.requestCard.id,
      photoCard: {
        id: proposal.requestCard.photoCard.id,
        name: proposal.requestCard.photoCard.name,
        imageUrl: proposal.requestCard.photoCard.imageUrl,
        genre: proposal.requestCard.photoCard.genre,
        grade: proposal.requestCard.photoCard.grade,
      },
      user: {
        id: proposal.requestCard.user.id,
        nickname: proposal.requestCard.user.nickname,
      },
    },
  }));

  return {
    proposals: formattedProposals,
    isSeller,
  };
}

export async function createExchangeRequest(
  userId,
  shopId,
  requestCardId,
  description,
) {

  // 판매 게시글 정보 조회
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      seller: true,
      listedItems: {
        take: 1,
      },
    },
  });

  if (!shop) {
    throw new NotFoundError('해당 판매 게시글이 존재하지 않습니다.');
  }

  // 판매자 본인은 교환 요청할 수 없음
  if (shop.sellerId === userId) {
    throw new BadRequestError(
      '자신의 판매 게시글에는 교환 요청을 할 수 없습니다.',
    );
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
      photoCard: true,
    },
  });

  if (!requestCard) {
    throw new NotFoundError('교환 요청할 카드를 찾을 수 없습니다.');
  }

  // 요청 카드가 본인 소유인지 확인
  if (requestCard.userId !== userId) {
    throw new BadRequestError('본인이 소유한 카드만 교환 요청할 수 있습니다.');
  }

  // 이미 교환 요청한 적이 있는지 확인 (거절된 요청은 제외)
  const existingExchange = await prisma.exchange.findFirst({
    where: {
      targetCard: { shopListingId: shopId },
      requestCard: {
        userId: userId,
        id: requestCardId,
      },
      status: {
        not: 'REJECTED',
      },
    },
  });

  if (existingExchange) {
    throw new BadRequestError('이미 같은 카드로 교환 요청한 게시글입니다.');
  }

  // 교환 요청 생성
  const exchange = await createExchange({
    targetCardId: shop.listedItems[0].id,
    requestCardId: requestCardId,
    description: description || '',
    status: 'REQUESTED',
  });

  // 교환 알림
  const notificationContent = `${requestCard.user.nickname}님이 [${requestCard.photoCard.grade} | ${requestCard.photoCard.name}]의 포토카드 교환을 제안했습니다.`;
  console.log(notificationContent);

  await notificationService.createNotification(
    shop.sellerId,
    'EXCHANGE_PROPOSED',
    notificationContent,
    shopId,
  );

  return {
    id: exchange.id,
    status: exchange.status,
    createdAt: exchange.createdAt,
  };
}

export async function updateExchangeStatus(userId, exchangeId, status) {

  // 교환 요청 정보 조회
  const exchange = await prisma.exchange.findUnique({
    where: { id: exchangeId },
    include: {
      targetCard: {
        include: {
          shopListing: {
            include: {
              seller: true,
            },
          },
          user: true,
          photoCard: true,
        },
      },
      requestCard: {
        include: {
          user: true,
          photoCard: true,
        },
      },
    },
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

  // 교환 요청 상태 업데이트 및 카드 소유권 변경
  const updatedExchange = await prisma.$transaction(async tx => {


    // 1. 현재 상태 확인
    const [requestCard, targetCard, shop] = await Promise.all([
      tx.userCard.findUnique({
        where: { id: exchange.requestCardId },
      }),
      tx.userCard.findUnique({
        where: { id: exchange.targetCardId },
      }),
      tx.shop.findUnique({
        where: { id: exchange.targetCard.shopListingId },
      }),
    ]);

    if (!requestCard || !targetCard || !shop) {
      throw new BadRequestError('필요한 데이터를 찾을 수 없습니다.');
    }

    // 남은 수량 확인
    if (shop.remainingQuantity <= 0) {
      throw new BadRequestError('더 이상 교환 가능한 카드가 없습니다.');
    }

    // 2. 교환 요청 상태 업데이트
    const updatedExchange = await tx.exchange.update({
      where: { id: exchangeId },
      data: { status },
    });


    // 3. 교환이 수락된 경우에만 카드 소유권 변경 및 상태 업데이트
    if (status === 'ACCEPTED') {


      try {
        // 구매자가 제시한 카드의 소유자를 판매자로 변경
        await tx.userCard.update({
          where: { id: exchange.requestCardId },
          data: {
            userId: exchange.targetCard.shopListing.sellerId,
            status: 'IDLE',
            shopListingId: null, // 판매 게시글 연결 해제
          },
        });


        // 판매자의 카드 소유자를 구매자로 변경
        await tx.userCard.update({
          where: { id: exchange.targetCardId },
          data: {
            userId: exchange.requestCard.userId,
            status: 'IDLE',
            shopListingId: null, // 판매 게시글 연결 해제
          },
        });


        // 판매 게시글의 남은 수량 감소
        const newRemainingQuantity = shop.remainingQuantity - 1;
        await tx.shop.update({
          where: { id: shop.id },
          data: {
            remainingQuantity: newRemainingQuantity,
            ...(newRemainingQuantity === 0
              ? {
                listingType: 'FOR_SALE',
              }
              : {}),
          },
        });


        // 다른 교환 요청들을 거절 상태로 변경
        if (newRemainingQuantity === 0) {
          await tx.exchange.updateMany({
            where: {
              targetCardId: exchange.targetCardId,
              status: 'REQUESTED',
              id: { not: exchangeId },
            },
            data: { status: 'REJECTED' },
          });

        }
      } catch (error) {
        console.error('[카드 교환 실패]', error);
        throw new BadRequestError(
          '카드 교환 중 오류가 발생했습니다. 다시 시도해주세요.',
        );
      }
    }

    return updatedExchange;
  });

  //  알림 교환 승인/거절
  const shopId = exchange.targetCard.shopListingId;
  const requesterUserId = exchange.requestCard.userId;
  const sellerNickname = exchange.targetCard.shopListing.seller.nickname;

  if (status === 'ACCEPTED') {
    const notificationContent = `${sellerNickname}님과의 [${exchange.targetCard.photoCard.grade} | ${exchange.targetCard.photoCard.name}]의 포토카드 교환이 성사되었습니다.`;

    await notificationService.createNotification(
      requesterUserId,
      'EXCHANGE_ACCEPTED',
      notificationContent,
      shopId,
    );
  } else if (status === 'REJECTED') {
    const notificationContent = `${sellerNickname}님과의 [${exchange.targetCard.photoCard.grade} | ${exchange.targetCard.photoCard.name}]의 포토카드 교환이 거절되었습니다.`;

    await notificationService.createNotification(
      requesterUserId,
      'EXCHANGE_DECLINED',
      notificationContent,
      shopId,
    );
  }


  return updatedExchange;
}

export async function cancelExchangeRequest(userId, exchangeId) {


  // 교환 요청 정보 조회
  const exchange = await prisma.exchange.findUnique({
    where: { id: exchangeId },
    include: {
      requestCard: true,
      targetCard: {
        include: {
          shopListing: true,
        },
      },
    },
  });

  if (!exchange) {
    throw new NotFoundError('해당 교환 요청을 찾을 수 없습니다.');
  }



  // 요청자 여부 확인
  const isRequester = exchange.requestCard.userId === userId;
  if (!isRequester) {
    throw new BadRequestError('교환 요청을 취소할 권한이 없습니다.');
  }

  // 이미 처리된 요청인지 확인
  if (exchange.status !== 'REQUESTED') {

    throw new BadRequestError('이미 처리된 교환 요청은 취소할 수 없습니다.');
  }

  // 교환 요청 삭제
  await deleteExchange(exchangeId);


  return {
    id: exchangeId,
    message: '교환 요청이 취소되었습니다.',
  };
}

export const getMyExchangeRequests = async (
  userId,
  status,
  page,
  limit,
  shopListingId,
) => {


  // status 유효성 검사
  if (status && !['REQUESTED', 'ACCEPTED', 'REJECTED'].includes(status)) {
    throw new BadRequestError('Invalid status value');
  }

  // 교환 요청 목록 조회
  const { items, total } = await findMyExchangeRequests(
    userId,
    status,
    page,
    limit,
    shopListingId,
  );

  // 응답 데이터 포맷팅
  const formattedRequests = items.map(request => ({
    id: request.id,
    status: request.status,
    description: request.description,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    targetCard: {
      id: request.targetCard.id,
      photoCard: {
        id: request.targetCard.photoCard.id,
        name: request.targetCard.photoCard.name,
        imageUrl: request.targetCard.photoCard.imageUrl,
        genre: request.targetCard.photoCard.genre,
        grade: request.targetCard.photoCard.grade,
      },
      shopListing: {
        id: request.targetCard.shopListing.id,
        seller: request.targetCard.shopListing.seller,
      },
    },
    requestCard: {
      id: request.requestCard.id,
      photoCard: {
        id: request.requestCard.photoCard.id,
        name: request.requestCard.photoCard.name,
        imageUrl: request.requestCard.photoCard.imageUrl,
        genre: request.requestCard.photoCard.genre,
        grade: request.requestCard.photoCard.grade,
      },
      user: request.requestCard.user,
    },
  }));

  return {
    requests: formattedRequests,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
  };
};
