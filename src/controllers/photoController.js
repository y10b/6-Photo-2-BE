import photoService from '../services/photoService.js';

// 전체 카드 목록 조회 (필터링, 정렬, 페이지네이션 포함)
export async function getAllCards(req, res, next) {
  try {
    const {
      filterType,
      filterValue,
      keyword,
      sort,
      page = 1,
      take = 10,
    } = req.query;

    const cards = await photoService.getAllCards({
      filterType,
      filterValue,
      keyword,
      sort,
      page,
      take,
    });

    res.json(cards);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      message:
        error.message || '전체 카드 목록을 불러오는 중 오류가 발생했습니다.',
    });
  }
}

// 로그인한 유저의 IDLE 보유 카드 조회 (필터링, 페이지네이션, 갯수 포함, 카드 중복 제거)
export async function getMyIDLECards(req, res, next) {
  try {
    const {filterType, filterValue, keyword, page = 1, take = 10} = req.query;

    const cards = await photoService.getMyIDLECards({
      userId: req.auth.userId,
      page,
      take,
      keyword,
      filterType,
      filterValue,
    });
    res.json(cards);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      message:
        error.message || '마이 갤러리 카드를 불러오는 중 오류가 발생했습니다.',
      data: error.extraInfo,
    });
  }
}

// 로그인한 유저의 판매 중인 카드 목록 조회(for_sale) (필터링, 페이지네이션 포함)
export async function getMySales(req, res, next) {
  try {
    const {filterType, filterValue, keyword, page = 1, take = 10} = req.query;

    const sales = await photoService.getMySales({
      userId: req.auth.userId,
      page,
      take,
      keyword,
      filterType,
      filterValue,
    });

    res.json(sales);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      message:
        error.message ||
        '나의 판매 포토카드를 불러오는 중 오류가 발생했습니다.',
      data: error.extraInfo,
    });
  }
}

// 구매
export async function purchaseCard(req, res, next) {
  try {
    const {saleId, quantity} = req.body;
    const userId = req.user.id;

    const result = await photoService.purchaseCard({
      userId,
      saleId,
      quantity,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

// 포토카드 생성
export async function createMyCard(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await photoService.createMyCard(userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      message: error.message || '포토카드를 생성하는 중 오류가 발생했습니다.',
    });
  }
}

// 포토카드 생성 제한
export async function getCardCreationQuota(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await photoService.getCardCreationQuota(userId);
    res.json(result);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      message: error.message,
    });
  }
}
