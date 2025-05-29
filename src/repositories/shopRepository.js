import prisma from '../prisma/client.js';

/**
 *  유저의 특정 포토카드 소유 목록 조회(IDLE 상태)
 */
const findUserIdleCards = async (userId, photoCardId) => {
  return await prisma.userCard.findMany({
    where: {
      userId,
      photoCardId,
      status: 'IDLE',
    },
  });
};

/**
 * Shop 테이블에 판매글 생성
 */
const createShop = async ({
  sellerId,
  photoCardId,
  price,
  initialQuantity,
  remainingQuantity,
  listingType,
  exchangeGrade,
  exchangeGenre,
  exchangeDescription,
}) => {
  return await prisma.shop.create({
    data: {
      sellerId,
      photoCardId,
      price,
      initialQuantity,
      remainingQuantity,
      listingType,
      exchangeGrade,
      exchangeGenre,
      exchangeDescription,
    },
  });
};

/**
 * UserCard 상태를 LISTED로 변경하고 shopId와 연결
 */
const updateUserCardStatusToListed = async (userCardId, shopId) => {
  return await prisma.userCard.update({
    where: {id: userCardId},
    data: {
      status: 'LISTED',
      shopListingId: shopId,
    },
  });
};

/**
 * Shop 조회 (shopId로)
 */
const findShopById = async shopId => {
  return await prisma.shop.findUnique({
    where: {id: Number(shopId)},
    include: {
      photoCard: true, 
      seller: true, 
    },
  });
};

/**
 *  Shop 수정
 */
const updateShop = async (shopId, data) => {
  return await prisma.shop.update({where: {id: shopId}, data});
};

/**
 * UserCard 상태를 다시 IDLE로 변경 (shopListingId null 처리 포함)
 */
const resetUserCardsToIdle = async shopId => {
  return await prisma.userCard.updateMany({
    where: {shopListingId: shopId},
    data: {status: 'IDLE', shopListingId: null},
  });
};

/**
 * Shop 삭제
 */
const deleteShop = async shopId => {
  return await prisma.shop.delete({where: {id: shopId}});
};

/**
 * 특정 Shop에 연결된 UserCard 목록 조회 (LISTED 상태)
 */
const findListedUserCardsByShopId = async shopId => {
  return await prisma.userCard.findMany({
    where: {
      shopListingId: shopId,
      status: 'LISTED',
    },
  });
};

export default {
  findUserIdleCards,
  createShop,
  updateUserCardStatusToListed,
  findShopById,
  updateShop,
  resetUserCardsToIdle,
  deleteShop,
  findListedUserCardsByShopId,
};
