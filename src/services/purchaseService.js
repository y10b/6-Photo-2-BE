import * as purchaseRepository from '../repositories/purchaseRepository.js';
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

    const shopInfo = await purchaseRepository.findShopWithPhotoCard(shopId);
    const cardName = shopInfo?.photoCard?.name || '포토카드';
    console.log(cardName);
    await notificationService.createNotification(
      userId,
      'PURCHASE_COMPLETED',
      `${cardName} ${quantity}장 구매 완료되었습니다`,
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
