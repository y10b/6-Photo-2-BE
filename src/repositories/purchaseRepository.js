import prisma from '../prisma/client.js';

export async function findShopsByPhotoCardId(id) {
    return await prisma.shop.findMany({
        where: { photoCardId: Number(id) },
        select: {
            price: true,
            initialQuantity: true,
            remainingQuantity: true,
            seller: { select: { nickname: true } },
            photoCard: {
                select: {
                    name: true,
                    description: true,
                    imageUrl: true,
                    grade: true,
                    genre: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function findShopWithPhotoCard(shopId) {
    return await prisma.shop.findUnique({
        where: { id: shopId },
        include: { photoCard: true },
    });
}

export async function purchaseCard(userId, shopId, quantity) {
    return await prisma.$transaction(async (tx) => {
        const shop = await tx.shop.findUnique({
            where: { id: shopId },
            include: {
                listedItems: {
                    where: { status: 'LISTED' },
                    take: quantity,
                },
                photoCard: true,
            },
        });

        if (!shop) throw new Error('판매 게시글을 찾을 수 없습니다.');
        if (shop.listingType !== 'FOR_SALE' && shop.listingType !== 'FOR_SALE_AND_TRADE') {
            throw new Error('해당 판매 게시글은 구매 가능한 유형이 아닙니다.');
        }
        if (shop.remainingQuantity < quantity || shop.listedItems.length < quantity) {
            throw new Error('재고가 부족하거나 판매 가능한 카드 수량이 부족합니다.');
        }

        const totalPrice = shop.price * quantity;
        const buyer = await tx.user.findUnique({
            where: { id: userId },
            include: { point: true },
        });

        if (!buyer?.point || buyer.point.balance < totalPrice) {
            throw new Error('포인트가 부족합니다.');
        }

        await tx.point.update({
            where: { userId },
            data: { balance: { decrement: totalPrice } },
        });

        await tx.pointHistory.create({
            data: {
                userId,
                points: -totalPrice,
                pointType: 'PURCHASE',
            },
        });

        for (const card of shop.listedItems) {
            await tx.userCard.update({
                where: { id: card.id },
                data: {
                    userId,
                    status: 'IDLE',
                    shopListingId: null,
                },
            });
        }

        const updatedShop = await tx.shop.update({
            where: { id: shopId },
            data: { remainingQuantity: { decrement: quantity } },
        });

        return {
            success: true,
            message: `${quantity}장 구매에 성공했습니다.`,
            shopId: shop.id,
            photoCardId: shop.photoCard.id,
            grade: shop.photoCard.grade,
            genre: shop.photoCard.genre,
            userId,
            initialQuantity: shop.initialQuantity,
            purchasedQuantity: quantity,
            remainingQuantity: updatedShop.remainingQuantity,
        };
    });
}
