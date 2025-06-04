import pointService from '../services/pointService.js';

const pointController = {
  // 쿨타임 확인
  async checkCooldown(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await pointService.checkCooldown(userId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  // 포인트 뽑기
  async draw(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await pointService.draw(userId);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
};

export default pointController;