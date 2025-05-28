import pointRepository from '../repositories/pointRepository.js';

const pointService = {
  async checkCooldown(userId) {
    const point = await pointRepository.findByUserId(userId);
    const now = Date.now();
    if (!point.lastDrawAt) {
      return {canDraw: true, remainSeconds: 0};
    }
    const last = new Date(point.lastDrawAt).getTime();
    const diff = now - last;

    const canDraw = diff >= 3600 * 1000;
    const remainSeconds = canDraw ? 0 : Math.floor((3600 * 1000 - diff) / 1000);

    return {canDraw, remainSeconds};
  },

  async draw(userId) {
    const point = await pointRepository.findByUserId(userId);
    const now = new Date();
    const diff = now - new Date(point.lastDrawAt);
    if (diff < 3600 * 1000) throw new Error('아직 뽑을 수 없습니다');

    const value = Math.floor(Math.random() * 101); // 0 - 100 생성

    const updated = await pointRepository.update(userId, {
      balance: point.balance + value,
      lastDrawAt: now,
    });

    await pointRepository.logHistory(userId, value);

    return {point: value, totalPoint: updated.balance};
  },
};

export default pointService;
