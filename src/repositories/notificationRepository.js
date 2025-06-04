import prisma from '../prisma/client.js';

export const notificationRepository = {
  // 알림 생성성
  create: (userId, type, content, relatedShopId) => {
    return prisma.notification.create({
      data: {
        userId,
        notificationType: type,
        content,
        relatedShopId,
      },
    });
  },
  // 알림 조회
  findAllByUserId: userId => {
    return prisma.notification.findMany({
      where: {userId},
      orderBy: {createdAt: 'desc'},
    });
  },

  // 읽음 처리
  markAsRead: id => {
    return prisma.notification.update({
      where: {id},
      data: {isRead: true},
    });
  },
};
