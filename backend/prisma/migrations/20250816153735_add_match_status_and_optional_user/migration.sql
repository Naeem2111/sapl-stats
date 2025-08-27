-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED';

-- AlterTable
ALTER TABLE "players" ALTER COLUMN "userId" DROP NOT NULL;
