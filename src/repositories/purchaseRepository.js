import prisma from '../prisma/client.js';

// 하나의 포토카드에 대한 모든 판매 게시글 조회
export async function findShopsByPhotoCardId(id) {
    return await prisma.shop.findMany({
        where: { photoCardId: Number(id) },
        select: {
            price: true,
            initialQuantity: true,
            remainingQuantity: true,
            seller: {
                select: {
                    nickname: true,
                },
            },
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
        orderBy: {
            createdAt: 'desc',
        },
    });
}

export async function purchaseCard(userId, shopId, quantity) {
    return await prisma.$transaction(async (tx) => {
        const shop = await tx.shop.findUnique({
            where: { id: shopId },
            include: {
                listedItems: {
                    where: { status: 'LISTED' },  // 판매 중인 카드만 조회
                    take: quantity,
                },
                photoCard: true,
            },
        });

        if (!shop) {
            throw new Error('판매 게시글을 찾을 수 없습니다.');
        }

        if (shop.listingType !== 'FOR_SALE' && shop.listingType !== 'FOR_SALE_AND_TRADE') {
            throw new Error('해당 판매 게시글은 구매 가능한 유형이 아닙니다.');
        }

        if (shop.remainingQuantity < quantity) {
            throw new Error('재고가 부족합니다.');
        }

        if (shop.listedItems.length < quantity) {
            throw new Error('판매 가능한 카드가 부족합니다.');
        }

        const totalPrice = shop.price * quantity;

        const buyer = await tx.user.findUnique({
            where: { id: userId },
            include: { point: true },
        });

        if (!buyer?.point || buyer.point.balance < totalPrice) {
            throw new Error('포인트가 부족합니다.');
        }

        // 포인트 차감
        await tx.point.update({
            where: { userId },
            data: { balance: { decrement: totalPrice } },
        });

        // 포인트 히스토리 기록
        await tx.pointHistory.create({
            data: {
                userId,
                points: -totalPrice,
                pointType: 'PURCHASE',
            },
        });

        // 카드 소유권 이전 및 상태 변경
        for (const card of shop.listedItems) {
            await tx.userCard.update({
                where: { id: card.id },
                data: {
                    userId,
                    status: 'IDLE',  // 구매 후 소유 상태로 변경
                    shopListingId: null,
                },
            });
        }

        // 재고 감소
        await tx.shop.update({
            where: { id: shopId },
            data: {
                remainingQuantity: { decrement: quantity },
            },
        });

        return {
            purchasedCount: quantity,
            newOwnerId: userId,
            remainingQuantity: shop.remainingQuantity - quantity,
        };
    });
}