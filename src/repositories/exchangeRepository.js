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

// 교환 요청 생성
export async function createExchange({ targetCardId, requestCardId, description, status }) {
  return await prisma.exchange.create({
    data: {
      targetCardId,
      requestCardId,
      description,
      status
    },
    include: {
      targetCard: {
        include: {
          user: true,
          photoCard: true
        }
      },
      requestCard: {
        include: {
          user: true,
          photoCard: true
        }
      }
    }
  });
}

export async function updateExchange(exchangeId, status) {
  return await prisma.exchange.update({
    where: { id: exchangeId },
    data: { status },
    include: {
      targetCard: {
        include: {
          user: true,
          photoCard: true
        }
      },
      requestCard: {
        include: {
          user: true,
          photoCard: true
        }
      }
    }
  });
}
