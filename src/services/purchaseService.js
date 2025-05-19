import * as purchaseRepository from '../repositories/purchaseRepository.js';

export async function getPhotoCardDetails(id) {
    return await purchaseRepository.findShopsByPhotoCardId(id);
}
