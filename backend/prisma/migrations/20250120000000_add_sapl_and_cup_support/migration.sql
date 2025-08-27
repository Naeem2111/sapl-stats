-- AlterTable
ALTER TABLE "teams" ADD COLUMN "saplId" TEXT,
ADD COLUMN "saplData" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "teams_saplId_key" ON "teams"("saplId");

-- CreateTable
CREATE TABLE "cups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "seasonId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
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
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
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
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cup_rounds_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "matches" ADD COLUMN "cupId" TEXT,
ADD COLUMN "cupRoundId" TEXT,
ADD COLUMN "matchNumber" INTEGER,
ADD COLUMN "isKnockout" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "extraTime" TEXT,
ADD COLUMN "penalties" TEXT;

-- AlterTable
ALTER TABLE "player_match_stats" ADD COLUMN "yellowCards" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "redCards" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "player_season_stats" ADD COLUMN "yellowCards" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "redCards" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "awarded_badges" ADD COLUMN "cupId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "cup_entries_cupId_teamId_key" ON "cup_entries"("cupId", "teamId");

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

