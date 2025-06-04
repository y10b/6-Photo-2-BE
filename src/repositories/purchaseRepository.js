import prisma from '../prisma/client.js';

export async function findShopById(shopId) {
  return await prisma.shop.findUnique({
    where: { id: Number(shopId) },
    include: {
      seller: { select: { id: true, nickname: true } },
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
  });
}

export async function findShopWithPhotoCard(shopId) {
  return await prisma.shop.findUnique({
    where: { id: shopId },
    include: { photoCard: true, seller: true },
  });
}

export async function purchaseCard(userId, shopId, quantity) {
  return await prisma.$transaction(async tx => {
    // 1. Shop 정보 조회 (listed 상태인 카드 포함)
    const shop = await tx.shop.findUnique({
      where: { id: shopId },
      include: {
        photoCard: true,
        seller: true,
        listedItems: {
          where: {
            status: 'LISTED'
          }
        }
      }
    });

    if (!shop) throw new Error('판매 게시글을 찾을 수 없습니다.');

    // 2. 판매자와 구매자가 동일한 경우 구매 불가
    if (shop.seller.id === userId) {
      throw new Error('본인이 등록한 상품은 구매할 수 없습니다.');
    }

    // 3. 판매 유형 확인
    if (shop.listingType !== 'FOR_SALE' && shop.listingType !== 'FOR_SALE_AND_TRADE') {
      throw new Error('해당 판매 게시글은 구매 가능한 유형이 아닙니다.');
    }

    // 4. 실제 listed 상태인 카드 수와 remainingQuantity 비교
    const listedCount = shop.listedItems.length;
    if (listedCount !== shop.remainingQuantity) {
      // remainingQuantity를 실제 listed 카드 수로 동기화
      await tx.shop.update({
        where: { id: shopId },
        data: { remainingQuantity: listedCount }
      });
      
      if (listedCount < quantity) {
        throw new Error('실제 판매 가능한 카드 수량이 부족합니다.');
      }
    }

    // 5. 구매 수량 확인
    if (listedCount < quantity) {
      throw new Error('재고가 부족하거나 판매 가능한 카드 수량이 부족합니다.');
    }

    const totalPrice = shop.price * quantity;
    const buyer = await tx.user.findUnique({
      where: { id: userId },
      include: { point: true }
    });

    if (!buyer?.point || buyer.point.balance < totalPrice) {
      throw new Error('포인트가 부족합니다.');
    }

    // 6. 구매자 포인트 차감
    await tx.point.update({
      where: { userId },
      data: { balance: { decrement: totalPrice } }
    });

    await tx.pointHistory.create({
      data: {
        userId,
        points: -totalPrice,
        pointType: 'PURCHASE'
      }
    });

    // 7. 판매자 포인트 증가
    await tx.point.update({
      where: { userId: shop.seller.id },
      data: { balance: { increment: totalPrice } }
    });

    await tx.pointHistory.create({
      data: {
        userId: shop.seller.id,
        points: totalPrice,
        pointType: 'SALE'
      }
    });

    // 8. 구매할 카드 선택 (앞에서부터 quantity만큼)
    const cardsToPurchase = shop.listedItems.slice(0, quantity);

    // 9. 카드 소유권 이전 처리
    await Promise.all(
      cardsToPurchase.map(card =>
        tx.userCard.update({
          where: { id: card.id },
          data: {
            userId,
            status: 'IDLE',
            shopListingId: null
          }
        })
      )
    );

    // 10. 남은 listed 카드 수 계산 및 remainingQuantity 업데이트
    const remainingListedCount = listedCount - quantity;
    const updatedShop = await tx.shop.update({
      where: { id: shopId },
      data: { remainingQuantity: remainingListedCount }
    });

    return {
      message: `${quantity}장 구매에 성공했습니다.`,
      data: {
        shopId: shop.id,
        photoCardId: shop.photoCard.id,
        grade: shop.photoCard.grade,
        genre: shop.photoCard.genre,
        userId,
        initialQuantity: shop.initialQuantity,
        purchasedQuantity: quantity,
        remainingQuantity: remainingListedCount
      }
    };
  });
}
