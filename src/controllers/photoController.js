import photoService from "../services/photoService.js";

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
  } catch (err) {
    next(err);
  }
}

// 카드 상세 정보 조회
export async function getCardDetail(req, res, next) {
  try {
    const card = await photoService.getCardDetail(
      Number(req.params.id),
      req.user?.id
    );
    res.json(card);
  } catch (err) {
    next(err);
  }
}

// 로그인한 유저의 전체 보유 카드 조회 (필터링, 페이지네이션 포함)
export async function getMyCards(req, res, next) {
  try {
    const { filterType, filterValue, keyword, page = 1, take = 10 } = req.query;

    const cards = await photoService.getMyCards({
      userId: req.user.id,
      page,
      take,
      keyword,
      filterType,
      filterValue,
    });
    res.json(cards);
  } catch (err) {
    next(err);
  }
}

// 로그인한 유저의 판매 중인 카드 목록 조회(for_sale) (필터링, 페이지네이션 포함)
export async function getMySales(req, res, next) {
  try {
    const { filterType, filterValue, keyword, page = 1, take = 10 } = req.query;

    const sales = await photoService.getMySales({
      userId: req.user.id,
      page,
      take,
      keyword,
      filterType,
      filterValue,
    });

    res.json(sales);
  } catch (err) {
    next(err);
  }
}

// 구매
export async function purchaseCard(req, res, next) {
  try {
    const { saleId, quantity } = req.body;
    const userId = req.user.id;

    const result = await photoService.purchaseCard({ userId, saleId, quantity });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

