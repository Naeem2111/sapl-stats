/*
  Warnings:

  - A unique constraint covering the columns `[badgeId,playerId,seasonId,matchId,cupId]` on the table `awarded_badges` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[saplId]` on the table `teams` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CupFormat" AS ENUM ('KNOCKOUT', 'DOUBLE_KNOCKOUT', 'GROUP_KNOCKOUT', 'ROUND_ROBIN', 'SWISS_SYSTEM');

-- CreateEnum
CREATE TYPE "CupStatus" AS ENUM ('PLANNING', 'REGISTRATION', 'SEEDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CupEntryStatus" AS ENUM ('REGISTERED', 'CONFIRMED', 'WITHDRAWN', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "RoundFormat" AS ENUM ('GROUP_STAGE', 'KNOCKOUT', 'PLAYOFF');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('PLANNING', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ExtraTimeResult" AS ENUM ('HOME_WIN', 'AWAY_WIN', 'DRAW');

-- CreateEnum
CREATE TYPE "PenaltyResult" AS ENUM ('HOME_WIN', 'AWAY_WIN');

-- DropIndex
DROP INDEX "awarded_badges_badgeId_playerId_seasonId_matchId_key";

-- AlterTable
ALTER TABLE "awarded_badges" ADD COLUMN     "cupId" TEXT;

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "cupId" TEXT,
ADD COLUMN     "cupRoundId" TEXT,
ADD COLUMN     "extraTime" "ExtraTimeResult",
ADD COLUMN     "isKnockout" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "matchNumber" INTEGER,
ADD COLUMN     "penalties" "PenaltyResult";

-- AlterTable
ALTER TABLE "player_match_stats" ADD COLUMN     "redCards" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "yellowCards" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "player_season_stats" ADD COLUMN     "redCards" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "yellowCards" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "saplData" JSONB,
ADD COLUMN     "saplId" TEXT;

-- CreateTable
CREATE TABLE "team_season_aggregates" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "matchesWon" INTEGER NOT NULL DEFAULT 0,
    "matchesDrawn" INTEGER NOT NULL DEFAULT 0,
    "matchesLost" INTEGER NOT NULL DEFAULT 0,
    "goalsFor" INTEGER NOT NULL DEFAULT 0,
    "goalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "goalDifference" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,
    "cleanSheets" INTEGER NOT NULL DEFAULT 0,
    "goalsConceded" INTEGER NOT NULL DEFAULT 0,
    "shotsOnTarget" INTEGER NOT NULL DEFAULT 0,
    "shotsOffTarget" INTEGER NOT NULL DEFAULT 0,
    "possession" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "yellowCards" INTEGER NOT NULL DEFAULT 0,
    "redCards" INTEGER NOT NULL DEFAULT 0,
    "formPoints" INTEGER NOT NULL DEFAULT 0,
    "formString" TEXT NOT NULL DEFAULT '',
    "league" TEXT,
    "fixtureGroupId" TEXT,

    CONSTRAINT "team_season_aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "seasonId" TEXT NOT NULL,
    "format" "CupFormat" NOT NULL,
    "status" "CupStatus" NOT NULL DEFAULT 'PLANNING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "maxTeams" INTEGER,
    "minTeams" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cup_entries" (
    "id" TEXT NOT NULL,
    "cupId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "status" "CupEntryStatus" NOT NULL DEFAULT 'REGISTERED',
    "seed" INTEGER,
    "group" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cup_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cup_rounds" (
    "id" TEXT NOT NULL,
    "cupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "format" "RoundFormat" NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'PLANNING',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cup_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_season_aggregates_seasonId_teamId_key" ON "team_season_aggregates"("seasonId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "cup_entries_cupId_teamId_key" ON "cup_entries"("cupId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "awarded_badges_badgeId_playerId_seasonId_matchId_cupId_key" ON "awarded_badges"("badgeId", "playerId", "seasonId", "matchId", "cupId");

-- CreateIndex
CREATE UNIQUE INDEX "teams_saplId_key" ON "teams"("saplId");

-- AddForeignKey
ALTER TABLE "team_season_aggregates" ADD CONSTRAINT "team_season_aggregates_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_season_aggregates" ADD CONSTRAINT "team_season_aggregates_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cups" ADD CONSTRAINT "cups_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cup_entries" ADD CONSTRAINT "cup_entries_cupId_fkey" FOREIGN KEY ("cupId") REFERENCES "cups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cup_entries" ADD CONSTRAINT "cup_entries_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cup_rounds" ADD CONSTRAINT "cup_rounds_cupId_fkey" FOREIGN KEY ("cupId") REFERENCES "cups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_cupId_fkey" FOREIGN KEY ("cupId") REFERENCES "cups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_cupRoundId_fkey" FOREIGN KEY ("cupRoundId") REFERENCES "cup_rounds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awarded_badges" ADD CONSTRAINT "awarded_badges_cupId_fkey" FOREIGN KEY ("cupId") REFERENCES "cups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
