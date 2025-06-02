import * as purchaseService from '../services/purchaseService.js';

export const getShopDetail = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const shopId = Number(req.params.shopId);

    if (!userId || isNaN(shopId)) {
      return res
        .status(400)
        .json({ message: '잘못된 요청입니다.' });
    }

    const result = await purchaseService.getShopDetailService(shopId, userId);

    if (!result.shop) {
      return res.status(404).json({
        message: '해당 판매 게시글이 존재하지 않습니다.'
      });
    }

    if (result.shop.remainingQuantity <= 0) {
      return res.status(410).json({
        message: '이미 판매 완료된 상품입니다.',
        data: result.data
      });
    }

    // 판매자인 경우 추가 메시지 포함
    if (result.data.isSeller) {
      return res.status(200).json({
        message: '본인이 등록한 판매 게시글입니다.',
        data: result.data
      });
    }

    // 구매자인 경우 (isSeller가 false)
    res.status(200).json({
      message: '판매 게시글 조회 성공',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

export const purchaseCardController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const shopId = Number(req.params.shopId);
    const { quantity } = req.body;

    if (!userId || isNaN(shopId) || typeof quantity !== 'number') {
      return res.status(400).json({ message: '잘못된 요청입니다.' });
    }

    // 판매자와 구매자가 동일한지 확인하는 로직은 서비스 레이어로 이동
    const result = await purchaseService.purchaseCardService(
      userId,
      shopId,
      quantity,
    );

    res.status(200).json({
      message: '카드 구매 성공',
      data: result.data,
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      message: error.message || '카드 구매 중 오류가 발생했습니다.',
      data: error.extraInfo,
    });
  }
};
