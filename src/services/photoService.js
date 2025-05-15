import photoRepository from "../repositories/photoRepository.js";

export async function getAllCards(query) {
  return photoRepository.findAllCards(query);
}

export async function getCardDetail(id) {
  return photoRepository.findCardById(id);
}

export async function getMyCards(query) {
  return photoRepository.findMyCards(query);
}

export async function getMySales(query) {
  return photoRepository.findMySales(query);
}

export default {
  getAllCards,
  getCardDetail,
  getMyCards,
  getMySales,
};
