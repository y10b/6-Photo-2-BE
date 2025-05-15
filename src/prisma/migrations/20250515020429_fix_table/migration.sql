/*
  Warnings:

  - The values [travel,landscape,portrait,object] on the enum `CardGenre` will be removed. If these variants are still used in the database, this will fail.
  - The values [common,rare,super_rare,legendary] on the enum `CardGrade` will be removed. If these variants are still used in the database, this will fail.
  - The values [requested,accepted,rejected,cancelled,completed] on the enum `ExchangeStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [join,draw,purchase,exchange,refund] on the enum `PointType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Purchase` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CardGenre_new" AS ENUM ('TRAVEL', 'LANDSCAPE', 'PORTRAIT', 'OBJECT');
ALTER TABLE "Shop" ALTER COLUMN "exchangeGenre" DROP DEFAULT;
ALTER TABLE "PhotoCard" ALTER COLUMN "genre" TYPE "CardGenre_new" USING ("genre"::text::"CardGenre_new");
ALTER TABLE "Shop" ALTER COLUMN "exchangeGenre" TYPE "CardGenre_new" USING ("exchangeGenre"::text::"CardGenre_new");
ALTER TYPE "CardGenre" RENAME TO "CardGenre_old";
ALTER TYPE "CardGenre_new" RENAME TO "CardGenre";
DROP TYPE "CardGenre_old";
ALTER TABLE "Shop" ALTER COLUMN "exchangeGenre" SET DEFAULT 'TRAVEL';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "CardGrade_new" AS ENUM ('COMMON', 'RARE', 'SUPER_RARE', 'LEGENDARY');
ALTER TABLE "Shop" ALTER COLUMN "exchangeGrade" DROP DEFAULT;
ALTER TABLE "PhotoCard" ALTER COLUMN "grade" TYPE "CardGrade_new" USING ("grade"::text::"CardGrade_new");
ALTER TABLE "Shop" ALTER COLUMN "exchangeGrade" TYPE "CardGrade_new" USING ("exchangeGrade"::text::"CardGrade_new");
ALTER TYPE "CardGrade" RENAME TO "CardGrade_old";
ALTER TYPE "CardGrade_new" RENAME TO "CardGrade";
DROP TYPE "CardGrade_old";
ALTER TABLE "Shop" ALTER COLUMN "exchangeGrade" SET DEFAULT 'COMMON';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ExchangeStatus_new" AS ENUM ('REQUESTED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED');
ALTER TABLE "Exchange" ALTER COLUMN "status" TYPE "ExchangeStatus_new" USING ("status"::text::"ExchangeStatus_new");
ALTER TYPE "ExchangeStatus" RENAME TO "ExchangeStatus_old";
ALTER TYPE "ExchangeStatus_new" RENAME TO "ExchangeStatus";
DROP TYPE "ExchangeStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PointType_new" AS ENUM ('JOIN', 'DRAW', 'PURCHASE', 'EXCHANGE');
ALTER TABLE "PointHistory" ALTER COLUMN "pointType" TYPE "PointType_new" USING ("pointType"::text::"PointType_new");
ALTER TYPE "PointType" RENAME TO "PointType_old";
ALTER TYPE "PointType_new" RENAME TO "PointType";
DROP TYPE "PointType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_buyerId_fkey";

-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_shopId_fkey";

-- AlterTable
ALTER TABLE "Shop" ALTER COLUMN "exchangeGrade" SET DEFAULT 'COMMON',
ALTER COLUMN "exchangeGenre" SET DEFAULT 'TRAVEL';

-- DropTable
DROP TABLE "Purchase";
