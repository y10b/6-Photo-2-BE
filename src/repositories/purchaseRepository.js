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
