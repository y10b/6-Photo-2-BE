import * as exchangeService from '../services/exchangeService.js';

export async function proposeExchange(req, res, next) {
  try {
    const {targetCardId, requestCardId} = req.body;
    const userId = req.user.id;
    const result = await exchangeService.proposeExchange(
      userId,
      targetCardId,
      requestCardId,
    );
    res.status(201).json({success: true, data: result});
  } catch (err) {
    next(err);
  }
}

export async function acceptExchange(req, res, next) {
  try {
    const exchangeId = Number(req.params.id);
    const result = await exchangeService.acceptExchange(exchangeId);
    res.status(200).json({success: true, data: result});
  } catch (err) {
    next(err);
  }
}

export async function rejectExchange(req, res, next) {
  try {
    const exchangeId = Number(req.params.id);
    const result = await exchangeService.rejectExchange(exchangeId);
    res.status(200).json({success: true, data: result});
  } catch (err) {
    next(err);
  }
}

// ✅ 수정된 부분: userId 전달
export async function getExchangeProposals(req, res, next) {
  try {
    const cardId = Number(req.params.cardId);
    const userId = req.user.id;
    const result = await exchangeService.getProposalsByTargetCardId(
      cardId,
      userId,
    );
    res.status(200).json({success: true, data: result});
  } catch (err) {
    next(err);
  }
}
