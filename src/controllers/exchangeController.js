import {
  proposeExchange,
  acceptExchange as acceptService,
  rejectExchange as rejectService,
  getExchangeProposals as getProposalsService,
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
