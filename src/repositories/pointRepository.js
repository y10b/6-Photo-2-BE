import prisma from '../prisma/client.js';

const pointRepository = {
  async findByUserId(userId) {
    return prisma.point.findUnique({ where: { userId } });
  },

  async update(userId, data) {
    return prisma.point.update({ where: { userId }, data });
  },

  async logHistory(userId, points) {
    return prisma.pointHistory.create({
      data: {
        userId,
        points,
        pointType: 'DRAW',
      },
    });
  },
};

export default pointRepository;
