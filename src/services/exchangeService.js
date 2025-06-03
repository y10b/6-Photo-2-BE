import {
  findExchangesByShopId,
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
