import {
  proposeExchange,
  acceptExchange as acceptService,
  rejectExchange as rejectService,
  getExchangeProposals as getProposalsService,
  cancelExchange as cancelService,
  getShopExchangeProposals as getShopProposalsService, // 새로 추가
} from '../services/exchangeService.js';

export async function postExchangeProposal(req, res, next) {
  try {
    const userId = req.user.id;
    const { targetCardId, requestCardId, description } = req.body;

    console.log('[Controller] 교환 제안 요청:', { userId, targetCardId, requestCardId, description });

    const exchange = await proposeExchange(userId, targetCardId, requestCardId, description);
    const exchangeWithType = {
      ...exchange,
      type: "original"  // 필요한 타입으로 설정
    };

    console.log('[Controller] 생성된 교환:', exchange);

    res.status(201).json({ success: true, data: exchangeWithType });
  } catch (error) {
    console.error('[Controller] 교환 제안 오류:', error);
    next(error);
  }
}

export async function acceptExchange(req, res, next) {
  try {
    const userId = req.user.id;
    const exchangeId = Number(req.params.id);

    const exchange = await acceptService(userId, exchangeId);
    res.json({ success: true, data: exchange });
  } catch (error) {
    console.error('[Controller] 교환 수락 오류:', error);
    next(error);
  }
}

export async function rejectExchange(req, res, next) {
  try {
    const userId = req.user.id;
    const exchangeId = Number(req.params.id);

    const exchange = await rejectService(userId, exchangeId);
    res.json({ success: true, data: exchange });
  } catch (error) {
    console.error('[Controller] 교환 거절 오류:', error);
    next(error);
  }
}

export async function getExchangeProposals(req, res, next) {
  try {
    const userId = req.user.id;
    const cardId = Number(req.params.cardId);

    const proposals = await getProposalsService(userId, cardId);
    res.json({ success: true, data: proposals });
  } catch (error) {
    console.error('[Controller] 교환 제안 목록 조회 오류:', error);
    next(error);
  }
}

export async function cancelExchange(req, res, next) {
  try {
    const userId = req.user.id;
    const exchangeId = Number(req.params.id);

    console.log('[Controller] 교환 취소 요청:', { userId, exchangeId });

    const exchange = await cancelService(userId, exchangeId);
    res.json({ success: true, data: exchange });
  } catch (error) {
    console.error('[Controller] 교환 취소 오류:', error);
    next(error);
  }
}

// 새로 추가: 판매 게시글에 대한 교환 제안 목록 조회
export async function getShopExchangeProposals(req, res, next) {
  try {
    const userId = req.user.id;
    const shopId = Number(req.params.shopId);

    console.log('[Controller] 판매 게시글 교환 제안 목록 조회 요청:', { userId, shopId });

    const proposals = await getShopProposalsService(userId, shopId);
    res.json({ success: true, data: proposals });
  } catch (error) {
    console.error('[Controller] 판매 게시글 교환 제안 목록 조회 오류:', error);
    next(error);
  }
}
