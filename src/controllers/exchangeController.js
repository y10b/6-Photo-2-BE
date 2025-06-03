import {
  getExchangeProposals as getProposalsService,
} from '../services/exchangeService.js';

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
