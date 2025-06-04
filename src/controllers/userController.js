import userService from '../services/userService.js';

const userController = {
  // GET /api/users/me - 내 정보 조회
  async getMe(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await userService.getUserById(userId);
      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  // PATCH /api/users/me - 내 정보 수정
  async updateMe(req, res, next) {
    try {
      const userId = req.user.id;
      const updated = await userService.updateUser(userId, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  // GET /api/users/me/cards - 내 보관중인 카드 목록
  async getMyCards(req, res, next) {
    try {
      const userId = req.user.id;
      const cards = await userService.getCardsByUserId(userId);
      res.json(cards);
    } catch (err) {
      next(err);
    }
  },

  // GET /api/users/me/sales - 내 판매 중인 카드 목록
  async getMySales(req, res, next) {
    try {
      const userId = req.user.id;
      const sales = await userService.getSalesByUserId(userId);
      res.json(sales);
    } catch (err) {
      next(err);
    }
  },

  // GET /api/users/:nickname - 닉네임으로 사용자 조회
  async getUserByNickname(req, res, next) {
    try {
      const { nickname } = req.params;
      const user = await userService.getUserByNickname(nickname);
      res.json(user);
    } catch (err) {
      next(err);
    }
  },
};

export default userController;
