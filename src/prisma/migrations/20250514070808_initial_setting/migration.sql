-- CreateEnum
CREATE TYPE "PointType" AS ENUM ('join', 'draw', 'purchase', 'exchange', 'refund');

-- CreateEnum
CREATE TYPE "ExchangeStatus" AS ENUM ('requested', 'accepted', 'rejected', 'cancelled', 'completed');

-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('IDLE', 'FOR_SALE', 'FOR_TRADE', 'SOLD');

-- CreateEnum
CREATE TYPE "CardGrade" AS ENUM ('common', 'rare', 'super_rare', 'legendary');

-- CreateEnum
CREATE TYPE "CardGenre" AS ENUM ('travel', 'landscape', 'portrait', 'object');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EXCHANGE_PROPOSED', 'EXCHANGE_ACCEPTED', 'EXCHANGE_DECLINED', 'PURCHASE_COMPLETED', 'SELL_COMPLETED', 'SOLD_OUT');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoCard" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "grade" "CardGrade" NOT NULL,
    "genre" "CardGenre" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhotoCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCard" (
    "id" SERIAL NOT NULL,
    "status" "CardStatus" NOT NULL DEFAULT 'IDLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "photoCardId" INTEGER NOT NULL,

    CONSTRAINT "UserCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shop" (
    "id" SERIAL NOT NULL,
    "price" INTEGER NOT NULL,
    "initialQuantity" INTEGER NOT NULL DEFAULT 0,
    "remainingQuantity" INTEGER NOT NULL DEFAULT 0,
    "exchangeGrade" "CardGrade" NOT NULL DEFAULT 'common',
    "exchangeGenre" "CardGenre" NOT NULL DEFAULT 'travel',
    "exchangeDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userCardId" INTEGER NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "photoCardId" INTEGER,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "shopId" INTEGER NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointHistory" (
    "id" SERIAL NOT NULL,
    "points" INTEGER NOT NULL,
    "pointType" "PointType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "PointHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Point" (
    "id" SERIAL NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Point_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exchange" (
    "id" SERIAL NOT NULL,
    "status" "ExchangeStatus" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "offeredCardId" INTEGER NOT NULL,
    "targetCardId" INTEGER NOT NULL,

    CONSTRAINT "Exchange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_userCardId_key" ON "Shop"("userCardId");

-- CreateIndex
CREATE UNIQUE INDEX "Point_userId_key" ON "Point"("userId");

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_photoCardId_fkey" FOREIGN KEY ("photoCardId") REFERENCES "PhotoCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_userCardId_fkey" FOREIGN KEY ("userCardId") REFERENCES "UserCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_photoCardId_fkey" FOREIGN KEY ("photoCardId") REFERENCES "PhotoCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointHistory" ADD CONSTRAINT "PointHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Point" ADD CONSTRAINT "Point_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exchange" ADD CONSTRAINT "Exchange_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exchange" ADD CONSTRAINT "Exchange_offeredCardId_fkey" FOREIGN KEY ("offeredCardId") REFERENCES "UserCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exchange" ADD CONSTRAINT "Exchange_targetCardId_fkey" FOREIGN KEY ("targetCardId") REFERENCES "UserCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
