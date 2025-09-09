const express = require("express");
const { prisma } = require("../database/prisma");

const router = express.Router();

// Get overall statistics leaderboard
router.get("/leaderboard", async (req, res, next) => {
	try {
		const {
			seasonId,
			stat = "goals",
			position,
			limit = 20,
			teamId,
		} = req.query;

		// Validate stat parameter
		const validStats = [
			"goals",
			"assists",
			"rating",
			"passAccuracy",
			"tackles",
			"interceptions",
			"saves",
			"cleanSheets",
		];
		if (!validStats.includes(stat)) {
			return res.status(400).json({
				error: "Invalid stat",
				message: "Stat must be one of: " + validStats.join(", "),
			});
		}

		// Build where clause
		const where = {};
		if (seasonId) where.seasonId = seasonId;
		if (teamId) where.teamId = teamId;

		// Build order by clause based on stat
		let orderBy = {};
		switch (stat) {
			case "goals":
				orderBy = { totalGoals: "desc" };
				break;
			case "assists":
				orderBy = { totalAssists: "desc" };
				break;
			case "rating":
				orderBy = { avgRating: "desc" };
				break;
			case "passAccuracy":
				orderBy = { avgPassAccuracy: "desc" };
				break;
			case "tackles":
				orderBy = { totalTackles: "desc" };
				break;
			case "interceptions":
				orderBy = { totalInterceptions: "desc" };
				break;
			case "saves":
				orderBy = { totalSaves: "desc" };
				break;
			case "cleanSheets":
				orderBy = { cleanSheets: "desc" };
				break;
		}

		// Get leaderboard data
		const leaderboard = await prisma.playerSeasonStat.findMany({
			where,
			take: parseInt(limit),
			orderBy,
			include: {
				player: {
					select: {
						id: true,
						gamertag: true,
						position: true,
						team: {
							select: {
								id: true,
								name: true,
								logoUrl: true,
							},
						},
					},
				},
				season: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		res.json({
			success: true,
			data: {
				stat,
				seasonId,
				leaderboard,
			},
		});
	} catch (error) {
		next(error);
	}
});

// Get team statistics comparison
router.get("/team-comparison", async (req, res, next) => {
	try {
		const { seasonId, teamIds } = req.query;

		if (!teamIds) {
			return res.status(400).json({
				error: "Missing team IDs",
				message: "Please provide team IDs to compare",
			});
		}

		const teamIdArray = teamIds.split(",");
		if (teamIdArray.length < 2) {
			return res.status(400).json({
				error: "Invalid team IDs",
				message: "Please provide at least 2 team IDs to compare",
			});
		}

		// Build where clause
		const where = { teamId: { in: teamIdArray } };
		if (seasonId) where.seasonId = seasonId;

		// Get team statistics
		const teamStats = await prisma.playerSeasonStat.findMany({
			where,
			include: {
				team: {
					select: {
						id: true,
						name: true,
						logoUrl: true,
					},
				},
			},
		});

		// Group and aggregate statistics by team
		const teamComparison = {};

		teamStats.forEach((stat) => {
			const teamId = stat.teamId;
			if (!teamComparison[teamId]) {
				teamComparison[teamId] = {
					team: stat.team,
					totalGoals: 0,
					totalAssists: 0,
					totalShots: 0,
					totalPasses: 0,
					totalTackles: 0,
					totalInterceptions: 0,
					totalSaves: 0,
					cleanSheets: 0,
					matchesPlayed: 0,
					playerCount: 0,
					passAccuracySum: 0,
					ratingSum: 0,
				};
			}

			const team = teamComparison[teamId];
			team.totalGoals += stat.totalGoals;
			team.totalAssists += stat.totalAssists;
			team.totalShots += stat.totalShots;
			team.totalPasses += stat.totalPasses;
			team.totalTackles += stat.totalTackles;
			team.totalInterceptions += stat.totalInterceptions;
			team.totalSaves += stat.totalSaves;
			team.cleanSheets += stat.cleanSheets;
			team.matchesPlayed += stat.matchesPlayed;
			team.playerCount += 1;
			team.passAccuracySum += stat.avgPassAccuracy;
			team.ratingSum += stat.avgRating;
		});

		// Calculate averages
		Object.values(teamComparison).forEach((team) => {
			if (team.playerCount > 0) {
				team.avgPassAccuracy = team.passAccuracySum / team.playerCount;
				team.avgRating = team.ratingSum / team.playerCount;
			}
			delete team.passAccuracySum;
			delete team.ratingSum;
		});

		res.json({
			success: true,
			data: {
				seasonId,
				comparison: Object.values(teamComparison),
			},
		});
	} catch (error) {
		next(error);
	}
});

// Get season statistics summary
router.get("/season-summary/:seasonId", async (req, res, next) => {
	try {
		const { seasonId } = req.params;

		// Check if season exists
		const season = await prisma.season.findUnique({
			where: { id: seasonId },
		});

		if (!season) {
			return res.status(404).json({
				error: "Season not found",
				message: "Season with the specified ID does not exist",
			});
		}

		// Get season statistics
		const seasonStats = await prisma.playerSeasonStat.findMany({
			where: { seasonId },
			include: {
				player: {
					select: {
						gamertag: true,
						position: true,
					},
				},
				team: {
					select: {
						name: true,
					},
				},
			},
		});

		// Calculate season totals
		const seasonTotals = seasonStats.reduce(
			(acc, stat) => {
				acc.totalGoals += stat.totalGoals;
				acc.totalAssists += stat.totalAssists;
				acc.totalShots += stat.totalShots;
				acc.totalPasses += stat.totalPasses;
				acc.totalTackles += stat.totalTackles;
				acc.totalInterceptions += stat.totalInterceptions;
				acc.totalSaves += stat.totalSaves;
				acc.totalCleanSheets += stat.cleanSheets;
				acc.totalMatches += stat.matchesPlayed;
				return acc;
			},
			{
				totalGoals: 0,
				totalAssists: 0,
				totalShots: 0,
				totalPasses: 0,
				totalTackles: 0,
				totalInterceptions: 0,
				totalSaves: 0,
				totalCleanSheets: 0,
				totalMatches: 0,
			}
		);

		// Calculate averages
		const playerCount = seasonStats.length;
		if (playerCount > 0) {
			seasonTotals.avgPassAccuracy =
				seasonStats.reduce((sum, stat) => sum + stat.avgPassAccuracy, 0) /
				playerCount;
			seasonTotals.avgRating =
				seasonStats.reduce((sum, stat) => sum + stat.avgRating, 0) /
				playerCount;
		}

		// Get top performers
		const topScorers = seasonStats
			.sort((a, b) => b.totalGoals - a.totalGoals)
			.slice(0, 5)
			.map((stat) => ({
				gamertag: stat.player.gamertag,
				position: stat.player.position,
				team: stat.team.name,
				goals: stat.totalGoals,
			}));

		const topAssisters = seasonStats
			.sort((a, b) => b.totalAssists - a.totalAssists)
			.slice(0, 5)
			.map((stat) => ({
				gamertag: stat.player.gamertag,
				position: stat.player.position,
				team: stat.team.name,
				assists: stat.totalAssists,
			}));

		const topRated = seasonStats
			.sort((a, b) => b.avgRating - a.avgRating)
			.slice(0, 5)
			.map((stat) => ({
				gamertag: stat.player.gamertag,
				position: stat.player.position,
				team: stat.team.name,
				rating: stat.avgRating,
			}));

		res.json({
			success: true,
			data: {
				season,
				seasonTotals,
				playerCount,
				topScorers,
				topAssisters,
				topRated,
			},
		});
	} catch (error) {
		next(error);
	}
});

// Get position-based statistics
router.get("/position-stats", async (req, res, next) => {
	try {
		const { seasonId, teamId } = req.query;

		// Build where clause
		const where = {};
		if (seasonId) where.seasonId = seasonId;
		if (teamId) where.teamId = teamId;

		// Get position statistics
		const positionStats = await prisma.playerSeasonStat.findMany({
			where,
			include: {
				player: {
					select: {
						position: true,
					},
				},
			},
		});

		// Group statistics by position
		const positionGroups = {};

		positionStats.forEach((stat) => {
			const position = stat.player.position;
			if (!positionGroups[position]) {
				positionGroups[position] = {
					position,
					playerCount: 0,
					totalGoals: 0,
					totalAssists: 0,
					totalShots: 0,
					totalPasses: 0,
					totalTackles: 0,
					totalInterceptions: 0,
					totalSaves: 0,
					totalCleanSheets: 0,
					totalMatches: 0,
					passAccuracySum: 0,
					ratingSum: 0,
					// New statistics for all positions
					totalPossessionLost: 0,
					totalPossessionWon: 0,
					manOfTheMatchCount: 0,
					tackleSuccessRateSum: 0,
					savesSuccessRateSum: 0,
					totalGoalsConceded: 0,
					// Advanced statistics
					totalXG: 0,
					duelSuccessSum: 0,
					totalPlayersBeatenByPass: 0,
					totalXA: 0,
					totalTacklesAttempted: 0,
				};
			}

			const group = positionGroups[position];
			group.playerCount += 1;
			group.totalGoals += stat.totalGoals;
			group.totalAssists += stat.totalAssists;
			group.totalShots += stat.totalShots;
			group.totalPasses += stat.totalPasses;
			group.totalTackles += stat.totalTackles;
			group.totalInterceptions += stat.totalInterceptions;
			group.totalSaves += stat.totalSaves;
			group.totalCleanSheets += stat.cleanSheets;
			group.totalMatches += stat.matchesPlayed;
			group.passAccuracySum += stat.avgPassAccuracy;
			group.ratingSum += stat.avgRating;
			// New statistics
			group.totalPossessionLost += stat.totalPossessionLost || 0;
			group.totalPossessionWon += stat.totalPossessionWon || 0;
			group.manOfTheMatchCount += stat.manOfTheMatchCount || 0;
			group.tackleSuccessRateSum += stat.avgTackleSuccessRate || 0;
			group.savesSuccessRateSum += stat.avgSavesSuccessRate || 0;
			group.totalGoalsConceded += stat.totalGoalsConceded || 0;
			// Advanced statistics
			group.totalXG += stat.totalXG || 0;
			group.duelSuccessSum += stat.avgDuelSuccess || 0;
			group.totalPlayersBeatenByPass += stat.totalPlayersBeatenByPass || 0;
			group.totalXA += stat.totalXA || 0;
			group.totalTacklesAttempted += stat.totalTacklesAttempted || 0;
		});

		// Calculate averages for each position
		Object.values(positionGroups).forEach((group) => {
			if (group.playerCount > 0) {
				group.avgGoals = group.totalGoals / group.playerCount;
				group.avgAssists = group.totalAssists / group.playerCount;
				group.avgShots = group.totalShots / group.playerCount;
				group.avgPasses = group.totalPasses / group.playerCount;
				group.avgTackles = group.totalTackles / group.playerCount;
				group.avgInterceptions = group.totalInterceptions / group.playerCount;
				group.avgSaves = group.totalSaves / group.playerCount;
				group.avgCleanSheets = group.totalCleanSheets / group.playerCount;
				group.avgPassAccuracy = group.passAccuracySum / group.playerCount;
				group.avgRating = group.ratingSum / group.playerCount;
				// New statistics averages
				group.avgPossessionLost = group.totalPossessionLost / group.playerCount;
				group.avgPossessionWon = group.totalPossessionWon / group.playerCount;
				group.avgManOfTheMatch = group.manOfTheMatchCount / group.playerCount;
				group.avgTackleSuccessRate =
					group.tackleSuccessRateSum / group.playerCount;
				group.avgSavesSuccessRate =
					group.savesSuccessRateSum / group.playerCount;
				group.avgGoalsConceded = group.totalGoalsConceded / group.playerCount;
				// Advanced statistics averages
				group.avgXG = group.totalXG / group.playerCount;
				group.avgDuelSuccess = group.duelSuccessSum / group.playerCount;
				group.avgPlayersBeatenByPass =
					group.totalPlayersBeatenByPass / group.playerCount;
				group.avgXA = group.totalXA / group.playerCount;
				group.avgTacklesAttempted =
					group.totalTacklesAttempted / group.playerCount;
			}

			// Clean up temporary fields
			delete group.passAccuracySum;
			delete group.ratingSum;
			delete group.tackleSuccessRateSum;
			delete group.savesSuccessRateSum;
			delete group.duelSuccessSum;
		});

		res.json({
			success: true,
			data: {
				seasonId,
				teamId,
				positionStats: Object.values(positionGroups),
			},
		});
	} catch (error) {
		next(error);
	}
});

// Get player head-to-head comparison
router.get("/player-comparison", async (req, res, next) => {
	try {
		const { playerIds, seasonId } = req.query;

		if (!playerIds) {
			return res.status(400).json({
				error: "Missing player IDs",
				message: "Please provide player IDs to compare",
			});
		}

		const playerIdArray = playerIds.split(",");
		if (playerIdArray.length < 2) {
			return res.status(400).json({
				error: "Invalid player IDs",
				message: "Please provide at least 2 player IDs to compare",
			});
		}

		// Build where clause
		const where = { playerId: { in: playerIdArray } };
		if (seasonId) where.seasonId = seasonId;

		// Get player statistics
		const playerStats = await prisma.playerSeasonStat.findMany({
			where,
			include: {
				player: {
					select: {
						id: true,
						gamertag: true,
						position: true,
						team: {
							select: {
								id: true,
								name: true,
								logoUrl: true,
							},
						},
					},
				},
				season: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		res.json({
			success: true,
			data: {
				seasonId,
				comparison: playerStats,
			},
		});
	} catch (error) {
		next(error);
	}
});

module.exports = router;
