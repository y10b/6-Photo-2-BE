/*
  Warnings:

  - The values [FOR_SALE,FOR_SALE_AND_TRADE] on the enum `CardStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `userCardId` on the `Shop` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[shopListingId]` on the table `UserCard` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `listingType` to the `Shop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `photoCardId` to the `Shop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerId` to the `Shop` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ShopListingType" AS ENUM ('FOR_SALE', 'FOR_SALE_AND_TRADE');

-- AlterEnum
BEGIN;
CREATE TYPE "CardStatus_new" AS ENUM ('IDLE', 'LISTED', 'SOLD');
ALTER TABLE "UserCard" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "UserCard" ALTER COLUMN "status" TYPE "CardStatus_new" USING ("status"::text::"CardStatus_new");
ALTER TYPE "CardStatus" RENAME TO "CardStatus_old";
ALTER TYPE "CardStatus_new" RENAME TO "CardStatus";
DROP TYPE "CardStatus_old";
ALTER TABLE "UserCard" ALTER COLUMN "status" SET DEFAULT 'IDLE';
COMMIT;

-- DropForeignKey
ALTER TABLE "Shop" DROP CONSTRAINT "Shop_userCardId_fkey";

-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "userCardId",
ADD COLUMN     "listingType" "ShopListingType" NOT NULL,
ADD COLUMN     "photoCardId" INTEGER NOT NULL,
ADD COLUMN     "sellerId" INTEGER NOT NULL,
ALTER COLUMN "initialQuantity" DROP DEFAULT,
ALTER COLUMN "remainingQuantity" DROP DEFAULT,
ALTER COLUMN "exchangeGrade" DROP NOT NULL,
ALTER COLUMN "exchangeGrade" DROP DEFAULT,
ALTER COLUMN "exchangeGenre" DROP NOT NULL,
ALTER COLUMN "exchangeGenre" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserCard" ADD COLUMN     "shopListingId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "UserCard_shopListingId_key" ON "UserCard"("shopListingId");

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_shopListingId_fkey" FOREIGN KEY ("shopListingId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_photoCardId_fkey" FOREIGN KEY ("photoCardId") REFERENCES "PhotoCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
