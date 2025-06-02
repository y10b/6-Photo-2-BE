import prisma from '../prisma/client.js';

export async function findCardById(id) {
    console.log('[Repository] findCardById 호출:', id);
    return await prisma.userCard.findUnique({
        where: { id },
        include: {
            user: true,
            photoCard: true // photoCard 정보도 포함
        },
    });
}

export async function createExchange(requestCardId, targetCardId, description) {
    console.log('[Repository] createExchange 호출:', { requestCardId, targetCardId, description });
    return await prisma.exchange.create({
        data: {
            requestCardId,
            targetCardId,
            description: String(description),
            status: 'REQUESTED',
        },
    });
}

export async function findExchangeById(id) {
    return await prisma.exchange.findUnique({
        where: { id },
        include: {
            targetCard: {
                include: {
                    photoCard: true,
                    user: true
                }
            },
            requestCard: {
                include: {
                    photoCard: true,
                    user: true
                }
            }
        },
    });
}

export async function updateExchangeStatus(id, status) {
    return await prisma.exchange.update({
        where: { id },
        data: { status },
    });
}

export async function findExchangesByTargetCardId(targetCardId) {
    return await prisma.exchange.findMany({
        where: { targetCardId },
        include: {
            targetCard: true,
            requestCard: {
                include: {
                    user: true,
                    photoCard: true // photoCard 정보 포함
                }
            }
        },
    });
}

export async function findExchangesByShopId(shopId) {
    return await prisma.exchange.findMany({
        where: {
            targetCard: {
                shopListingId: shopId
            }
        },
        include: {
            targetCard: {
                include: {
                    user: true,
                    photoCard: true,
                    shopListing: true
                }
            },
            requestCard: {
                include: {
                    user: true,
                    photoCard: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

// 새로 추가: 특정 판매글에 대한 내 교환 제안 목록 조회
export async function findMyExchangeRequestsByShopId(userId, shopId) {
    console.log('[Repository] findMyExchangeRequestsByShopId 호출:', { userId, shopId });

    // 먼저 해당 shopId에 연결된 모든 userCard 조회
    const listedCards = await prisma.userCard.findMany({
        where: {
            shopListingId: shopId
        },
        select: {
            id: true
        }
    });

    const targetCardIds = listedCards.map(card => card.id);

    // 내가 요청한 교환 제안 목록 조회
    return await prisma.exchange.findMany({
        where: {
            targetCardId: { in: targetCardIds },
            requestCard: {
                userId: userId
            }
        },
        include: {
            requestCard: {
                include: {
                    photoCard: true,
                    user: true
                }
            },
            targetCard: {
                include: {
                    photoCard: true,
                    user: true,
                    shopListing: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

// 새로 추가: 교환 가능한 내 카드 목록 조회 (IDLE 상태)
export async function findMyExchangeableCards(userId) {
    console.log('[Repository] findMyExchangeableCards 호출:', userId);

    return await prisma.userCard.findMany({
        where: {
            userId: userId,
            status: 'IDLE'
        },
        include: {
            photoCard: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

export default {
    findCardById,
    createExchange,
    findExchangeById,
    updateExchangeStatus,
    findExchangesByTargetCardId,
    findExchangesByShopId,
    findMyExchangeRequestsByShopId,
    findMyExchangeableCards
};
