import {
  getExchangeProposals as getProposalsService,
  createExchangeRequest as createExchangeRequestService,
  updateExchangeStatus as updateExchangeStatusService,
  cancelExchangeRequest as cancelExchangeRequestService,
  getMyExchangeRequests as getMyExchangeRequestsService,
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

export async function createExchangeRequest(req, res, next) {
  try {
    const userId = req.user.id;
    const shopId = Number(req.params.shopId);
    const { requestCardId, description } = req.body;

    console.log(`[Controller] 교환 요청 생성: userId=${userId}, shopId=${shopId}, requestCardId=${requestCardId}`);

    const result = await createExchangeRequestService(userId, shopId, requestCardId, description);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Controller] 교환 요청 생성 오류:', error);
    return next(error);
  }
}

export async function updateExchangeStatus(req, res, next) {
  try {
    const userId = req.user.id;
    const exchangeId = Number(req.params.exchangeId);
    const { status } = req.body;

    console.log(`[Controller] 교환 요청 상태 업데이트: userId=${userId}, exchangeId=${exchangeId}, status=${status}`);

    const result = await updateExchangeStatusService(userId, exchangeId, status);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Controller] 교환 요청 상태 업데이트 오류:', error);
    return next(error);
  }
}

export async function cancelExchangeRequest(req, res, next) {
  try {
    const userId = req.user.id;
    const exchangeId = Number(req.params.exchangeId);

    console.log(`[Controller] 교환 요청 취소: userId=${userId}, exchangeId=${exchangeId}`);

    const result = await cancelExchangeRequestService(userId, exchangeId);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Controller] 교환 요청 취소 오류:', error);
    return next(error);
  }
}

export const getMyExchangeRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, shopListingId } = req.query;
    const userId = req.user.id;

    console.log('getMyExchangeRequests called with:', { userId, status, page, limit, shopListingId });

    const result = await getMyExchangeRequestsService(
      userId,
      status,
      parseInt(page),
      parseInt(limit),
      shopListingId
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in getMyExchangeRequests:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};
