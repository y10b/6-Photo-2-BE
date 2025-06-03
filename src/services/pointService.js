import prisma from '../prisma/client.js';
import userRepository from '../repositories/userRepository.js';

const gradeWeights = [
  {grade: 'common', range: [100, 1000], weight: 60},
  {grade: 'rare', range: [1000, 3000], weight: 20},
  {grade: 'epic', range: [3000, 5000], weight: 10},
  {grade: 'legendary', range: [5000, 10000], weight: 10},
];
function getWeightedGrade() {
  const total = gradeWeights.reduce((sum, g) => sum + g.weight, 0);
  const rand = Math.random() * total;

  let acc = 0;
  for (const g of gradeWeights) {
    acc += g.weight;
    if (rand <= acc) return g;
  }
}
function getRandomPointByGrade(gradeInfo) {
  const [min, max] = gradeInfo.range;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

    const selectedGrade = getWeightedGrade();
    const value = getRandomPointByGrade(selectedGrade);

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

    return {
      point: value,
      totalPoint: updated.balance,
      grade: selectedGrade.grade,
    };
  },
};

export default pointService;
