import prisma from '../prisma/client.js';

export async function findExchangesByShopId(shopId) {
  return await prisma.exchange.findMany({
    where: {
      targetCard: {
        shopListingId: shopId
      },
      status: 'REQUESTED'
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

export async function deleteExchange(exchangeId) {
  return await prisma.exchange.delete({
    where: { id: exchangeId }
  });
}

export const findMyExchangeRequests = async (userId, status, page, limit, shopListingId) => {
  const skip = (page - 1) * limit;

  // 기본 필터 조건
  const where = {
    requestCard: {
      userId: userId
    },
    ...(status && { status }),
    ...(shopListingId && {
      targetCard: {
        shopListingId: parseInt(shopListingId)
      }
    })
  };

  // 전체 개수 조회
  const total = await prisma.exchange.count({
    where
  });

  // 교환 요청 목록 조회
  const items = await prisma.exchange.findMany({
    where,
    include: {
      targetCard: {
        include: {
          photoCard: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              grade: true,
              genre: true
            }
          },
          shopListing: {
            include: {
              seller: {
                select: {
                  id: true,
                  nickname: true,
                  email: true
                }
              }
            }
          }
        }
      },
      requestCard: {
        include: {
          photoCard: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              grade: true,
              genre: true
            }
          },
          user: {
            select: {
              id: true,
              nickname: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    skip,
    take: limit
  });

  return { items, total };
};
