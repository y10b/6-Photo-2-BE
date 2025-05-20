import * as purchaseRepository from '../repositories/purchaseRepository.js';

export async function getPhotoCardDetails(id) {
    return await purchaseRepository.findShopsByPhotoCardId(id);
}

export const purchaseCardService = async (userId, shopId, quantity) => {
    return await purchaseRepository.purchaseCard(userId, shopId, quantity);
};