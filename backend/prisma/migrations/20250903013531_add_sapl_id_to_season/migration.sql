/*
  Warnings:

  - A unique constraint covering the columns `[saplId]` on the table `seasons` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "seasons" ADD COLUMN     "description" TEXT,
ADD COLUMN     "saplId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "seasons_saplId_key" ON "seasons"("saplId");
