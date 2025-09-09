-- CreateEnum
CREATE TYPE "CompetitionFormat" AS ENUM ('LEAGUE', 'CUP', 'TOURNAMENT', 'FRIENDLY');

-- CreateEnum
CREATE TYPE "CompetitionStatus" AS ENUM ('PLANNING', 'REGISTRATION', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('POINTS', 'GOAL_DIFFERENCE', 'GOALS_FOR', 'GOALS_AGAINST');

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "competitionId" TEXT,
ADD COLUMN     "statsLocked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "player_match_stats" ADD COLUMN     "minutesPlayed" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "competitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "seasonId" TEXT NOT NULL,
    "format" "CompetitionFormat" NOT NULL DEFAULT 'LEAGUE',
    "status" "CompetitionStatus" NOT NULL DEFAULT 'PLANNING',
    "maxTeams" INTEGER,
    "minTeams" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_adjustments" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "type" "AdjustmentType" NOT NULL,
    "value" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "adjustedBy" TEXT NOT NULL,
    "adjustedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "league_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CompetitionTeams" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CompetitionTeams_AB_unique" ON "_CompetitionTeams"("A", "B");

-- CreateIndex
CREATE INDEX "_CompetitionTeams_B_index" ON "_CompetitionTeams"("B");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_adjustments" ADD CONSTRAINT "league_adjustments_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_adjustments" ADD CONSTRAINT "league_adjustments_adjustedBy_fkey" FOREIGN KEY ("adjustedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompetitionTeams" ADD CONSTRAINT "_CompetitionTeams_A_fkey" FOREIGN KEY ("A") REFERENCES "competitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompetitionTeams" ADD CONSTRAINT "_CompetitionTeams_B_fkey" FOREIGN KEY ("B") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
