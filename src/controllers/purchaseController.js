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
    const userId = req.user?.id;
    const shopId = Number(req.params.shopId);
    const { quantity } = req.body;

    if (!userId || isNaN(shopId) || !quantity) {
        return res.status(400).json({ message: 'userId, shopId, quantity는 필수입니다.' });
    }

    // 실패 응답용 정보 미리 조회
    let shopInfo;
    try {
        shopInfo = await prisma.shop.findUnique({
            where: { id: shopId },
            include: { photoCard: true },
        });

        const result = await purchaseService.purchaseCardService(userId, shopId, quantity);

        res.status(200).json(result);
    } catch (error) {
        console.error('구매 실패:', error);

        const failureResponse = {
            success: false,
            message: `${quantity}장 구매에 실패했습니다.`,
            shopId,
            userId,
        };

        if (shopInfo?.photoCard) {
            failureResponse.photoCardId = shopInfo.photoCard.id;
            failureResponse.grade = shopInfo.photoCard.grade;
            failureResponse.genre = shopInfo.photoCard.genre;
        }

        res.status(500).json({
            ...failureResponse,
            error: error.message || '카드 구매 중 오류가 발생했습니다.',
        });
    }
};