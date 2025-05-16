import prisma from "../prisma/client.js";

// 필터 조건 생성 함수
function createFilterOption({ filterType, filterValue, keyword }) {
  const where = {};

  // 키워드 검색 (카드 이름 기준)
  if (keyword) {
    where.userCard = {
      photoCard: {
        name: { contains: keyword },
      },
    };
  }

  // 필터 타입에 따른 필터링(한 번에 하나의 필터만 선택 가능)
  if (filterType && filterValue) {
    const values = filterValue.split(",");

    switch (filterType) {
      case "grade": // 등급
        where.userCard ??= {};
        where.userCard.photoCard ??= {};
        where.userCard.photoCard.grade = { in: values };
        break;
      case "genre": // 장르
        where.userCard ??= {};
        where.userCard.photoCard ??= {};
        where.userCard.photoCard.genre = { in: values };
        break;
      case "soldOut": // 매진 여부
        where.remainingQuantity = values.includes("true") ? 0 : { gt: 0 };
        break;
      case "method": // 판매 방법
        where.userCard ??= {};
        where.userCard.status = { in: values };
        break;
    }
  }

  return where;
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

// 카드 타입 판별
function getCardType(status, remainingQuantity) {
  if (status === "FOR_SALE" && remainingQuantity === 0) return "soldout"; // 매진
  if (status === "FOR_SALE") return "for_sale"; // 판매 중
  if (status === "FOR_TRADE") return "exchange"; // 교환 제시 대기 중
  if (status === "IDLE") return "my_card";
  return null;
}

// 전체 포토카드 목록 조회 (필터, 정렬, 페이지네이션 포함)
export async function findAllCards({
  filterType,
  filterValue,
  keyword,
  sort,
  page = 1,
  take = 10,
}) {
  const skip = (Number(page) - 1) * Number(take); // 페이지네이션 offset
  const orderBy = createSortOption(sort); // 정렬 조건
  const where = createFilterOption({ filterType, filterValue, keyword }); // 필터 조건

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

// 카드 상세 조회
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
  const isSeller = userCard.userId === currentUserId; // 판매자 or 구매자 판별

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

  // TODO: 추후 api 연동 후 수정 예정
  // 판매자일 경우: 교환 제안 목록 조회
  if (isSeller) {
    const exchanges = await prisma.exchange.findMany({
      where: { targetCardId: userCard.id },
      include: {
        requester: { select: { nickname: true } },
        offeredCard: {
          include: {
            photoCard: true,
          },
        },
      },
    });

    baseData.exchangeProposals = exchanges.map((ex) => ({
      exchangeId: ex.id,
      requesterNickname: ex.requester.nickname,
      offeredCardId: ex.offeredCard.id,
      offeredCardName: ex.offeredCard.photoCard.name,
      offeredCardGrade: ex.offeredCard.photoCard.grade,
      offeredCardGenre: ex.offeredCard.photoCard.genre,
    }));
  }

  // 구매자일 경우: 교환 정보 제공
  if (!isSeller && shop) {
    baseData.exchangeInfo = {
      genre: shop.exchangeGenre,
      grade: shop.exchangeGrade,
      description: shop.exchangeDescription,
    };
  }

  return baseData;
}

// 내가 가진 카드 조회 (페이지네이션 포함)
export async function findMyCards({
  userId,
  filterType,
  filterValue,
  keyword,
  page = 1,
  take = 10,
}) {
  const skip = (Number(page) - 1) * Number(take);
  const extraWhere = createFilterOption({ filterType, filterValue, keyword });

  const where = {
    userId,
    NOT: { status: "SOLD" },
    ...extraWhere?.userCard,
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

// 내가 등록한 판매 카드 조회 (페이지네이션 포함)
export async function findMySales({
  userId,
  filterType,
  filterValue,
  keyword,
  page = 1,
  take = 10,
}) {
  const skip = (Number(page) - 1) * Number(take);
  const extraWhere = createFilterOption({ filterType, filterValue, keyword });

  const where = {
    sellerId: userId,
    remainingQuantity: { gte: 0 }, // 판매 등록된 카드
    ...extraWhere,
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
    saleStatus: shop.userCard.status, // 같은 포토카드여도 상태가 다르면 나눠서 렌더링
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

export default {
  findAllCards,
  findCardById,
  findMyCards,
  findMySales,
};
