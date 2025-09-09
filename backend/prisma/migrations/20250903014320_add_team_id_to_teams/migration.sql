/*
  Warnings:

  - A unique constraint covering the columns `[teamId]` on the table `teams` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "teamId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "teams_teamId_key" ON "teams"("teamId");
