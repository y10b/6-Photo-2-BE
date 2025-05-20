import * as purchaseService from '../services/purchaseService.js';

export async function getPhotoCardDetail(req, res, next) {
    try {
        const id = Number(req.params.id);
        const shopList = await purchaseService.getPhotoCardDetails(id);

        if (!shopList || shopList.length === 0) {
            return res.status(404).json({ success: false, message: '해당 포토카드의 판매 게시글이 없습니다.' });
        }

        // photoCard 정보는 모든 shop 항목에 동일하므로 첫 번째 항목에서 추출
        const { photoCard } = shopList[0];

        const formattedShops = shopList.map(shop => ({
            price: shop.price,
            initialQuantity: shop.initialQuantity,
            remainingQuantity: shop.remainingQuantity,
            sellerNickname: shop.seller.nickname,
        }));

        res.status(200).json({
            success: true,
            data: {
                ...photoCard,
                shops: formattedShops,
            },
        });
    } catch (error) {
        next(error);
    }
}

//구매 로직
export const purchaseCardController = async (req, res) => {
    try {
        const userId = req.user?.id;
        const shopId = Number(req.params.shopId); // ✅ 수정된 부분
        const { quantity } = req.body;

        if (!userId || isNaN(shopId) || !quantity) {
            return res.status(400).json({ message: 'userId, shopId, quantity는 필수입니다.' });
        }

        const result = await purchaseService.purchaseCardService(userId, shopId, quantity);
        res.status(200).json(result);
    } catch (error) {
        console.error('구매 실패:', error);
        res.status(500).json({ message: error.message || '카드 구매 중 오류가 발생했습니다.' });
    }
};