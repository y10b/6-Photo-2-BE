import prisma from '../prisma/client.js';

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
