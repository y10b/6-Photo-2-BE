import photoRepository from '../repositories/photoRepository.js';

export async function getAllCards(query) {
  return photoRepository.findAllCards(query);
}

export async function getCardDetail(id) {
  return photoRepository.findCardById(id);
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

export default {
  getAllCards,
  getCardDetail,
  getMyIDLECards,
  getMySales,
  purchaseCard,
};
