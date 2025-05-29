import {
  proposeExchange,
  acceptExchange as acceptService,
  rejectExchange as rejectService,
  getExchangeProposals as getProposalsService,
} from '../services/exchangeService.js';

// 교환 제안 생성
export async function postExchangeProposal(req, res, next) {
  try {
    const userId = req.user.id;
    const {targetCardId, requestCardId, description} = req.body;

    console.log('🧾 [Controller] 요청 데이터:', {
      userId,
      targetCardId,
      requestCardId,
      description,
    });

    const exchange = await proposeExchange(
      userId,
      targetCardId,
      requestCardId,
      description,
    );

    console.log('✅ [Controller] 생성된 교환 객체:', exchange);

    res.status(201).json({success: true, data: exchange});
  } catch (error) {
    console.error('❌ 교환 제안 오류:', error);
    next(error);
  }
}

// 교환 제안 수락
export async function acceptExchange(req, res, next) {
  try {
    const userId = req.user.id;
    const exchangeId = Number(req.params.id);

    const exchange = await acceptService(userId, exchangeId);
    res.json({success: true, data: exchange});
  } catch (error) {
    console.error('❌ 교환 수락 오류:', error);
    next(error);
  }
}

// 교환 제안 거절
export async function rejectExchange(req, res, next) {
  try {
    const userId = req.user.id;
    const exchangeId = Number(req.params.id);

    const exchange = await rejectService(userId, exchangeId);
    res.json({success: true, data: exchange});
  } catch (error) {
    console.error('❌ 교환 거절 오류:', error);
    next(error);
  }
}

// 특정 카드에 대한 교환 제안 목록 조회
export async function getExchangeProposals(req, res, next) {
  try {
    const userId = req.user.id;
    const cardId = Number(req.params.cardId);

    const proposals = await getProposalsService(userId, cardId);
    res.json({success: true, data: proposals});
  } catch (error) {
    console.error('❌ 교환 제안 목록 조회 오류:', error);
    next(error);
  }
}
