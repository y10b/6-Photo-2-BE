import prisma from '../prisma/client.js';
import _ from 'lodash';
import {startOfMonth, endOfMonth} from 'date-fns';

// 필터 조건 생성 함수
function createFilterOption({filterType, filterValue, keyword}) {
  const shop = {};
  const photoCard = {};

  if (keyword) {
    photoCard.name = {contains: keyword};
  }

  if (filterType && filterValue) {
    const values = filterValue.split(',').map(v => v.toUpperCase());

    switch (filterType) {
      case 'grade':
        photoCard.grade = {in: values};
        break;
      case 'genre':
        photoCard.genre = {in: values};
        break;
      case 'soldOut':
        shop.remainingQuantity = filterValue === 'true' ? 0 : {gt: 0};
        break;
      case 'method':
        break;
    }
  }

  return {shop, photoCard};
}

function createSortOption(sort) {
  switch (sort) {
    case 'price-asc':
      return [{price: 'asc'}];
    case 'price-desc':
      return [{price: 'desc'}];
    case 'oldest':
      return [{createdAt: 'asc'}];
    case 'latest':
    default:
      return [{createdAt: 'desc'}];
  }
}

// 카드 타입 판별 함수
function getCardType(status, remainingQuantity, listingType) {
  if (status === 'SOLD') return 'soldout';
  if (listingType === 'FOR_SALE' && remainingQuantity > 0) return 'for_sale';
  if (listingType === 'FOR_SALE_AND_TRADE' && remainingQuantity > 0)
    return 'exchange';
  if (status === 'IDLE') return 'my_card';
  return null;
}

// 마켓플레이스에 등록된 포토카드 조회
export async function findAllCards({
  filterType,
  filterValue,
  keyword,
  sort,
  page = 1,
  take = 10,
}) {
  const skip = (Number(page) - 1) * Number(take);
  const orderBy = createSortOption(sort);
  const {shop, photoCard} = createFilterOption({
    filterType,
    filterValue,
    keyword,
  });

  const [totalCount, shops] = await Promise.all([
    prisma.shop.count({
      where: {
        ...shop,
        photoCard: {is: photoCard},
      },
    }),
    prisma.shop.findMany({
      where: {
        ...shop,
        photoCard: {is: photoCard},
      },
      orderBy,
      skip,
      take: Number(take),
      include: {
        photoCard: true,
        seller: true,
      },
    }),
  ]);

  const result = shops.map(shop => ({
    shopId: shop.id,
    cardId: shop.photoCard.id,
    imageUrl: shop.photoCard.imageUrl,
    price: shop.price,
    title: shop.photoCard.name,
    description: shop.photoCard.description ?? '',
    cardGenre: shop.photoCard.genre,
    cardGrade: shop.photoCard.grade,
    nickname: shop.seller?.nickname ?? null,
    quantityLeft: shop.remainingQuantity,
    quantityTotal: shop.initialQuantity,
    type: 'market',
    saleStatus: shop.remainingQuantity === 0 ? 'soldout' : 'sale',
    createdAt: shop.createdAt,
    updatedAt: shop.updatedAt,
  }));

  return {
    totalCount,
    currentPage: Number(page),
    totalPages: Math.ceil(totalCount / Number(take)),
    result,
  };
}

// 포토카드 상세 조회
// - 내가 올린 카드일 경우 교환 제안 목록도 포함됨
export async function findCardById(userCardId, currentUserId) {
  const userCard = await prisma.userCard.findUnique({
    where: {id: userCardId},
    include: {
      photoCard: true,
      shopListing: true,
      user: true,
    },
  });

  if (!userCard) throw new Error('카드 정보를 찾을 수 없습니다.');

  const {photoCard, shopListing, user} = userCard;
  const isSeller = userCard.userId === currentUserId;

  const baseData = {
    cardId: photoCard.id,
    userCardId: userCard.id,
    imageUrl: photoCard.imageUrl,
    title: photoCard.name,
    description: photoCard.description,
    cardGenre: photoCard.genre,
    cardGrade: photoCard.grade,
    price: shopListing?.price,
    nickname: user.nickname,
    quantityLeft: shopListing?.remainingQuantity,
    quantityTotal: shopListing?.initialQuantity,
    saleStatus: userCard.status,
    type: getCardType(
      userCard.status,
      shopListing?.remainingQuantity,
      shopListing?.listingType,
    ),
    isSeller,
    createdAt: userCard.createdAt,
    updatedAt: userCard.updatedAt,
  };

  // 내가 올린 카드일 경우 교환 제안 리스트 포함
  if (isSeller) {
    const exchanges = await prisma.exchange.findMany({
      where: {targetCardId: userCard.id},
      include: {
        requestCard: {
          include: {
            user: true,
            photoCard: true,
          },
        },
      },
    });

    baseData.exchangeProposals = exchanges.map(ex => ({
      exchangeId: ex.id,
      requesterNickname: ex.requestCard.user.nickname,
      offeredCardId: ex.requestCard.id,
      offeredCardName: ex.requestCard.photoCard.name,
      offeredCardGrade: ex.requestCard.photoCard.grade,
      offeredCardGenre: ex.requestCard.photoCard.genre,
    }));
    // 구매자일 경우 교환 정보 표시
  } else if (shopListing) {
    baseData.exchangeInfo = {
      genre: shopListing.exchangeGenre,
      grade: shopListing.exchangeGrade,
      description: shopListing.exchangeDescription,
    };
  }

  return baseData;
}

// 마이 갤러리 전체 조회
// - 내가 만든 카드, 구매한 카드 중 판매 안 된 상태(IDLE)만 조회
// - 상점에 등록된 카드는 제외됨
// - 같은 카드는 하나로 묶어서 수량 포함
export async function findMyIDLECards({
  userId,
  filterType,
  filterValue,
  keyword,
  page = 1,
  take = 10,
}) {
  const skip = (Number(page) - 1) * Number(take);

  const {shop: shopWhere, photoCard: photoCardWhere} = createFilterOption({
    filterType,
    filterValue,
    keyword,
  });

  const where = {
    userId,
    status: 'IDLE',
    photoCard: {
      is: photoCardWhere,
    },
    ...shopWhere,
  };

  // 유저 닉네임 조회
  const user = await prisma.user.findUnique({
    where: {id: userId},
    select: {nickname: true},
  });

  // 전체 조회 후 그룹핑 (중복 제거 및 수량 계산용)
  const allUserCards = await prisma.userCard.findMany({
    where,
    include: {
      photoCard: true,
      user: {
        select: {nickname: true},
      },
    },
    orderBy: [{createdAt: 'desc'}],
  });

  // 동일 카드 기준으로 그룹핑
  const grouped = _.groupBy(allUserCards, card =>
    JSON.stringify({
      nickname: card.user.nickname,
      price: card.photoCard.price,
      imageUrl: card.photoCard.imageUrl,
      title: card.photoCard.name,
      description: card.photoCard.description,
      cardGenre: card.photoCard.genre,
      cardGrade: card.photoCard.grade,
      status: card.status,
    }),
  );

  // 그룹별 대표 카드 + 수량 추출
  const groupedList = Object.values(grouped).map(group => {
    const card = group[0];
    return {
      userCardId: card.id,
      photoCardId: card.photoCardId,
      nickname: card.user.nickname,
      price: card.photoCard.price,
      imageUrl: card.photoCard.imageUrl,
      title: card.photoCard.name,
      description: card.photoCard.description,
      cardGenre: card.photoCard.genre,
      cardGrade: card.photoCard.grade,
      status: card.status,
      saleStatus: card.status,
      type: 'original',
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      quantityLeft: group.length,
    };
  });

  return {
    totalCount: groupedList.length,
    currentPage: Number(page),
    totalPages: Math.ceil(groupedList.length / Number(take)),
    nickname: user.nickname,
    result: groupedList,
  };
}

// 나의 판매 포토카드 전체 조회(상점에 등록된 것만)
// - 동일한 카드라도 상태에 따라 분리되어 렌더링됨
export async function findMySales({
  userId,
  filterType,
  filterValue,
  keyword,
  sort = 'latest',
  page = 1,
  take = 10,
}) {
  const skip = (Number(page) - 1) * Number(take);
  const {shop: shopWhere, photoCard: photoCardWhere} = createFilterOption({
    filterType,
    filterValue,
    keyword,
  });
  const orderBy = createSortOption(sort);

  const user = await prisma.user.findUnique({
    where: {id: userId},
    select: {nickname: true},
  });

  const results = [];

  // 1. 판매 중 카드 (상점에 등록한 카드)
  const shops = await prisma.shop.findMany({
    where: {
      sellerId: userId,
      ...shopWhere,
      photoCard: {
        is: photoCardWhere,
      },
    },
    include: {
      listedItems: true,
      photoCard: true,
    },
    orderBy,
  });

  for (const shop of shops) {
    const isSoldOut = shop.remainingQuantity === 0;

    results.push({
      type: 'my_sale',
      saleStatus: 'sale',
      saleStatus: isSoldOut ? 'soldout' : 'sale',
      photoCardId: shop.photoCardId,
      shopIds: [shop.id],
      imageUrl: shop.photoCard.imageUrl,
      title: shop.photoCard.name,
      description: shop.photoCard.description,
      cardGenre: shop.photoCard.genre,
      cardGrade: shop.photoCard.grade,
      price: shop.price,
      quantityLeft: shop.remainingQuantity,
      quantityTotal: shop.initialQuantity,
      listingType: shop.listingType,
      exchangeInfo: {
        genre: shop.exchangeGenre,
        grade: shop.exchangeGrade,
        description: shop.exchangeDescription,
      },
      nickname: user.nickname,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
    });
  }

  // 2. 교환 제시 중 카드 (내 카드로 교환 요청했으나 상점 등록 X)
  const exchanges = await prisma.exchange.findMany({
    where: {
      status: 'REQUESTED',
      requestCard: {
        is: {
          userId: userId,
          photoCard: {
            is: photoCardWhere,
          },
        },
      },
    },
    include: {
      requestCard: {
        include: {
          photoCard: true,
        },
      },
    },
  });

  for (const ex of exchanges) {
    const card = ex.requestCard;
    results.push({
      type: 'my_sale',
      saleStatus: 'exchange',
      photoCardId: card.photoCardId,
      shopIds: [shop.id],
      imageUrl: card.photoCard.imageUrl,
      title: card.photoCard.name,
      description: card.photoCard.description,
      cardGenre: card.photoCard.genre,
      cardGrade: card.photoCard.grade,
      price: null,
      quantityLeft: 1,
      quantityTotal: 1,
      listingType: null,
      exchangeInfo: null,
      nickname: user.nickname,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    });
  }

  // filterType === method로 다시 필터링 (판매/교환 분류 필터)
  const filtered = results.filter(item => {
    if (filterType === 'method') {
      return item.saleStatus === filterValue;
    }
    return true;
  });

  return {
    totalCount: filtered.length,
    currentPage: Number(page),
    totalPages: Math.ceil(filtered.length / Number(take)),
    nickname: user.nickname,
    result: filtered.slice(skip, skip + take),
  };
}

//구매
export async function purchaseCard({userId, saleId, quantity}) {
  const shop = await prisma.shop.findUnique({
    where: {id: saleId},
    include: {
      userCard: true,
    },
  });

  if (!shop) throw new Error('존재하지 않는 판매 정보입니다.');
  if (shop.remainingQuantity < quantity) throw new Error('재고가 부족합니다.');

  const totalPrice = shop.price * quantity;

  const user = await prisma.user.findUnique({
    where: {id: userId},
    include: {point: true},
  });

  if (!user || !user.point || user.point.balance < totalPrice) {
    const err = new Error('포인트가 부족합니다.');
    err.status = 400;
    throw err;
  }

  const userCardsToCreate = Array.from({length: quantity}).map(() =>
    prisma.userCard.create({
      data: {
        userId,
        photoCardId: shop.userCard.photoCardId,
        status: 'IDLE',
      },
    }),
  );

  const [updatedPoint] = await prisma.$transaction([
    // 포인트 차감
    prisma.point.update({
      where: {userId},
      data: {balance: {decrement: totalPrice}},
    }),

    // 재고 차감
    prisma.shop.update({
      where: {id: saleId},
      data: {remainingQuantity: {decrement: quantity}},
    }),

    // 구매 카드 생성
    ...userCardsToCreate,

    // 포인트 사용 기록
    prisma.pointHistory.create({
      data: {
        userId,
        points: -totalPrice,
        pointType: 'PURCHASE',
      },
    }),
  ]);

  return {
    message: '구매가 완료되었습니다.',
    remainingPoints: updatedPoint.balance,
  };
}

// 포토카드 생성
export async function createMyCard(userId, data) {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const MAX_MONTHLY_CARDS = 3;

  // 이번 달 생성한 포토카드 수 조회 (userCard + photoCard 생성일 기준)
  const createdThisMonth = await prisma.userCard.findMany({
    where: {
      userId,
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
      photoCard: {
        creatorId: userId,
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    },
    select: {
      photoCardId: true,
    },
  });

  const createdCardCount = new Set(createdThisMonth.map(c => c.photoCardId))
    .size;

  if (createdCardCount >= MAX_MONTHLY_CARDS) {
    throw new Error('이번 달에는 포토카드를 최대 3개까지 생성할 수 있습니다.');
  }

  // 포토카드 생성
  const photoCard = await prisma.photoCard.create({
    data: {
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl,
      grade: data.grade,
      genre: data.genre,
      price: data.price,
      initialQuantity: data.initialQuantity,
      creatorId: userId,
    },
  });

  // 발행량만큼 userCard 생성
  const userCards = await prisma.$transaction(
    Array.from({length: data.initialQuantity}).map((_, i) =>
      prisma.userCard.create({
        data: {
          userId,
          photoCardId: photoCard.id,
        },
      }),
    ),
  );

  const [firstUserCard] = await prisma.userCard.findMany({
    where: {
      userId,
      photoCardId: photoCard.id,
    },
    include: {
      photoCard: true,
    },
    take: 1,
  });

  return {
    userCardId: firstUserCard.id,
    imageUrl: firstUserCard.photoCard.imageUrl,
    title: firstUserCard.photoCard.name,
    description: firstUserCard.photoCard.description,
    cardGenre: firstUserCard.photoCard.genre,
    cardGrade: firstUserCard.photoCard.grade,
    quantityTotal: photoCard.initialQuantity,
    status: firstUserCard.status,
    saleStatus: firstUserCard.status,
    type: 'original',
    createdAt: firstUserCard.createdAt,
    updatedAt: firstUserCard.updatedAt,
  };
}

// 포토카드 생성 제한
export async function getCardCreationQuota(userId) {
  const MAX_MONTHLY_CARDS = 3;
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  // 해당 유저가 이번 달에 생성한 포토카드 개수
  const createdThisMonth = await prisma.photoCard.findMany({
    where: {
      creatorId: userId,
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    select: {
      id: true,
    },
  });

  return {
    remainingQuota: Math.max(0, MAX_MONTHLY_CARDS - createdThisMonth.length),
  };
}

export default {
  findAllCards,
  findCardById,
  findMyIDLECards,
  findMySales,
  purchaseCard,
  createMyCard,
  getCardCreationQuota,
};
