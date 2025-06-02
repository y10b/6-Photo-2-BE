import * as purchaseRepository from '../repositories/purchaseRepository.js';
import userRepository from '../repositories/userRepository.js';
import { notificationService } from './notificationService.js';

export async function getShopDetailService(shopId, userId) {
  const shop = await purchaseRepository.findShopById(shopId);

  if (!shop) {
    return { shop: null };
  }

  const { price, initialQuantity, remainingQuantity, seller, photoCard } = shop;

  // 현재 사용자가 판매자인지 확인
  const isSeller = seller.id === userId;

  return {
    shop,
    data: {
      id: shop.id,
      price,
      initialQuantity,
      remainingQuantity,
      sellerNickname: seller.nickname,
      isSeller, // 판매자 여부 추가
      ...photoCard,
    }
  };
}

export const purchaseCardService = async (userId, shopId, quantity) => {
  try {
    // 판매글 정보 조회하여 판매자 ID 확인
    const shopInfo = await purchaseRepository.findShopById(shopId);

    // 판매자와 구매자가 동일한 경우 구매 불가
    if (shopInfo && shopInfo.seller && shopInfo.seller.id === userId) {
      const error = new Error('본인이 등록한 상품은 구매할 수 없습니다.');
      error.status = 400;
      throw error;
    }

    // 리포지토리에서 실제 구매 처리
    const purchaseResult = await purchaseRepository.purchaseCard(
      userId,
      shopId,
      quantity,
    );

    // 구매됨 알림
    const shopInfo2 = await purchaseRepository.findShopWithPhotoCard(shopId);
    const cardName = shopInfo2?.photoCard?.name || '포토카드';

    const user = await userRepository.findById(userId);
    const nickname = user?.nickname || '사용자';

    await notificationService.createNotification(
      shopInfo2.seller.id,
      'SELL_COMPLETED',
      `${nickname}님이 [${shopInfo2?.photoCard.grade} | ${cardName}]을 ${quantity}장 구매했습니다.`,
      shopId,
    );

    return {
      message: '카드 구매 성공',
      data: purchaseResult.data
    };
  } catch (error) {
    // 실패 시 카드 정보도 포함해서 에러 던짐
    if (!error.status) {
      const shopInfo = await purchaseRepository.findShopWithPhotoCard(shopId);
      const extraInfo = {
        shopId,
        userId,
      };

      if (shopInfo?.photoCard) {
        extraInfo.photoCardId = shopInfo.photoCard.id;
        extraInfo.grade = shopInfo.photoCard.grade;
        extraInfo.genre = shopInfo.photoCard.genre;
      }

      const wrappedError = new Error(error.message);
      wrappedError.extraInfo = extraInfo;
      wrappedError.status = 500;
      throw wrappedError;
    }
    throw error;
  }
};
