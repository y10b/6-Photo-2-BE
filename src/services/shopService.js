import shopRepository from "../repositories/shopRepository.js";

/**
 * 판매 등록
 */
const registerShop = async ({
  userId,
  photoCardId,
  quantity,
  price,
  listingType,
  exchangeGrade,
  exchangeGenre,
  exchangeDescription,
}) => {
  try {
    const availableCards = await shopRepository.findUserIdleCards(
      userId,
      photoCardId
    );

    if (availableCards.length < quantity) {
      throw new Error("보유한 포토카드 수량이 부족합니다.");
    }

    const shop = await shopRepository.createShop({
      sellerId: userId,
      photoCardId,
      price,
      initialQuantity: quantity,
      remainingQuantity: quantity,
      listingType,
      exchangeGrade,
      exchangeGenre,
      exchangeDescription,
    });

    const selectedCards = availableCards.slice(0, quantity);
    await Promise.all(
      selectedCards.map((card) =>
        shopRepository.updateUserCardStatusToListed(card.id, shop.id)
      )
    );

    return shop;
  } catch (err) {
    console.error("registerShop 내부 에러:", err);
    throw err;
  }
};

/**
 * 판매글 수정
 */
const updateShop = async (userId, shopId, updateData) => {
  const shop = await shopRepository.findShopById(shopId);
  if (!shop) throw new Error("판매글을 찾을 수 없습니다.");
  if (shop.sellerId !== userId) throw new Error("권한이 없습니다.");

  // 수량 변경 확인
  if (
    updateData.initialQuantity !== undefined &&
    updateData.initialQuantity !== shop.initialQuantity
  ) {
    const currentListedCards = await shopRepository.findListedUserCardsByShopId(shopId);
    const currentCount = currentListedCards.length;
    const newQuantity = updateData.initialQuantity;

    if (newQuantity < currentCount) {
      const cardsToReset = currentListedCards.slice(newQuantity);
      await Promise.all(
        cardsToReset.map((card) =>
          shopRepository.updateUserCardStatusToListed(card.id, null)
        )
      );
      await shopRepository.resetUserCardsToIdle(shopId);
    }

    if (newQuantity > currentCount) {
      const need = newQuantity - currentCount;
      const availableCards = await shopRepository.findUserIdleCards(userId, shop.photoCardId);
      if (availableCards.length < need) {
        throw new Error("추가할 포토카드가 부족합니다.");
      }
      const selected = availableCards.slice(0, need);
      await Promise.all(
        selected.map((card) =>
          shopRepository.updateUserCardStatusToListed(card.id, shopId)
        )
      );
    }

    updateData.remainingQuantity = newQuantity; 
  }

  return await shopRepository.updateShop(shopId, updateData);
};

/**
 * 판매글 삭제
 */
const deleteShop = async (userId, shopId) => {
  const shop = await shopRepository.findShopById(shopId);
  if (!shop) throw new Error("판매글을 찾을 수 없습니다.");
  if (shop.sellerId !== userId) throw new Error("권한이 없습니다.");

  await shopRepository.resetUserCardsToIdle(shopId);
  return await shopRepository.deleteShop(shopId);
};

export default {
  registerShop,
  updateShop,
  deleteShop,
};
