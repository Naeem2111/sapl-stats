-- CreateEnum
CREATE TYPE "BadgeCategory" AS ENUM ('PERFORMANCE', 'ACHIEVEMENT', 'MILESTONE', 'SPECIAL');

-- CreateEnum
CREATE TYPE "BadgeCriteria" AS ENUM ('GOALS', 'ASSISTS', 'CLEAN_SHEETS', 'TEAM_OF_WEEK', 'HATTRICK', 'BRACE', 'PLAYMAKER', 'DEFENDER', 'GOALKEEPER', 'SEASON_LEADER', 'MATCH_WINNER', 'COMEBACK', 'PERFECT_GAME');

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT,
    "category" "BadgeCategory" NOT NULL,
    "criteria" "BadgeCriteria" NOT NULL,
    "isRepeatable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "awarded_badges" (
    "id" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "seasonId" TEXT,
    "matchId" TEXT,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "awarded_badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "badges_name_key" ON "badges"("name");

-- CreateIndex
CREATE UNIQUE INDEX "awarded_badges_badgeId_playerId_seasonId_matchId_key" ON "awarded_badges"("badgeId", "playerId", "seasonId", "matchId");

-- AddForeignKey
ALTER TABLE "awarded_badges" ADD CONSTRAINT "awarded_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awarded_badges" ADD CONSTRAINT "awarded_badges_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awarded_badges" ADD CONSTRAINT "awarded_badges_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awarded_badges" ADD CONSTRAINT "awarded_badges_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
