import prisma from '../prisma/client.js';
import userRepository from '../repositories/userRepository.js';

const pointService = {
  async checkCooldown(userId) {
    const user = await userRepository.findById(userId);
    const point = user.point;

    const now = Date.now();
    const last = new Date(point.lastDrawAt).getTime();
    const diff = now - last;

    const canDraw = diff >= 3600 * 1000;
    const remainSeconds = canDraw ? 0 : Math.floor((3600 * 1000 - diff) / 1000);

    return {
      canDraw,
      remainSeconds,
      serverTime: now, // 프론트 타이머 보정용
    };
  },

  async draw(userId) {
    const user = await userRepository.findById(userId);
    const point = user.point;

    const now = new Date();
    const diff = now - new Date(point.lastDrawAt);

    if (diff < 3600 * 1000) throw new Error('아직 뽑을 수 없습니다');

    // 1. 가중 랜덤 로직 적용 (0-100 생성)
    const weightedValues = [
      ...Array(30)
        .fill()
        .map((_, i) => i), // 0~29 (30개)
      ...Array(20)
        .fill()
        .map((_, i) => i + 30), // 30~49 (20개)
      ...Array(10)
        .fill()
        .map((_, i) => i + 50), // 50~59 (10개)
      ...Array(5)
        .fill()
        .map((_, i) => i + 60), // 60~64 (5개)
      ...Array(3)
        .fill()
        .map((_, i) => i + 65), // 65~67 (3개)
      ...Array(2)
        .fill()
        .map((_, i) => i + 68), // 68~69 (2개)
      70,
      75,
      80,
      90,
      100, // (5개)
    ];
    const value =
      weightedValues[Math.floor(Math.random() * weightedValues.length)];

    const updated = await prisma.$transaction(async tx => {
      const updatedPoint = await tx.point.update({
        where: {userId},
        data: {
          balance: point.balance + value,
          lastDrawAt: now,
        },
      });

      await tx.pointHistory.create({
        data: {
          userId,
          points: value,
          pointType: 'DRAW',
        },
      });

      return updatedPoint;
    });

    return {point: value, totalPoint: updated.balance};
  },
};

export default pointService;
