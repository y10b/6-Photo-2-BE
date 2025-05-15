/*
  Warnings:

  - The values [TRAVEL,LANDSCAPE,PORTRAIT,OBJECT] on the enum `CardGenre` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CardGenre_new" AS ENUM ('ALBUM', 'SPECIAL', 'FANSIGN', 'SEASON_GREETING', 'FANMEETING', 'CONCERT', 'MD', 'COLLAB', 'FANCLUB', 'ETC');
ALTER TABLE "Shop" ALTER COLUMN "exchangeGenre" DROP DEFAULT;
ALTER TABLE "PhotoCard" ALTER COLUMN "genre" TYPE "CardGenre_new" USING ("genre"::text::"CardGenre_new");
ALTER TABLE "Shop" ALTER COLUMN "exchangeGenre" TYPE "CardGenre_new" USING ("exchangeGenre"::text::"CardGenre_new");
ALTER TYPE "CardGenre" RENAME TO "CardGenre_old";
ALTER TYPE "CardGenre_new" RENAME TO "CardGenre";
DROP TYPE "CardGenre_old";
ALTER TABLE "Shop" ALTER COLUMN "exchangeGenre" SET DEFAULT 'ALBUM';
COMMIT;

-- AlterTable
ALTER TABLE "Shop" ALTER COLUMN "exchangeGenre" SET DEFAULT 'ALBUM';
