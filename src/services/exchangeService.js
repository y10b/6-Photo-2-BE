import prisma from "../prisma/client.js";
import { BadRequestError, NotFoundError } from "../utils/customError.js";

export async function proposeExchange(userId, targetCardId, requestCardId) {
  const [targetCard, requestCard] = await Promise.all([
    prisma.userCard.findUnique({
      where: { id: targetCardId },
      include: { user: true },
    }),
    prisma.userCard.findUnique({
      where: { id: requestCardId },
      include: { user: true },
    }),
  ]);

  if (!targetCard || !requestCard) {
    throw new NotFoundError("존재하지 않는 카드입니다.");
  }

  if (requestCard.userId !== userId) {
    throw new BadRequestError("본인의 카드만 교환 제안할 수 있습니다.");
  }

  if (targetCard.status !== "LISTED") {
    throw new BadRequestError("해당 카드는 교환 가능한 상태가 아닙니다.");
  }

  return await prisma.exchange.create({
    data: {
      requestCardId,
      targetCardId,
      status: "REQUESTED",
    },
  });
}

export async function acceptExchange(exchangeId) {
  return await prisma.$transaction(async (tx) => {
    const exchange = await tx.exchange.findUnique({
      where: { id: exchangeId },
      include: {
        requestCard: true,
        targetCard: true,
      },
    });

    if (!exchange)
      throw new NotFoundError("해당 교환 요청을 찾을 수 없습니다.");

    const requestCard = exchange.requestCard;
    const targetCard = exchange.targetCard;

    // 소유권 교환
    await tx.userCard.update({
      where: { id: requestCard.id },
      data: { userId: targetCard.userId, status: "IDLE" },
    });

    await tx.userCard.update({
      where: { id: targetCard.id },
      data: { userId: requestCard.userId, status: "IDLE" },
    });

    // 상태 변경
    await tx.exchange.update({
      where: { id: exchangeId },
      data: { status: "ACCEPTED" },
    });

    return { message: "교환이 완료되었습니다." };
  });
}

export async function rejectExchange(exchangeId) {
  return await prisma.exchange.update({
    where: { id: exchangeId },
    data: { status: "REJECTED" },
  });
}

export async function getProposalsByTargetCardId(cardId) {
  const exchanges = await prisma.exchange.findMany({
    where: {
      targetCardId: cardId,
      status: "REQUESTED",
    },
    include: {
      requestCard: {
        include: {
          photoCard: true,
          user: true,
        },
      },
    },
  });

  return exchanges.map((exchange) => {
    const card = exchange.requestCard;
    const photoCard = card.photoCard;
    const user = card.user;

    return {
      id: exchange.id,
      title: photoCard.name,
      imageUrl: photoCard.imageUrl,
      price: 0,
      cardGrade: photoCard.grade,
      CardGenre: photoCard.genre,
      nickname: user.nickname,
      quantityLeft: 1,
      quantityTotal: 1,
      description: photoCard.description,
      saleStatus: "교환 제시 대기 중",
    };
  });
}
