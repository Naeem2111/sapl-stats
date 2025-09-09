const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();

const prisma = new PrismaClient();

/**
 * Enhanced Player Statistics API
 *
 * Features:
 * - League-based filtering
 * - Date range filtering for team of the week calculations
 * - Position and team filtering
 * - Comprehensive statistics aggregation
 * - Top performers per league
 */

/**
 * GET /api/stats/leagues
 * Get all available leagues for filtering
 */
router.get("/leagues", async (req, res) => {
	try {
		const leagues = await prisma.league.findMany({
			where: { isActive: true },
			select: {
				id: true,
				name: true,
				description: true,
				saplData: true,
				_count: {
					select: { teams: true },
				},
			},
			orderBy: [{ name: "asc" }],
		});

		res.json({
			success: true,
			data: leagues.map((league) => ({
				...league,
				teamCount: league._count.teams,
			})),
		});
	} catch (error) {
		console.error("Error fetching leagues:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch leagues",
		});
	}
});

/**
 * GET /api/stats/teams
 * Get teams filtered by league
 */
router.get("/teams", async (req, res) => {
	try {
		const { leagueId } = req.query;

		const whereClause = {};
		if (leagueId && leagueId !== "all") {
			whereClause.leagueId = leagueId;
		}

		const teams = await prisma.team.findMany({
			where: whereClause,
			select: {
				id: true,
				name: true,
				logoUrl: true,
				league: {
					select: {
						id: true,
						name: true,
					},
				},
				_count: {
					select: { players: true },
				},
			},
			orderBy: { name: "asc" },
		});

		res.json({
			success: true,
			data: teams.map((team) => ({
				...team,
				playerCount: team._count.players,
			})),
		});
	} catch (error) {
		console.error("Error fetching teams:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch teams",
		});
	}
});

/**
 * GET /api/stats/positions
 * Get all available player positions
 */
router.get("/positions", async (req, res) => {
	try {
		const positions = [
			"All Positions",
			"GK",
			"CB",
			"LB",
			"RB",
			"CDM",
			"CM",
			"CAM",
			"LM",
			"RM",
			"LW",
			"RW",
			"ST",
			"CF",
			"UNKNOWN",
		];

		res.json({
			success: true,
			data: positions,
		});
	} catch (error) {
		console.error("Error fetching positions:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch positions",
		});
	}
});

/**
 * GET /api/stats/players
 * Get player statistics with comprehensive filtering
 */
router.get("/players", async (req, res) => {
	try {
		const {
			leagueId = "all",
			teamId = "all",
			position = "All Positions",
			statType = "goals",
			startDate,
			endDate,
			limit = 50,
			page = 1,
		} = req.query;

		// Build where clause for filtering
		const whereClause = {};

		// League filtering
		if (leagueId && leagueId !== "all") {
			whereClause.team = {
				leagueId: leagueId,
			};
		}

		// Team filtering
		if (teamId && teamId !== "all") {
			whereClause.teamId = teamId;
		}

		// Position filtering
		if (position && position !== "All Positions") {
			whereClause.position = position;
		}

		// Date filtering for match-based stats
		let dateFilter = {};
		if (startDate && endDate) {
			dateFilter = {
				gte: new Date(startDate),
				lte: new Date(endDate),
			};
		}

		// Calculate offset for pagination
		const offset = (parseInt(page) - 1) * parseInt(limit);

		// Get players with basic info
		const players = await prisma.player.findMany({
			where: whereClause,
			include: {
				user: {
					select: {
						username: true,
						email: true,
						saplId: true,
					},
				},
				team: {
					select: {
						id: true,
						name: true,
						league: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
			skip: offset,
			take: parseInt(limit),
			orderBy: { gamertag: "asc" },
		});

		// Get total count for pagination
		const totalPlayers = await prisma.player.count({
			where: whereClause,
		});

		// Get season stats for all players
		const seasonStats = await prisma.playerSeasonStat.findMany({
			where: {
				playerId: { in: players.map((p) => p.id) },
			},
			include: {
				season: {
					select: {
						name: true,
					},
				},
			},
		});

		// Aggregate stats per player
		const playersWithStats = players.map((player) => {
			// Get season stats for this player
			const playerSeasonStats = seasonStats.filter(
				(stat) => stat.playerId === player.id
			);

			// Use season stats if available, otherwise default to 0
			const latestSeasonStats = playerSeasonStats[0] || {};

			// Calculate aggregated stats from season data
			const stats = {
				goals: latestSeasonStats.totalGoals || 0,
				assists: latestSeasonStats.totalAssists || 0,
				shots: latestSeasonStats.totalShots || 0,
				passes: latestSeasonStats.totalPasses || 0,
				passAccuracy: latestSeasonStats.avgPassAccuracy || 0,
				tackles: latestSeasonStats.totalTackles || 0,
				interceptions: latestSeasonStats.totalInterceptions || 0,
				saves: latestSeasonStats.totalSaves || 0,
				cleanSheets: latestSeasonStats.cleanSheets || 0,
				rating: latestSeasonStats.avgRating || 0,
				minutesPlayed: 0, // Not tracked in current schema
				yellowCards: latestSeasonStats.yellowCards || 0,
				redCards: latestSeasonStats.redCards || 0,
				matchesPlayed: latestSeasonStats.matchesPlayed || 0,
			};

			return {
				...player,
				stats,
				// Calculate the requested stat value for sorting
				statValue: stats[statType] || 0,
			};
		});

		// Sort by the requested stat type
		playersWithStats.sort((a, b) => b.statValue - a.statValue);

		res.json({
			success: true,
			data: {
				players: playersWithStats,
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					total: totalPlayers,
					totalPages: Math.ceil(totalPlayers / parseInt(limit)),
				},
			},
		});
	} catch (error) {
		console.error("Error fetching player statistics:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch player statistics",
		});
	}
});

/**
 * GET /api/stats/summary
 * Get summary statistics for the dashboard
 */
router.get("/summary", async (req, res) => {
	try {
		const {
			leagueId = "all",
			teamId = "all",
			position = "All Positions",
			startDate,
			endDate,
		} = req.query;

		// Build where clause
		const whereClause = {
			user: {
				role: "PLAYER",
			},
		};

		if (leagueId && leagueId !== "all") {
			whereClause.team = {
				leagueId: leagueId,
			};
		}

		if (teamId && teamId !== "all") {
			whereClause.teamId = teamId;
		}

		if (position && position !== "All Positions") {
			whereClause.position = position;
		}

		// Get total players
		const totalPlayers = await prisma.player.count({
			where: whereClause,
		});

		// Get active players (players with recent match activity)
		const activePlayers = await prisma.player.count({
			where: {
				...whereClause,
				playerMatchStats: {
					some: {
						match: {
							date: {
								gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
							},
						},
					},
				},
			},
		});

		// Get top performer
		let topPerformer = null;
		if (totalPlayers > 0) {
			topPerformer = await prisma.player.findFirst({
				where: whereClause,
				include: {
					user: { select: { username: true } },
					team: { select: { name: true } },
				},
				orderBy: {
					playerMatchStats: {
						_count: "desc",
					},
				},
			});
		}

		// Calculate average rating
		const avgRatingResult = await prisma.playerMatchStat.aggregate({
			where: {
				player: whereClause,
				...(startDate && endDate
					? {
							match: {
								date: {
									gte: new Date(startDate),
									lte: new Date(endDate),
								},
							},
					  }
					: {}),
			},
			_avg: {
				rating: true,
			},
		});

		const averageRating = avgRatingResult._avg.rating || 0;

		res.json({
			success: true,
			data: {
				totalPlayers,
				topPerformer: topPerformer
					? {
							name: topPerformer.user.username,
							team: topPerformer.team.name,
							gamertag: topPerformer.gamertag,
					  }
					: "N/A",
				averageRating: parseFloat(averageRating.toFixed(1)),
				activePlayers,
			},
		});
	} catch (error) {
		console.error("Error fetching summary statistics:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch summary statistics",
		});
	}
});

/**
 * GET /api/stats/top-performers
 * Get top performers for team of the week calculations
 */
router.get("/top-performers", async (req, res) => {
	try {
		const {
			leagueId = "all",
			statType = "goals",
			startDate,
			endDate,
			limit = 10,
		} = req.query;

		// Build where clause
		const whereClause = {
			user: {
				role: "PLAYER",
			},
		};

		if (leagueId && leagueId !== "all") {
			whereClause.team = {
				leagueId: leagueId,
			};
		}

		// Date filtering
		let dateFilter = {};
		if (startDate && endDate) {
			dateFilter = {
				gte: new Date(startDate),
				lte: new Date(endDate),
			};
		}

		// Get player stats for the date range
		const playerStats = await prisma.playerMatchStat.findMany({
			where: {
				player: whereClause,
				...(startDate && endDate
					? {
							match: {
								date: dateFilter,
							},
					  }
					: {}),
			},
			include: {
				player: {
					include: {
						user: { select: { username: true } },
						team: {
							select: {
								name: true,
								league: { select: { name: true } },
							},
						},
					},
				},
				match: {
					select: {
						date: true,
						homeTeam: { select: { name: true } },
						awayTeam: { select: { name: true } },
					},
				},
			},
		});

		// Aggregate stats per player
		const playerAggregates = {};
		playerStats.forEach((stat) => {
			const playerId = stat.playerId;
			if (!playerAggregates[playerId]) {
				playerAggregates[playerId] = {
					player: stat.player,
					stats: {
						goals: 0,
						assists: 0,
						shots: 0,
						passes: 0,
						passAccuracy: 0,
						tackles: 0,
						interceptions: 0,
						saves: 0,
						cleanSheets: 0,
						rating: 0,
						minutesPlayed: 0,
						yellowCards: 0,
						redCards: 0,
						matchesPlayed: 0,
					},
					matchCount: 0,
				};
			}

			const aggregate = playerAggregates[playerId];
			aggregate.stats.goals += stat.goals;
			aggregate.stats.assists += stat.assists;
			aggregate.stats.shots += stat.shots;
			aggregate.stats.passes += stat.passes;
			aggregate.stats.tackles += stat.tackles;
			aggregate.stats.interceptions += stat.interceptions;
			aggregate.stats.saves += stat.saves;
			aggregate.stats.cleanSheets += stat.cleanSheet ? 1 : 0;
			aggregate.stats.rating += stat.rating;
			aggregate.stats.minutesPlayed += stat.minutesPlayed;
			aggregate.stats.yellowCards += stat.yellowCards;
			aggregate.stats.redCards += stat.redCards;
			aggregate.matchCount++;
		});

		// Calculate averages and convert to array
		const topPerformers = Object.values(playerAggregates).map((aggregate) => {
			const matchCount = aggregate.matchCount;
			return {
				...aggregate,
				stats: {
					...aggregate.stats,
					passAccuracy:
						matchCount > 0 ? aggregate.stats.passAccuracy / matchCount : 0,
					rating: matchCount > 0 ? aggregate.stats.rating / matchCount : 0,
					matchesPlayed: matchCount,
				},
				statValue: aggregate.stats[statType] || 0,
			};
		});

		// Sort by the requested stat type and limit results
		topPerformers.sort((a, b) => b.statValue - a.statValue);
		const limitedPerformers = topPerformers.slice(0, parseInt(limit));

		res.json({
			success: true,
			data: {
				topPerformers: limitedPerformers,
				statType,
				dateRange: startDate && endDate ? { startDate, endDate } : null,
				leagueId: leagueId === "all" ? null : leagueId,
			},
		});
	} catch (error) {
		console.error("Error fetching top performers:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch top performers",
		});
	}
});

/**
 * GET /api/stats/team-of-the-week
 * Get team of the week based on date range and league
 */
router.get("/team-of-the-week", async (req, res) => {
	try {
		const {
			leagueId = "all",
			startDate,
			endDate,
			formation = "4-4-2", // Default formation
		} = req.query;

		if (!startDate || !endDate) {
			return res.status(400).json({
				success: false,
				error: "Start date and end date are required for team of the week",
			});
		}

		// Parse formation (e.g., "4-4-2" -> [4, 4, 2])
		const formationParts = formation.split("-").map(Number);
		const [defenders, midfielders, forwards] = formationParts;

		// Build where clause
		const whereClause = {
			user: {
				role: "PLAYER",
			},
		};

		if (leagueId && leagueId !== "all") {
			whereClause.team = {
				leagueId: leagueId,
			};
		}

		// Get player stats for the date range
		const playerStats = await prisma.playerMatchStat.findMany({
			where: {
				player: whereClause,
				match: {
					date: {
						gte: new Date(startDate),
						lte: new Date(endDate),
					},
				},
			},
			include: {
				player: {
					include: {
						user: { select: { username: true } },
						team: {
							select: {
								name: true,
								league: { select: { name: true } },
							},
						},
					},
				},
			},
		});

		// Aggregate stats per player
		const playerAggregates = {};
		playerStats.forEach((stat) => {
			const playerId = stat.playerId;
			if (!playerAggregates[playerId]) {
				playerAggregates[playerId] = {
					player: stat.player,
					stats: {
						goals: 0,
						assists: 0,
						shots: 0,
						passes: 0,
						passAccuracy: 0,
						tackles: 0,
						interceptions: 0,
						saves: 0,
						cleanSheets: 0,
						rating: 0,
						minutesPlayed: 0,
						yellowCards: 0,
						redCards: 0,
						matchesPlayed: 0,
					},
					matchCount: 0,
				};
			}

			const aggregate = playerAggregates[playerId];
			aggregate.stats.goals += stat.goals;
			aggregate.stats.assists += stat.assists;
			aggregate.stats.shots += stat.shots;
			aggregate.stats.passes += stat.passes;
			aggregate.stats.tackles += stat.tackles;
			aggregate.stats.interceptions += stat.interceptions;
			aggregate.stats.saves += stat.saves;
			aggregate.stats.cleanSheets += stat.cleanSheet ? 1 : 0;
			aggregate.stats.rating += stat.rating;
			aggregate.stats.minutesPlayed += stat.minutesPlayed;
			aggregate.stats.yellowCards += stat.yellowCards;
			aggregate.stats.redCards += stat.redCards;
			aggregate.matchCount++;
		});

		// Calculate averages and convert to array
		const players = Object.values(playerAggregates).map((aggregate) => {
			const matchCount = aggregate.matchCount;
			return {
				...aggregate,
				stats: {
					...aggregate.stats,
					passAccuracy:
						matchCount > 0 ? aggregate.stats.passAccuracy / matchCount : 0,
					rating: matchCount > 0 ? aggregate.stats.rating / matchCount : 0,
					matchesPlayed: matchCount,
				},
			};
		});

		// Select team of the week based on formation
		const teamOfTheWeek = {
			goalkeeper: null,
			defenders: [],
			midfielders: [],
			forwards: [],
			substitutes: [],
			formation: formation,
			dateRange: { startDate, endDate },
			leagueId: leagueId === "all" ? null : leagueId,
		};

		// Select goalkeeper (best rating among GK players)
		const goalkeepers = players.filter((p) => p.player.position === "GK");
		if (goalkeepers.length > 0) {
			goalkeepers.sort((a, b) => b.stats.rating - a.stats.rating);
			teamOfTheWeek.goalkeeper = goalkeepers[0];
		}

		// Select defenders (best rating among CB, LB, RB players)
		const defenderPlayers = players.filter((p) =>
			["CB", "LB", "RB"].includes(p.player.position)
		);
		if (defenderPlayers.length > 0) {
			defenderPlayers.sort((a, b) => b.stats.rating - a.stats.rating);
			teamOfTheWeek.defenders = defenderPlayers.slice(0, defenders);
		}

		// Select midfielders (best rating among CDM, CM, CAM, LM, RM players)
		const midfielderPlayers = players.filter((p) =>
			["CDM", "CM", "CAM", "LM", "RM"].includes(p.player.position)
		);
		if (midfielderPlayers.length > 0) {
			midfielderPlayers.sort((a, b) => b.stats.rating - a.stats.rating);
			teamOfTheWeek.midfielders = midfielderPlayers.slice(0, midfielders);
		}

		// Select forwards (best rating among LW, RW, ST, CF players)
		const forwardPlayers = players.filter((p) =>
			["LW", "RW", "ST", "CF"].includes(p.player.position)
		);
		if (forwardPlayers.length > 0) {
			forwardPlayers.sort((a, b) => b.stats.rating - a.stats.rating);
			teamOfTheWeek.forwards = forwardPlayers.slice(0, forwards);
		}

		// Select substitutes (next best players regardless of position)
		const remainingPlayers = players
			.filter(
				(p) =>
					!teamOfTheWeek.goalkeeper ||
					p.player.id !== teamOfTheWeek.goalkeeper.player.id
			)
			.filter(
				(p) => !teamOfTheWeek.defenders.some((d) => d.player.id === p.player.id)
			)
			.filter(
				(p) =>
					!teamOfTheWeek.midfielders.some((m) => m.player.id === p.player.id)
			)
			.filter(
				(p) => !teamOfTheWeek.forwards.some((f) => f.player.id === p.player.id)
			);

		if (remainingPlayers.length > 0) {
			remainingPlayers.sort((a, b) => b.stats.rating - a.stats.rating);
			teamOfTheWeek.substitutes = remainingPlayers.slice(0, 7); // 7 substitutes
		}

		res.json({
			success: true,
			data: teamOfTheWeek,
		});
	} catch (error) {
		console.error("Error generating team of the week:", error);
		res.status(500).json({
			success: false,
			error: "Failed to generate team of the week",
		});
	}
});

module.exports = router;
