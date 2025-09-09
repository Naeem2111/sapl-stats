const express = require("express");
const router = express.Router();
const { prisma } = require("../database/prisma");
const {
	authenticateToken,
	requireTeamAdmin,
	requireLeagueAdmin,
} = require("../middleware/auth");

// Get all matches with optional filtering
router.get("/", async (req, res) => {
	try {
		const { season, team, days, status, competitionType } = req.query;

		// Build filter object
		const where = {};

		if (season && season !== "all") {
			where.seasonId = season;
		}

		if (team && team !== "all") {
			where.OR = [{ homeTeamId: team }, { awayTeamId: team }];
		}

		if (days && days !== "all") {
			const daysAgo = new Date();
			daysAgo.setDate(daysAgo.getDate() - parseInt(days));
			where.date = {
				gte: daysAgo,
			};
		}

		if (status && status !== "all") {
			where.status = status;
		}

		if (competitionType && competitionType !== "all") {
			where.competitionType = competitionType;
		}

		// Get matches with team and season information
		const matches = await prisma.match.findMany({
			where,
			include: {
				homeTeam: {
					select: {
						id: true,
						name: true,
						logoUrl: true,
					},
				},
				awayTeam: {
					select: {
						id: true,
						name: true,
						logoUrl: true,
					},
				},
				season: {
					select: {
						id: true,
						name: true,
					},
				},
				playerMatchStats: {
					include: {
						player: {
							select: {
								id: true,
								gamertag: true,
								realName: true,
								position: true,
							},
						},
					},
				},
			},
			orderBy: {
				date: "desc",
			},
		});

		// Transform the data to include stats summary
		const transformedMatches = matches.map((match) => {
			const homeTeamStats = match.playerMatchStats.filter(
				(stat) => stat.teamId === match.homeTeamId
			);
			const awayTeamStats = match.playerMatchStats.filter(
				(stat) => stat.teamId === match.awayTeamId
			);

			return {
				...match,
				homeTeamStats: {
					totalGoals: homeTeamStats.reduce((sum, stat) => sum + stat.goals, 0),
					totalAssists: homeTeamStats.reduce(
						(sum, stat) => sum + stat.assists,
						0
					),
					playersWithStats: homeTeamStats.length,
					hasStats: homeTeamStats.length > 0,
				},
				awayTeamStats: {
					totalGoals: awayTeamStats.reduce((sum, stat) => sum + stat.goals, 0),
					totalAssists: awayTeamStats.reduce(
						(sum, stat) => sum + stat.assists,
						0
					),
					playersWithStats: awayTeamStats.length,
					hasStats: awayTeamStats.length > 0,
				},
				statsStatus:
					homeTeamStats.length > 0 && awayTeamStats.length > 0
						? "complete"
						: homeTeamStats.length > 0 || awayTeamStats.length > 0
						? "partial"
						: "pending",
			};
		});

		res.json({
			success: true,
			data: transformedMatches,
			count: transformedMatches.length,
		});
	} catch (error) {
		console.error("Error fetching matches:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Failed to fetch matches",
			},
		});
	}
});

// Get a specific match by ID
router.get("/:id", async (req, res) => {
	try {
		const { id } = req.params;

		const match = await prisma.match.findUnique({
			where: { id },
			include: {
				homeTeam: true,
				awayTeam: true,
				season: true,
			},
		});

		if (!match) {
			return res.status(404).json({
				success: false,
				error: {
					message: "Match not found",
				},
			});
		}

		res.json({
			success: true,
			data: match,
		});
	} catch (error) {
		console.error("Error fetching match:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Failed to fetch match",
			},
		});
	}
});

// Create a new match (Team Admin and above)
router.post("/", authenticateToken, requireTeamAdmin, async (req, res) => {
	try {
		const { seasonId, homeTeamId, awayTeamId, date, competitionType, status } =
			req.body;

		// Validate required fields
		if (!seasonId || !homeTeamId || !awayTeamId || !date) {
			return res.status(400).json({
				success: false,
				error: {
					message:
						"Missing required fields: seasonId, homeTeamId, awayTeamId, date",
				},
			});
		}

		// Check if teams exist
		const homeTeam = await prisma.team.findUnique({
			where: { id: homeTeamId },
		});
		const awayTeam = await prisma.team.findUnique({
			where: { id: awayTeamId },
		});

		if (!homeTeam || !awayTeam) {
			return res.status(400).json({
				success: false,
				error: {
					message: "One or both teams not found",
				},
			});
		}

		// Check if season exists
		const season = await prisma.season.findUnique({ where: { id: seasonId } });
		if (!season) {
			return res.status(400).json({
				success: false,
				error: {
					message: "Season not found",
				},
			});
		}

		const match = await prisma.match.create({
			data: {
				seasonId,
				homeTeamId,
				awayTeamId,
				date: new Date(date),
				competitionType: competitionType || "LEAGUE",
				status: status || "SCHEDULED",
			},
			include: {
				homeTeam: {
					select: {
						id: true,
						name: true,
						logoUrl: true,
					},
				},
				awayTeam: {
					select: {
						id: true,
						name: true,
						logoUrl: true,
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

		res.status(201).json({
			success: true,
			data: match,
			message: "Match created successfully",
		});
	} catch (error) {
		console.error("Error creating match:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Failed to create match",
			},
		});
	}
});

// Update match scores and status (Team Admin and above)
router.put(
	"/:id/scores",
	authenticateToken,
	requireTeamAdmin,
	async (req, res) => {
		try {
			const { id } = req.params;
			const { homeScore, awayScore, status } = req.body;

			console.log("Updating match scores:", {
				id,
				homeScore,
				awayScore,
				status,
				homeScoreType: typeof homeScore,
				awayScoreType: typeof awayScore,
			});

			// Validate scores
			if (homeScore === undefined || awayScore === undefined) {
				return res.status(400).json({
					success: false,
					error: { message: "Home score and away score are required" },
				});
			}

			// Prepare update data
			const updateData = {
				homeScore: parseInt(homeScore),
				awayScore: parseInt(awayScore),
				status: status || "COMPLETED", // Use provided status or default to COMPLETED
			};

			// Set extra time and penalty results based on status
			if (status === "EXTRA_TIME") {
				const homeScoreNum = parseInt(homeScore);
				const awayScoreNum = parseInt(awayScore);
				if (homeScoreNum > awayScoreNum) {
					updateData.extraTime = "HOME_WIN";
				} else if (awayScoreNum > homeScoreNum) {
					updateData.extraTime = "AWAY_WIN";
				} else {
					updateData.extraTime = "DRAW";
				}
			} else if (status === "PENALTIES") {
				const homeScoreNum = parseInt(homeScore);
				const awayScoreNum = parseInt(awayScore);
				if (homeScoreNum > awayScoreNum) {
					updateData.penalties = "HOME_WIN";
				} else {
					updateData.penalties = "AWAY_WIN";
				}
			}

			// Update match
			const updatedMatch = await prisma.match.update({
				where: { id },
				data: updateData,
				include: {
					homeTeam: {
						select: {
							id: true,
							name: true,
							logoUrl: true,
						},
					},
					awayTeam: {
						select: {
							id: true,
							name: true,
							logoUrl: true,
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

			console.log("Match updated successfully:", {
				id: updatedMatch.id,
				homeScore: updatedMatch.homeScore,
				awayScore: updatedMatch.awayScore,
				status: updatedMatch.status,
			});

			res.json({
				success: true,
				data: updatedMatch,
				message: "Match scores updated successfully",
			});
		} catch (error) {
			console.error("Error updating match scores:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Failed to update match scores",
				},
			});
		}
	}
);

router.put("/:id", authenticateToken, requireTeamAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const {
			homeLineup,
			awayLineup,
			homeStats,
			awayStats,
			homeFormation,
			awayFormation,
			homeScore,
			awayScore,
			status,
		} = req.body;

		// Check if match exists
		const existingMatch = await prisma.match.findUnique({
			where: { id },
			include: {
				homeTeam: {
					include: {
						players: true,
					},
				},
				awayTeam: {
					include: {
						players: true,
					},
				},
			},
		});

		if (!existingMatch) {
			return res.status(404).json({
				success: false,
				error: {
					message: "Match not found",
				},
			});
		}

		// Update match basic info
		const matchUpdateData = {};
		if (homeScore !== undefined) matchUpdateData.homeScore = homeScore;
		if (awayScore !== undefined) matchUpdateData.awayScore = awayScore;
		if (status) matchUpdateData.status = status;
		if (homeFormation) matchUpdateData.homeFormation = homeFormation;
		if (awayFormation) matchUpdateData.awayFormation = awayFormation;

		// Update match
		const updatedMatch = await prisma.match.update({
			where: { id },
			data: matchUpdateData,
			include: {
				homeTeam: {
					select: {
						id: true,
						name: true,
						logoUrl: true,
					},
				},
				awayTeam: {
					select: {
						id: true,
						name: true,
						logoUrl: true,
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

		// Process player stats if provided
		if (homeStats || awayStats) {
			// Delete existing stats for this match
			await prisma.playerMatchStat.deleteMany({
				where: { matchId: id },
			});

			// Create new stats
			const statsToCreate = [];

			// Process home team stats
			if (homeStats) {
				for (const [playerId, stats] of Object.entries(homeStats)) {
					statsToCreate.push({
						matchId: id,
						playerId,
						teamId: existingMatch.homeTeamId,
						...stats,
					});
				}
			}

			// Process away team stats
			if (awayStats) {
				for (const [playerId, stats] of Object.entries(awayStats)) {
					statsToCreate.push({
						matchId: id,
						playerId,
						teamId: existingMatch.awayTeamId,
						...stats,
					});
				}
			}

			// Create all stats in batch
			if (statsToCreate.length > 0) {
				await prisma.playerMatchStat.createMany({
					data: statsToCreate,
				});
			}
		}

		res.json({
			success: true,
			data: updatedMatch,
			message: "Match updated successfully",
		});
	} catch (error) {
		console.error("Error updating match:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Failed to update match",
			},
		});
	}
});

// Delete a match (League Admin and above)
router.delete(
	"/:id",
	authenticateToken,
	requireLeagueAdmin,
	async (req, res) => {
		try {
			const { id } = req.params;

			// Check if match exists
			const match = await prisma.match.findUnique({ where: { id } });
			if (!match) {
				return res.status(404).json({
					success: false,
					error: {
						message: "Match not found",
					},
				});
			}

			// Delete the match (cascade will handle related stats)
			await prisma.match.delete({ where: { id } });

			res.json({
				success: true,
				message: "Match deleted successfully",
			});
		} catch (error) {
			console.error("Error deleting match:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Failed to delete match",
				},
			});
		}
	}
);

// Get player stats for a specific match
router.get("/:id/player-stats", async (req, res) => {
	try {
		const { id } = req.params;

		// Check if match exists
		const match = await prisma.match.findUnique({ where: { id } });
		if (!match) {
			return res.status(404).json({
				success: false,
				error: {
					message: "Match not found",
				},
			});
		}

		// Get player match stats for this match
		const playerStats = await prisma.playerMatchStat.findMany({
			where: { matchId: id },
			include: {
				player: {
					select: {
						id: true,
						gamertag: true,
						realName: true,
						position: true,
					},
				},
				team: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: [{ player: { position: "asc" } }, { rating: "desc" }],
		});

		res.json({
			success: true,
			data: playerStats,
		});
	} catch (error) {
		console.error("Error fetching player stats:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Failed to fetch player stats",
			},
		});
	}
});

module.exports = router;
