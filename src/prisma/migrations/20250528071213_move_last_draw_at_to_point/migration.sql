/*
  Warnings:

  - You are about to drop the column `lastDrawAt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Point" ADD COLUMN     "lastDrawAt" TIMESTAMP(3) NOT NULL DEFAULT '2000-01-01 00:00:00 +00:00';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "lastDrawAt";
