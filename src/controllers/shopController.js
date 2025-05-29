import shopService from '../services/shopService.js';

/**
 * 판매 등록
 */
const registerShop = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id)
      return res.status(401).json({message: '인증되지 않은 사용자입니다.'});

    const userId = req.user.id;
    const {
      photoCardId,
      quantity,
      price,
      listingType,
      exchangeGrade,
      exchangeGenre,
      exchangeDescription,
    } = req.body;

    const numPhotoCardId = Number(photoCardId);
    const numQuantity = Number(quantity);
    const numPrice = Number(price);

    if (isNaN(numPhotoCardId) || isNaN(numQuantity) || isNaN(numPrice)) {
      return res.status(400).json({
        message: 'photoCardId, quantity, price는 숫자여야 합니다.',
      });
    }

    const result = await shopService.registerShop({
      userId,
      photoCardId: numPhotoCardId,
      quantity: numQuantity,
      price: numPrice,
      listingType,
      exchangeGrade,
      exchangeGenre,
      exchangeDescription,
    });

    res.status(201).json({message: '판매 등록 성공', shop: result});
  } catch (error) {
    console.error('판매 등록 컨트롤러 에러:', error);
    next(error);
  }
};

/**
 * 판매글 수정
 */
const updateShop = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id)
      return res.status(401).json({message: '인증되지 않은 사용자입니다.'});

    const userId = req.user.id;
    const shopId = Number(req.params.shopId);
    const updateData = {...req.body};

    // 초기 수량이 있으면 남은 수량도 초기화
    if (updateData.initialQuantity !== undefined) {
      updateData.remainingQuantity = updateData.initialQuantity;
    }

    const updatedShop = await shopService.updateShop(
      userId,
      shopId,
      updateData,
    );

    res.status(200).json({message: '판매글 수정 성공', shop: updatedShop});
  } catch (err) {
    console.error(err);
    next(err);
  }
};

/**
 * 판매글 삭제
 */
const deleteShop = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id)
      return res.status(401).json({message: '인증되지 않은 사용자입니다.'});

    const userId = req.user.id;
    const shopId = Number(req.params.shopId);

    await shopService.deleteShop(userId, shopId);
    res.status(200).json({message: '판매글 삭제 성공'});
  } catch (err) {
    console.error(err);
    next(err);
  }
};

/**
 * 판매글 상세 조회
 */
const getShopDetail = async (req, res) => {
  const {shopId} = req.params;
  const userId = req.user.id; 

  try {
    const shop = await shopService.findShopById(shopId);

    if (!shop) {
      return res.status(404).json({message: '판매글을 찾을 수 없습니다.'});
    }

    const isSeller = userId === shop.sellerId;

    res.json({
      shop,
      isSeller,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({message: '서버 오류'});
  }
};

export default {
  registerShop,
  updateShop,
  deleteShop,
  getShopDetail,
};
