import * as purchaseRepository from '../repositories/purchaseRepository.js';
import userRepository from '../repositories/userRepository.js';
import {notificationService} from './notificationService.js';

export async function getShopDetail(shopId) {
  return await purchaseRepository.findShopById(shopId);
}

export const purchaseCardService = async (userId, shopId, quantity) => {
  try {
    const purchaseResult = await purchaseRepository.purchaseCard(
      userId,
      shopId,
      quantity,
    );

    // 구매됨 알림
    const shopInfo = await purchaseRepository.findShopWithPhotoCard(shopId);
    const cardName = shopInfo?.photoCard?.name || '포토카드';

    const user = await userRepository.findById(userId);
    const nickname = user?.nickname || '사용자';

    await notificationService.createNotification(
      shopInfo.seller.id,
      'SELL_COMPLETED',
      `${nickname}님이 [${shopInfo?.photoCard.grade} | ${cardName}]을 ${quantity}장 구매했습니다.`,
      shopId,
    );

    return purchaseResult;
  } catch (error) {
    // 실패 시 카드 정보도 포함해서 에러 던짐
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
    throw wrappedError;
  }
};
