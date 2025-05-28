import * as purchaseService from '../services/purchaseService.js';

export const getShopDetail = async (req, res, next) => {
    try {
        const shopId = Number(req.params.shopId);
        if (isNaN(shopId)) {
            return res.status(400).json({ success: false, message: '유효한 shopId가 필요합니다.' });
        }

        const shop = await purchaseService.getShopDetail(shopId);

        if (!shop) {
            return res.status(404).json({ success: false, message: '해당 판매 게시글이 존재하지 않습니다.' });
        }

        if (shop.remainingQuantity <= 0) {
            const { price, initialQuantity, remainingQuantity, seller, photoCard } = shop;

            return res.status(410).json({
                success: false,
                message: '이미 판매 완료된 상품입니다.',
                data: {
                    id: shop.id,
                    price,
                    initialQuantity,
                    remainingQuantity,
                    sellerNickname: seller.nickname,
                    ...photoCard,
                },
            });
        }

        const { price, initialQuantity, remainingQuantity, seller, photoCard } = shop;

        res.status(200).json({
            success: true,
            data: {
                id: shop.id,
                price,
                initialQuantity,
                remainingQuantity,
                sellerNickname: seller.nickname,
                ...photoCard,
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
