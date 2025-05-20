import * as purchaseService from '../services/purchaseService.js';

export const getPhotoCardDetail = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const shopList = await purchaseService.getPhotoCardDetails(id);

        if (!shopList || shopList.length === 0) {
            return res.status(404).json({ success: false, message: '해당 포토카드의 판매 게시글이 없습니다.' });
        }

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
};

export const purchaseCardController = async (req, res) => {
    const userId = req.user?.id;
    const shopId = Number(req.params.shopId);
    const { quantity } = req.body;

    if (!userId || isNaN(shopId) || !quantity) {
        return res.status(400).json({ message: 'userId, shopId, quantity는 필수입니다.' });
    }

    try {
        const result = await purchaseService.purchaseCardService(userId, shopId, quantity);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || '카드 구매 중 오류가 발생했습니다.',
            ...error.extraInfo, // 서비스에서 붙인 추가 카드 정보
        });
    }
};
