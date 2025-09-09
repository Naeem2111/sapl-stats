const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const totwRatingService = require("../services/totwRatingService");

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Get player's season statistics by player ID (public access)
 */
router.get("/player/:playerId", async (req, res) => {
	try {
		const { playerId } = req.params;
		const { season } = req.query;

		// Find player record
		const player = await prisma.player.findUnique({
			where: { id: playerId },
			include: {
				user: true,
				team: true,
			},
		});

		if (!player) {
			return res.status(404).json({ error: "Player not found" });
		}

		// Find season
		let seasonRecord = null;
		if (season && season !== "all") {
			seasonRecord = await prisma.season.findFirst({
				where: {
					OR: [{ name: season }, { id: season }],
				},
			});
		} else {
			// Default to Season 29 if no season specified
			seasonRecord = await prisma.season.findFirst({
				where: { name: "Season 29" },
			});
		}

		if (!seasonRecord) {
			return res.status(404).json({ error: "Season not found" });
		}

		// Get player season stats
		const playerSeasonStats = await prisma.playerSeasonStat.findFirst({
			where: {
				playerId: player.id,
				seasonId: seasonRecord.id,
			},
		});

		res.json({
			player: {
				id: player.id,
				name: `${player.firstName} ${player.lastName}`,
				team: player.team?.name,
				position: player.position,
			},
			season: seasonRecord.name,
			stats: playerSeasonStats
				? {
						goals: playerSeasonStats.totalGoals,
						assists: playerSeasonStats.totalAssists,
						appearances: playerSeasonStats.matchesPlayed,
						minutesPlayed: 0, // Not tracked in current schema
						yellowCards: playerSeasonStats.yellowCards,
						redCards: playerSeasonStats.redCards,
						tackles: playerSeasonStats.totalTackles,
						interceptions: playerSeasonStats.totalInterceptions,
						shots: playerSeasonStats.totalShots,
						shotsOnTarget: 0, // Not tracked in current schema
						saves: playerSeasonStats.totalSaves,
						cleanSheets: playerSeasonStats.cleanSheets,
						fouls: 0, // Not tracked in current schema
						offsides: 0, // Not tracked in current schema
						passAccuracy: playerSeasonStats.avgPassAccuracy,
						possessionLost: 0, // Not tracked in current schema
						manOfTheMatch: 0, // Not tracked in current schema
				  }
				: {
						goals: 0,
						assists: 0,
						appearances: 0,
						minutesPlayed: 0,
						yellowCards: 0,
						redCards: 0,
						tackles: 0,
						interceptions: 0,
						shots: 0,
						shotsOnTarget: 0,
						saves: 0,
						cleanSheets: 0,
						fouls: 0,
						offsides: 0,
						passAccuracy: 0,
						possessionLost: 0,
						manOfTheMatch: 0,
				  },
		});
	} catch (error) {
		console.error("Error fetching player season stats:", error);
		res.status(500).json({ error: "Failed to fetch player statistics" });
	}
});

/**
 * Get player's season statistics (authenticated user only)
 */
router.get("/season/:seasonName", authenticateToken, async (req, res) => {
	try {
		const userId = req.user.id;
		const { seasonName } = req.params;

		// Find player record for this user
		const player = await prisma.player.findFirst({
			where: { userId: userId },
			include: {
				user: true,
				team: true,
			},
		});

		if (!player) {
			return res.status(404).json({ error: "Player record not found" });
		}

		// Find season
		const season = await prisma.season.findFirst({
			where: { name: seasonName },
		});

		if (!season) {
			return res.status(404).json({ error: "Season not found" });
		}

		// Get player season statistics
		const playerSeasonStats = await prisma.playerSeasonStat.findFirst({
			where: {
				playerId: player.id,
				seasonId: season.id,
			},
		});

		res.json({
			player: {
				id: player.id,
				name: `${player.firstName} ${player.lastName}`,
				team: player.team?.name,
				position: player.position,
			},
			season: season.name,
			stats: playerSeasonStats
				? {
						goals: playerSeasonStats.totalGoals,
						assists: playerSeasonStats.totalAssists,
						appearances: playerSeasonStats.matchesPlayed,
						minutesPlayed: 0, // Not tracked in current schema
						yellowCards: playerSeasonStats.yellowCards,
						redCards: playerSeasonStats.redCards,
						tackles: playerSeasonStats.totalTackles,
						interceptions: playerSeasonStats.totalInterceptions,
						shots: playerSeasonStats.totalShots,
						shotsOnTarget: 0, // Not tracked in current schema
						saves: playerSeasonStats.totalSaves,
						cleanSheets: playerSeasonStats.cleanSheets,
						fouls: 0, // Not tracked in current schema
						offsides: 0, // Not tracked in current schema
						passAccuracy: playerSeasonStats.avgPassAccuracy,
						possessionLost: 0, // Not tracked in current schema
						manOfTheMatch: 0, // Not tracked in current schema
				  }
				: {
						goals: 0,
						assists: 0,
						appearances: 0,
						minutesPlayed: 0,
						yellowCards: 0,
						redCards: 0,
						tackles: 0,
						interceptions: 0,
						shots: 0,
						shotsOnTarget: 0,
						saves: 0,
						cleanSheets: 0,
						fouls: 0,
						offsides: 0,
						passAccuracy: 0,
						possessionLost: 0,
						manOfTheMatch: 0,
				  },
		});
	} catch (error) {
		console.error("Error fetching player season stats:", error);
		res.status(500).json({ error: "Failed to fetch player statistics" });
	}
});

/**
 * Get team statistics for a season
 */
router.get("/team/:teamId/season/:seasonName", async (req, res) => {
	try {
		const { teamId, seasonName } = req.params;

		// Find season
		const season = await prisma.season.findFirst({
			where: { name: seasonName },
		});

		if (!season) {
			return res.status(404).json({ error: "Season not found" });
		}

		// Get all player season statistics for the team
		const teamStats = await prisma.playerSeasonStat.findMany({
			where: {
				teamId: teamId,
				seasonId: season.id,
			},
			include: {
				player: {
					include: {
						user: {
							select: { username: true },
						},
					},
				},
			},
			orderBy: [{ totalGoals: "desc" }, { totalAssists: "desc" }],
		});

		const formattedStats = teamStats.map((stat) => ({
			player: {
				id: stat.player.id,
				name: `${stat.player.firstName} ${stat.player.lastName}`,
				username: stat.player.user?.username,
				position: stat.player.position,
			},
			stats: {
				goals: stat.totalGoals,
				assists: stat.totalAssists,
				appearances: stat.matchesPlayed,
				minutesPlayed: 0, // Not tracked in current schema
				yellowCards: stat.yellowCards,
				redCards: stat.redCards,
				tackles: stat.totalTackles,
				interceptions: stat.totalInterceptions,
				shots: stat.totalShots,
				shotsOnTarget: 0, // Not tracked in current schema
				saves: stat.totalSaves,
				cleanSheets: stat.cleanSheets,
				fouls: 0, // Not tracked in current schema
				offsides: 0, // Not tracked in current schema
				passAccuracy: stat.avgPassAccuracy,
				possessionLost: 0, // Not tracked in current schema
				manOfTheMatch: 0, // Not tracked in current schema
			},
		}));

		res.json({
			teamId: teamId,
			season: season.name,
			players: formattedStats,
		});
	} catch (error) {
		console.error("Error fetching team statistics:", error);
		res.status(500).json({ error: "Failed to fetch team statistics" });
	}
});

/**
 * Get league statistics for a season (top performers)
 */
router.get("/league/season/:seasonName/leaders", async (req, res) => {
	try {
		const { seasonName } = req.params;
		const { stat = "goals", limit = 10 } = req.query;

		// Validate stat field - map frontend field names to database field names
		const statFieldMap = {
			goals: "totalGoals",
			assists: "totalAssists",
			appearances: "matchesPlayed",
			yellowCards: "yellowCards",
			redCards: "redCards",
			tackles: "totalTackles",
			interceptions: "totalInterceptions",
			shots: "totalShots",
			saves: "totalSaves",
			cleanSheets: "cleanSheets",
			passAccuracy: "avgPassAccuracy",
		};

		const validStats = Object.keys(statFieldMap);
		const dbFieldName = statFieldMap[stat];

		if (!validStats.includes(stat)) {
			return res.status(400).json({ error: "Invalid stat field" });
		}

		// Find season
		const season = await prisma.season.findFirst({
			where: { name: seasonName },
		});

		if (!season) {
			return res.status(404).json({ error: "Season not found" });
		}

		// Get top performers for the specified stat
		const topPerformers = await prisma.playerSeasonStat.findMany({
			where: {
				seasonId: season.id,
				[dbFieldName]: { gt: 0 }, // Only players with stats > 0
			},
			include: {
				player: {
					include: {
						user: {
							select: { username: true },
						},
						team: {
							select: { name: true },
						},
					},
				},
			},
			orderBy: {
				[dbFieldName]: "desc",
			},
			take: parseInt(limit),
		});

		const formattedLeaders = topPerformers.map((statRecord, index) => ({
			rank: index + 1,
			player: {
				id: statRecord.player.id,
				name: `${statRecord.player.firstName} ${statRecord.player.lastName}`,
				username: statRecord.player.user?.username,
				position: statRecord.player.position,
				team: statRecord.player.team?.name,
			},
			value: statRecord[dbFieldName],
		}));

		res.json({
			season: season.name,
			stat: stat,
			leaders: formattedLeaders,
		});
	} catch (error) {
		console.error("Error fetching league leaders:", error);
		res.status(500).json({ error: "Failed to fetch league leaders" });
	}
});

/**
 * Get available seasons
 */
router.get("/seasons", async (req, res) => {
	try {
		const seasons = await prisma.season.findMany({
			select: {
				id: true,
				name: true,
				startDate: true,
				endDate: true,
				description: true,
			},
			orderBy: {
				startDate: "desc",
			},
		});

		res.json({ seasons });
	} catch (error) {
		console.error("Error fetching seasons:", error);
		res.status(500).json({ error: "Failed to fetch seasons" });
	}
});

/**
 * Get player's match statistics
 */
router.get("/matches/:playerId", authenticateToken, async (req, res) => {
	try {
		const { playerId } = req.params;
		const userId = req.user.id;

		// Verify player belongs to user or user is admin
		const player = await prisma.player.findFirst({
			where: {
				id: playerId,
				userId: userId,
			},
		});

		if (!player) {
			return res
				.status(404)
				.json({ error: "Player not found or access denied" });
		}

		// Get player match statistics
		const matchStats = await prisma.playerMatchStat.findMany({
			where: { playerId: playerId },
			include: {
				match: {
					include: {
						homeTeam: {
							select: { name: true },
						},
						awayTeam: {
							select: { name: true },
						},
					},
				},
			},
			orderBy: {
				match: {
					date: "desc",
				},
			},
		});

		const formattedMatchStats = matchStats.map((stat) => ({
			match: {
				id: stat.match.id,
				date: stat.match.date,
				homeTeam: stat.match.homeTeam?.name,
				awayTeam: stat.match.awayTeam?.name,
				homeScore: stat.match.homeScore,
				awayScore: stat.match.awayScore,
			},
			stats: {
				goals: stat.goals,
				assists: stat.assists,
				minutesPlayed: stat.minutesPlayed,
				yellowCards: stat.yellowCards,
				redCards: stat.redCards,
				tackles: stat.tackles,
				interceptions: stat.interceptions,
				shots: stat.shots,
				shotsOnTarget: stat.shotsOnTarget,
				saves: stat.saves,
				cleanSheets: stat.cleanSheets,
				fouls: stat.fouls,
				offsides: stat.offsides,
				passAccuracy: stat.passAccuracy,
				possessionLost: stat.possessionLost,
				manOfTheMatch: stat.manOfTheMatch,
				rating: stat.rating,
				totwRating: stat.totwRating,
				customStats: stat.customStats,
			},
		}));

		res.json({
			player: {
				id: player.id,
				name: `${player.firstName} ${player.lastName}`,
				position: player.position,
			},
			matchStats: formattedMatchStats,
		});
	} catch (error) {
		console.error("Error fetching player match stats:", error);
		res.status(500).json({ error: "Failed to fetch player match statistics" });
	}
});

/**
 * Calculate and update TOTW ratings for a match
 */
router.post("/calculate-totw/:matchId", authenticateToken, async (req, res) => {
	try {
		const { matchId } = req.params;

		// Get all player match stats for this match
		const matchStats = await prisma.playerMatchStat.findMany({
			where: { matchId },
			include: {
				player: {
					select: {
						id: true,
						position: true,
						gamertag: true,
					},
				},
			},
		});

		if (matchStats.length === 0) {
			return res.status(404).json({
				success: false,
				error: {
					message: "No player stats found for this match",
				},
			});
		}

		// Calculate TOTW ratings for each player
		const updatedStats = [];
		for (const stat of matchStats) {
			const totwRating = totwRatingService.calculateTotwRating(
				stat,
				stat.player.position
			);

			// Update the stat with calculated TOTW rating
			const updatedStat = await prisma.playerMatchStat.update({
				where: { id: stat.id },
				data: { totwRating },
			});

			updatedStats.push({
				playerId: stat.playerId,
				playerName: stat.player.gamertag,
				position: stat.player.position,
				rating: stat.rating,
				totwRating: totwRating,
			});
		}

		// Update season stats with average TOTW rating
		const seasonId = matchStats[0].match?.seasonId;
		if (seasonId) {
			// Get unique players from this match
			const playerIds = [...new Set(matchStats.map((stat) => stat.playerId))];

			for (const playerId of playerIds) {
				// Get all match stats for this player in this season
				const playerSeasonStats = await prisma.playerMatchStat.findMany({
					where: {
						playerId,
						match: { seasonId },
					},
				});

				// Calculate average TOTW rating
				const avgTotwRating =
					totwRatingService.calculateAverageTotwRating(playerSeasonStats);

				// Update or create season stat
				await prisma.playerSeasonStat.upsert({
					where: {
						seasonId_playerId: {
							seasonId,
							playerId,
						},
					},
					update: {
						avgTotwRating,
					},
					create: {
						seasonId,
						playerId,
						teamId:
							matchStats.find((stat) => stat.playerId === playerId)?.teamId ||
							"",
						avgTotwRating,
					},
				});
			}
		}

		res.json({
			success: true,
			message: "TOTW ratings calculated and updated successfully",
			data: {
				matchId,
				updatedStats,
			},
		});
	} catch (error) {
		console.error("Error calculating TOTW ratings:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

/**
 * Get TOTW team for a specific match or week
 */
router.get("/totw/:matchId", async (req, res) => {
	try {
		const { matchId } = req.params;

		// Get all player match stats for this match
		const matchStats = await prisma.playerMatchStat.findMany({
			where: { matchId },
			include: {
				player: {
					select: {
						id: true,
						position: true,
						gamertag: true,
						realName: true,
					},
					team: {
						select: {
							name: true,
							logoUrl: true,
						},
					},
				},
			},
		});

		if (matchStats.length === 0) {
			return res.status(404).json({
				success: false,
				error: {
					message: "No player stats found for this match",
				},
			});
		}

		// Get TOTW team
		const totwTeam = totwRatingService.getTotwTeam(matchStats);

		res.json({
			success: true,
			data: {
				matchId,
				totwTeam,
			},
		});
	} catch (error) {
		console.error("Error fetching TOTW team:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

module.exports = router;
