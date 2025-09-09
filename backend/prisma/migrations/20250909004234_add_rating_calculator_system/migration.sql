-- CreateTable
CREATE TABLE "rating_formulas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "formula" TEXT NOT NULL,
    "position" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rating_formulas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "position_mappings" (
    "id" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "formation" TEXT NOT NULL,
    "mappedRole" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "position_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rating_calculations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fixtureRange" JSONB,
    "seasonId" TEXT,
    "leagueId" TEXT,
    "teamId" TEXT,
    "formulaId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rating_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_ratings" (
    "id" TEXT NOT NULL,
    "calculationId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "matchId" TEXT,
    "position" TEXT NOT NULL,
    "mappedRole" TEXT,
    "baseStats" JSONB NOT NULL,
    "calculatedRating" DOUBLE PRECISION NOT NULL,
    "formulaUsed" TEXT NOT NULL,
    "rank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rating_formulas_name_key" ON "rating_formulas"("name");

-- CreateIndex
CREATE UNIQUE INDEX "position_mappings_position_formation_key" ON "position_mappings"("position", "formation");

-- CreateIndex
CREATE UNIQUE INDEX "player_ratings_calculationId_playerId_matchId_key" ON "player_ratings"("calculationId", "playerId", "matchId");

-- AddForeignKey
ALTER TABLE "rating_calculations" ADD CONSTRAINT "rating_calculations_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "rating_formulas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_calculations" ADD CONSTRAINT "rating_calculations_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_calculations" ADD CONSTRAINT "rating_calculations_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_calculations" ADD CONSTRAINT "rating_calculations_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_ratings" ADD CONSTRAINT "player_ratings_calculationId_fkey" FOREIGN KEY ("calculationId") REFERENCES "rating_calculations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_ratings" ADD CONSTRAINT "player_ratings_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_ratings" ADD CONSTRAINT "player_ratings_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
