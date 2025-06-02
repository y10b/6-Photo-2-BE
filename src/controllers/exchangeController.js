import {
  proposeExchange,
  proposeExchangeWithShopId,
  acceptExchange as acceptService,
  rejectExchange as rejectService,
  getExchangeProposals as getProposalsService,
  getMyExchangeRequestsForShop,
  getMyExchangeableCards as getMyExchangeableCardsService
} from '../services/exchangeService.js';

export async function postExchangeProposal(req, res, next) {
  try {
    const userId = req.user.id;
    const { targetCardId, requestCardId, description } = req.body;

    console.log('[Controller] 교환 제안 요청:', { userId, targetCardId, requestCardId, description });

    const exchange = await proposeExchange(userId, targetCardId, requestCardId, description);
    const exchangeWithType = {
      ...exchange,
      type: "original"
    };

    return res.status(201).json({ success: true, data: exchangeWithType });
  } catch (error) {
    console.error('[Controller] 교환 제안 오류:', error);
    return next(error);
  }
}

export async function acceptExchange(req, res, next) {
  try {
    const userId = req.user.id;
    const exchangeId = Number(req.params.id);

    const exchange = await acceptService(userId, exchangeId);
    return res.json({ success: true, data: exchange });
  } catch (error) {
    console.error('[Controller] 교환 수락 오류:', error);
    return next(error);
  }
}

export async function rejectExchange(req, res, next) {
  try {
    const userId = req.user.id;
    const exchangeId = Number(req.params.id);

    const exchange = await rejectService(userId, exchangeId);
    return res.json({ success: true, data: exchange });
  } catch (error) {
    console.error('[Controller] 교환 거절 오류:', error);
    return next(error);
  }
}

export async function getExchangeProposals(req, res, next) {
  try {
    const userId = req.user.id;
    const shopId = Number(req.params.shopId);

    console.log(`[Controller] 교환 제안 목록 조회 요청: userId=${userId}, shopId=${shopId}`);

    const result = await getProposalsService(userId, shopId);

    return res.json({
      success: true,
      data: result.proposals,
      isSeller: result.isSeller
    });
  } catch (error) {
    console.error('[Controller] 교환 제안 목록 조회 오류:', error);
    return next(error);
  }
}

// 판매글 ID를 이용한 교환 제안
export async function postExchangeProposalWithShopId(req, res, next) {
  try {
    const userId = req.user.id;
    const shopId = Number(req.params.shopId); // URL 파라미터에서 shopId 가져오기
    const { requestCardId, description } = req.body; // body에서는 requestCardId와 description만 가져옴

    console.log('[Controller] 판매글 ID로 교환 제안 요청:', {
      userId,
      shopId,
      requestCardId,
      description
    });

    // 필수 파라미터 검증
    if (!shopId || !requestCardId) {
      return res.status(400).json({
        success: false,
        message: '필수 정보가 누락되었습니다.'
      });
    }

    const exchange = await proposeExchangeWithShopId(
      userId,
      shopId,
      Number(requestCardId),
      description
    );

    return res.status(201).json({ success: true, data: exchange });
  } catch (error) {
    console.error('[Controller] 교환 제안 오류:', error);
    return next(error);
  }
}

// 특정 판매글에 대한 내 교환 제안 목록 조회
export async function getMyExchangeRequests(req, res, next) {
  try {
    const userId = req.user.id;
    const shopId = Number(req.params.shopId);

    console.log(`[Controller] 내 교환 제안 목록 조회 요청: userId=${userId}, shopId=${shopId}`);

    const myRequests = await getMyExchangeRequestsForShop(userId, shopId);

    // 응답 데이터 가공
    const formattedRequests = myRequests.map(exchange => ({
      id: exchange.id,
      requestCardId: exchange.requestCardId,
      targetCardId: exchange.targetCardId,
      status: exchange.status,
      description: exchange.description,
      createdAt: exchange.createdAt,
      requestCard: {
        id: exchange.requestCard.id,
        photoCard: {
          id: exchange.requestCard.photoCard.id,
          name: exchange.requestCard.photoCard.name,
          grade: exchange.requestCard.photoCard.grade,
          genre: exchange.requestCard.photoCard.genre,
          imageUrl: exchange.requestCard.photoCard.imageUrl,
        },
        user: {
          id: exchange.requestCard.user.id,
          nickname: exchange.requestCard.user.nickname,
        }
      },
      targetCard: {
        id: exchange.targetCard.id,
        photoCard: {
          id: exchange.targetCard.photoCard.id,
          name: exchange.targetCard.photoCard.name,
          grade: exchange.targetCard.photoCard.grade,
          genre: exchange.targetCard.photoCard.genre,
          imageUrl: exchange.targetCard.photoCard.imageUrl,
        }
      },
      shopListingId: shopId
    }));

    return res.json({
      success: true,
      data: formattedRequests
    });
  } catch (error) {
    console.error('[Controller] 내 교환 제안 목록 조회 오류:', error);
    return next(error);
  }
}

// 교환 가능한 내 카드 목록 조회
export async function getMyExchangeableCards(req, res, next) {
  try {
    const userId = req.user.id;

    console.log(`[Controller] 교환 가능한 내 카드 목록 조회 요청: userId=${userId}`);

    const cards = await getMyExchangeableCardsService(userId);

    // 응답 데이터 가공
    const formattedCards = cards.map(card => ({
      id: card.id,
      photoCardId: card.photoCardId,
      status: card.status,
      name: card.photoCard.name,
      grade: card.photoCard.grade,
      genre: card.photoCard.genre,
      imageUrl: card.photoCard.imageUrl,
      description: card.photoCard.description
    }));

    return res.json({
      success: true,
      data: formattedCards
    });
  } catch (error) {
    console.error('[Controller] 교환 가능한 내 카드 목록 조회 오류:', error);
    return next(error);
  }
}
