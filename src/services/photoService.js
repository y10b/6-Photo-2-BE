import photoRepository from '../repositories/photoRepository.js';

export async function getAllCards(query) {
  return photoRepository.findAllCards(query);
}

export async function getMyIDLECards(query) {
  return photoRepository.findMyIDLECards(query);
}

export async function getMySales(query) {
  return photoRepository.findMySales(query);
}

export async function purchaseCard({userId, saleId, quantity}) {
  return photoRepository.purchaseCard({userId, saleId, quantity});
}

export async function createMyCard(userId, cardData) {
  return await photoRepository.createMyCard(userId, cardData);
}

// 남은 카드 개수 계산
export async function getCardCreationQuota(userId) {
  return await photoRepository.getCardCreationQuota(userId);
}

export default {
  getAllCards,
  getMyIDLECards,
  getMySales,
  purchaseCard,
  createMyCard,
  getCardCreationQuota,
};
