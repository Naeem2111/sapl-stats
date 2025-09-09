/*
  Warnings:

  - You are about to drop the column `league` on the `team_season_aggregates` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[saplId]` on the table `players` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[saplId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "PlayerPosition" ADD VALUE 'UNKNOWN';

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "leagueId" TEXT;

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "activeFrom" TIMESTAMP(3),
ADD COLUMN     "activeTo" TIMESTAMP(3),
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "internalRef1" TEXT,
ADD COLUMN     "internalRef2" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "saplId" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "teams" TEXT;

-- AlterTable
ALTER TABLE "team_season_aggregates" DROP COLUMN "league",
ADD COLUMN     "leagueId" TEXT;

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "leagueId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "saplId" TEXT;

-- CreateTable
CREATE TABLE "leagues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "saplId" TEXT,
    "saplData" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leagues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leagues_name_key" ON "leagues"("name");

-- CreateIndex
CREATE UNIQUE INDEX "leagues_saplId_key" ON "leagues"("saplId");

-- CreateIndex
CREATE UNIQUE INDEX "players_saplId_key" ON "players"("saplId");

-- CreateIndex
CREATE UNIQUE INDEX "users_saplId_key" ON "users"("saplId");

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_season_aggregates" ADD CONSTRAINT "team_season_aggregates_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE SET NULL ON UPDATE CASCADE;
