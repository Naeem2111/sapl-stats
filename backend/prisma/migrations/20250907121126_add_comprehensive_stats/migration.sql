-- CreateEnum
CREATE TYPE "StatsFieldType" AS ENUM ('INTEGER', 'FLOAT', 'BOOLEAN', 'TEXT', 'PERCENTAGE', 'RATING');

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "awayFormation" TEXT,
ADD COLUMN     "awayLineup" JSONB,
ADD COLUMN     "homeFormation" TEXT,
ADD COLUMN     "homeLineup" JSONB;

-- AlterTable
ALTER TABLE "player_match_stats" ADD COLUMN     "customStats" JSONB,
ADD COLUMN     "goalsConceded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "manOfTheMatch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "possessionLost" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "possessionWon" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "savesSuccessRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tackleSuccessRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totwRating" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "player_season_stats" ADD COLUMN     "avgSavesSuccessRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "avgTackleSuccessRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "avgTotwRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "customStats" JSONB,
ADD COLUMN     "manOfTheMatchCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalGoalsConceded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalPossessionLost" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalPossessionWon" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "stats_field_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "fieldType" "StatsFieldType" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stats_field_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stats_field_configs_name_key" ON "stats_field_configs"("name");
