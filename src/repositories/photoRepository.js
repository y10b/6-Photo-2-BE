import prisma from "../prisma/client.js";

// 필터 조건 생성 함수
function createFilterOption({ filterType, filterValue, keyword }) {
  const shop = {};
  const userCard = {};

  // 키워드(카드 이름) 검색
  if (keyword) {
    userCard.photoCard = {
      name: {
        contains: keyword,
      },
    };
  }

  // 필터링 분기(한 번에 하나의 필터타입만 선택 가능)
  if (filterType && filterValue) {
    const values = filterValue.split(",");

    switch (filterType) {
      case "grade":
        userCard.photoCard ??= {};
        userCard.photoCard.grade = { in: values };
        break;
      case "genre":
        userCard.photoCard ??= {};
        userCard.photoCard.genre = { in: values };
        break;
      case "soldOut":
        shop.remainingQuantity =
          values.includes("true") && !values.includes("false")
            ? 0
            : values.includes("false") && !values.includes("true")
              ? { gt: 0 }
              : undefined;
        break;
      case "method":
        userCard.status = { in: values }; // ['FOR_SALE'], ['FOR_SALE_AND_TRADE']
        break;
    }
  }

  return { shop, userCard };
}

// 정렬 조건 생성 함수
function createSortOption(sort) {
  switch (sort) {
    case "price-asc":
      return [{ price: "asc" }];
    case "price-desc":
      return [{ price: "desc" }];
    case "oldest":
      return [{ createdAt: "asc" }];
    case "latest":
    default:
      return [{ createdAt: "desc" }];
  }
}

// 카드 타입 판별 함수
function getCardType(status, remainingQuantity) {
  if (status === "FOR_SALE" && remainingQuantity === 0) return "soldout";
  if (status === "FOR_SALE") return "for_sale";
  if (status === "FOR_SALE_AND_TRADE") return "exchange";
  if (status === "IDLE") return "my_card";
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
  const { shop, userCard } = createFilterOption({
    filterType,
    filterValue,
    keyword,
  });

  const where = {
    ...shop,
    userCard: {
      ...userCard,
    },
  };

  const [totalCount, shops] = await Promise.all([
    prisma.shop.count({ where }),
    prisma.shop.findMany({
      where,
      orderBy,
      skip,
      take: Number(take),
      include: {
        userCard: {
          include: {
            photoCard: true,
            user: true,
          },
        },
      },
    }),
  ]);

  const result = shops.map((shop) => {
    const { userCard } = shop;
    const { photoCard, user } = userCard;

    return {
      cardId: photoCard.id,
      userCardId: userCard.id,
      imageUrl: photoCard.imageUrl,
      price: shop.price,
      title: photoCard.name,
      description: photoCard.description ?? "",
      cardGenre: photoCard.genre,
      cardGrade: photoCard.grade,
      nickname: user?.nickname ?? null,
      quantityLeft: shop.remainingQuantity,
      quantityTotal: shop.initialQuantity,
      saleStatus: userCard.status,
      type: getCardType(userCard.status, shop.remainingQuantity),
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
    };
  });

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
    where: { id: userCardId },
    include: {
      photoCard: true,
      shop: true,
      user: true,
    },
  });

  if (!userCard) throw new Error("카드 정보를 찾을 수 없습니다.");

  const { photoCard, shop, user } = userCard;
  const isSeller = userCard.userId === currentUserId;

  const baseData = {
    cardId: photoCard.id,
    userCardId: userCard.id,
    imageUrl: photoCard.imageUrl,
    title: photoCard.name,
    description: photoCard.description,
    cardGenre: photoCard.genre,
    cardGrade: photoCard.grade,
    price: shop?.price,
    nickname: user.nickname,
    quantityLeft: shop?.remainingQuantity,
    quantityTotal: shop?.initialQuantity,
    saleStatus: userCard.status,
    type: getCardType(userCard.status, shop?.remainingQuantity),
    isSeller,
    createdAt: userCard.createdAt,
    updatedAt: userCard.updatedAt,
  };

  // 내가 올린 카드일 경우 교환 제안 리스트 포함
  if (isSeller) {
    const exchanges = await prisma.exchange.findMany({
      where: { targetCardId: userCard.id },
      include: {
        requestCard: {
          include: {
            user: true,
            photoCard: true,
          },
        },
      },
    });

    baseData.exchangeProposals = exchanges.map((ex) => ({
      exchangeId: ex.id,
      requesterNickname: ex.requestCard.user.nickname,
      offeredCardId: ex.requestCard.id,
      offeredCardName: ex.requestCard.photoCard.name,
      offeredCardGrade: ex.requestCard.photoCard.grade,
      offeredCardGenre: ex.requestCard.photoCard.genre,
    }));
  } else if (shop) {
    // 구매자일 경우 교환 정보 표시
    baseData.exchangeInfo = {
      genre: shop.exchangeGenre,
      grade: shop.exchangeGrade,
      description: shop.exchangeDescription,
    };
  }

  return baseData;
}

// 마이 갤러리 전체 조회
// - 내가 만든 카드, 구매한 카드 중 판매 안 된 상태(IDLE)만 조회
// - 상점에 등록된 카드는 제외됨
export async function findMyCards({
  userId,
  filterType,
  filterValue,
  keyword,
  page = 1,
  take = 10,
}) {
  const skip = (Number(page) - 1) * Number(take);
  const { userCard: extraWhere } = createFilterOption({
    filterType,
    filterValue,
    keyword,
  });

  const where = {
    userId,
    status: "IDLE", // 소장 상태만 (판매 미등록)
    ...extraWhere,
  };

  const [totalCount, userCards] = await Promise.all([
    prisma.userCard.count({ where }),
    prisma.userCard.findMany({
      where,
      include: {
        photoCard: true,
        shop: true,
      },
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: Number(take),
    }),
  ]);

  const list = userCards.map((card) => ({
    userCardId: card.id,
    imageUrl: card.photoCard.imageUrl,
    title: card.photoCard.name,
    description: card.photoCard.description,
    cardGenre: card.photoCard.genre,
    cardGrade: card.photoCard.grade,
    status: card.status,
    saleStatus: card.status,
    type: getCardType(card.status, card.shop?.remainingQuantity),
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  }));

  return {
    totalCount,
    currentPage: Number(page),
    totalPages: Math.ceil(totalCount / Number(take)),
    list,
  };
}

// 나의 판매 포토카드 전체 조회(상점에 등록된 것만)
// - 동일한 카드라도 상태에 따라 분리되어 렌더링됨
export async function findMySales({
  userId,
  filterType,
  filterValue,
  keyword,
  page = 1,
  take = 10,
}) {
  const skip = (Number(page) - 1) * Number(take);
  const { shop: shopFilter, userCard: userCardFilter } = createFilterOption({
    filterType,
    filterValue,
    keyword,
  });

  const where = {
    userCard: {
      userId,
      status: { not: "IDLE" }, // FOR_SALE, FOR_SALE_AND_TRADE, SOLD
      ...userCardFilter,
    },
    ...shopFilter,
  };

  const [totalCount, shops] = await Promise.all([
    prisma.shop.count({ where }),
    prisma.shop.findMany({
      where,
      include: {
        userCard: {
          include: {
            photoCard: true,
            user: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: Number(take),
    }),
  ]);

  const list = shops.map((shop) => ({
    shopId: shop.id,
    userCardId: shop.userCard.id,
    imageUrl: shop.userCard.photoCard.imageUrl,
    title: shop.userCard.photoCard.name,
    description: shop.userCard.photoCard.description,
    cardGenre: shop.userCard.photoCard.genre,
    cardGrade: shop.userCard.photoCard.grade,
    price: shop.price,
    quantityLeft: shop.remainingQuantity,
    quantityTotal: shop.initialQuantity,
    saleStatus: shop.userCard.status,
    type: getCardType(shop.userCard.status, shop.remainingQuantity),
    exchangeInfo: {
      genre: shop.exchangeGenre,
      grade: shop.exchangeGrade,
      description: shop.exchangeDescription,
    },
    nickname: shop.userCard.user?.nickname ?? null,
    createdAt: shop.createdAt,
    updatedAt: shop.updatedAt,
  }));

  return {
    totalCount,
    currentPage: Number(page),
    totalPages: Math.ceil(totalCount / Number(take)),
    list,
  };
}

//구매
export async function purchaseCard({ userId, saleId, quantity }) {
  const shop = await prisma.shop.findUnique({
    where: { id: saleId },
    include: {
      userCard: true,
    },
  });

  if (!shop) throw new Error("존재하지 않는 판매 정보입니다.");
  if (shop.remainingQuantity < quantity) throw new Error("재고가 부족합니다.");

  const totalPrice = shop.price * quantity;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { point: true },
  });

  if (!user || !user.point || user.point.balance < totalPrice) {
    const err = new Error("포인트가 부족합니다.");
    err.status = 400;
    throw err;
  }

  const userCardsToCreate = Array.from({ length: quantity }).map(() =>
    prisma.userCard.create({
      data: {
        userId,
        photoCardId: shop.userCard.photoCardId,
        status: "IDLE",
      },
    })
  );

  const [updatedPoint] = await prisma.$transaction([
    // 포인트 차감
    prisma.point.update({
      where: { userId },
      data: { balance: { decrement: totalPrice } },
    }),

    // 재고 차감
    prisma.shop.update({
      where: { id: saleId },
      data: { remainingQuantity: { decrement: quantity } },
    }),

    // 구매 카드 생성
    ...userCardsToCreate,

    // 포인트 사용 기록
    prisma.pointHistory.create({
      data: {
        userId,
        points: -totalPrice,
        pointType: "PURCHASE",
      },
    }),
  ]);

  return {
    message: "구매가 완료되었습니다.",
    remainingPoints: updatedPoint.balance,
  };
}

export default {
  findAllCards,
  findCardById,
  findMyCards,
  findMySales,
  purchaseCard,
};
