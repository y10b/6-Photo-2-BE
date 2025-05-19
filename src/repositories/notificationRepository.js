import prisma from "../prisma/client.js";

export const notificationRepository = {
  create: (userId, type, content) => {
    return prisma.notification.create({
      data: {
        userId,
        notificationType: type,
        content,
      },
    });
  },
};
