const express = require("express");
const { prisma } = require("../database/prisma");
const {
	authenticateToken,
	requireCompetitionAdmin,
	requireLeagueAdmin,
} = require("../middleware/auth");
const leagueService = require("../services/leagueService");

const router = express.Router();

// Get all leagues (COMPETITION_ADMIN, LEAGUE_ADMIN only)
router.get("/", authenticateToken, requireLeagueAdmin, async (req, res) => {
	try {
		const { season, active } = req.query;

		const where = {};
		if (season && season !== "all") {
			where.matches = {
				some: {
					seasonId: season,
				},
			};
		}
		if (active !== undefined) {
			where.isActive = active === "true";
		}

		const leagues = await prisma.league.findMany({
			where,
			include: {
				matches: {
					select: {
						id: true,
						status: true,
						homeScore: true,
						awayScore: true,
						date: true,
					},
				},
				teamSeasonAggregates: {
					include: {
						team: {
							select: {
								id: true,
								name: true,
								logoUrl: true,
							},
						},
					},
					orderBy: {
						position: "asc",
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		// Add computed fields
		const leaguesWithStats = leagues.map((league) => {
			const totalMatches = league.matches.length;
			const completedMatches = league.matches.filter(
				(m) => m.status === "COMPLETED"
			).length;
			const pendingMatches = totalMatches - completedMatches;

			return {
				...league,
				statistics: {
					totalMatches,
					completedMatches,
					pendingMatches,
					teamsCount: league.teamSeasonAggregates.length,
					progress:
						totalMatches > 0
							? Math.round((completedMatches / totalMatches) * 100)
							: 0,
				},
			};
		});

		res.json({
			success: true,
			data: leaguesWithStats,
		});
	} catch (error) {
		console.error("Error fetching leagues:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Get league by ID (COMPETITION_ADMIN, LEAGUE_ADMIN only)
router.get("/:id", authenticateToken, requireLeagueAdmin, async (req, res) => {
	try {
		const { id } = req.params;

		const league = await prisma.league.findUnique({
			where: { id },
			include: {
				matches: {
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
					},
					orderBy: {
						date: "asc",
					},
				},
				teamSeasonAggregates: {
					include: {
						team: {
							select: {
								id: true,
								name: true,
								logoUrl: true,
							},
						},
					},
					orderBy: {
						position: "asc",
					},
				},
			},
		});

		if (!league) {
			return res.status(404).json({
				success: false,
				error: {
					message: "League not found",
				},
			});
		}

		// Calculate detailed statistics
		const totalMatches = league.matches.length;
		const completedMatches = league.matches.filter(
			(m) => m.status === "COMPLETED"
		).length;
		const scheduledMatches = league.matches.filter(
			(m) => m.status === "SCHEDULED"
		).length;
		const inProgressMatches = league.matches.filter(
			(m) => m.status === "IN_PROGRESS"
		).length;

		const leagueStats = {
			...league,
			statistics: {
				totalMatches,
				completedMatches,
				scheduledMatches,
				inProgressMatches,
				teamsCount: league.teamSeasonAggregates.length,
				progress:
					totalMatches > 0
						? Math.round((completedMatches / totalMatches) * 100)
						: 0,
			},
		};

		res.json({
			success: true,
			data: leagueStats,
		});
	} catch (error) {
		console.error("Error fetching league:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Create new league (COMPETITION_ADMIN only)
router.post(
	"/",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const {
				name,
				description,
				seasonId,
				teamIds,
				startDate,
				endDate,
				leagueId,
				matchDuration,
				pointsForWin,
				pointsForDraw,
				pointsForLoss,
			} = req.body;

			if (!name || !seasonId || !teamIds || teamIds.length < 2) {
				return res.status(400).json({
					success: false,
					error: {
						message:
							"League name, season ID, and at least 2 teams are required",
					},
				});
			}

			// Validate dates
			const start = new Date(startDate);
			const end = new Date(endDate);

			if (isNaN(start.getTime()) || isNaN(end.getTime())) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Invalid date format",
					},
				});
			}

			if (start >= end) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Start date must be before end date",
					},
				});
			}

			const result = await leagueService.createLeague({
				name,
				description,
				seasonId,
				teamIds,
				startDate: start,
				endDate: end,
				leagueId,
				matchDuration,
				pointsForWin,
				pointsForDraw,
				pointsForLoss,
			});

			res.status(201).json({
				success: true,
				message: "League created successfully",
				data: result,
			});
		} catch (error) {
			console.error("Error creating league:", error);
			res.status(500).json({
				success: false,
				error: {
					message: error.message || "Internal server error",
				},
			});
		}
	}
);

// Update league (COMPETITION_ADMIN only)
router.put(
	"/:id",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const { id } = req.params;
			const { name, description, isActive } = req.body;

			// Check if league exists
			const existingLeague = await prisma.league.findUnique({
				where: { id },
			});

			if (!existingLeague) {
				return res.status(404).json({
					success: false,
					error: {
						message: "League not found",
					},
				});
			}

			const updatedLeague = await prisma.league.update({
				where: { id },
				data: {
					name: name || existingLeague.name,
					description:
						description !== undefined
							? description
							: existingLeague.description,
					isActive: isActive !== undefined ? isActive : existingLeague.isActive,
				},
			});

			res.json({
				success: true,
				message: "League updated successfully",
				data: updatedLeague,
			});
		} catch (error) {
			console.error("Error updating league:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Delete league (COMPETITION_ADMIN only)
router.delete(
	"/:id",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const { id } = req.params;

			// Check if league exists
			const existingLeague = await prisma.league.findUnique({
				where: { id },
				include: {
					matches: true,
					teamSeasonAggregates: true,
				},
			});

			if (!existingLeague) {
				return res.status(404).json({
					success: false,
					error: {
						message: "League not found",
					},
				});
			}

			// Check if league has matches
			if (existingLeague.matches.length > 0) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Cannot delete league with matches",
					},
				});
			}

			await prisma.league.delete({
				where: { id },
			});

			res.json({
				success: true,
				message: "League deleted successfully",
			});
		} catch (error) {
			console.error("Error deleting league:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Get league standings (COMPETITION_ADMIN, LEAGUE_ADMIN only)
router.get(
	"/:id/standings",
	authenticateToken,
	requireLeagueAdmin,
	async (req, res) => {
		try {
			const { id: leagueId } = req.params;
			const { season } = req.query;

			// Get season ID
			let seasonId;
			if (season && season !== "all") {
				seasonId = season;
			} else {
				// Get the most recent season for this league
				const latestMatch = await prisma.match.findFirst({
					where: { leagueId },
					orderBy: { date: "desc" },
					select: { seasonId: true },
				});

				if (!latestMatch) {
					return res.status(404).json({
						success: false,
						error: {
							message: "No matches found for this league",
						},
					});
				}

				seasonId = latestMatch.seasonId;
			}

			const standings = await leagueService.getLeagueStandings(
				leagueId,
				seasonId
			);

			res.json({
				success: true,
				data: {
					leagueId,
					seasonId,
					standings,
				},
			});
		} catch (error) {
			console.error("Error fetching league standings:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Get league fixtures (COMPETITION_ADMIN, LEAGUE_ADMIN only)
router.get(
	"/:id/fixtures",
	authenticateToken,
	requireLeagueAdmin,
	async (req, res) => {
		try {
			const { id: leagueId } = req.params;
			const { season } = req.query;

			// Get season ID
			let seasonId;
			if (season && season !== "all") {
				seasonId = season;
			} else {
				// Get the most recent season for this league
				const latestMatch = await prisma.match.findFirst({
					where: { leagueId },
					orderBy: { date: "desc" },
					select: { seasonId: true },
				});

				if (!latestMatch) {
					return res.status(404).json({
						success: false,
						error: {
							message: "No matches found for this league",
						},
					});
				}

				seasonId = latestMatch.seasonId;
			}

			const fixtures = await leagueService.getLeagueFixtures(
				leagueId,
				seasonId
			);

			res.json({
				success: true,
				data: {
					leagueId,
					seasonId,
					fixtures,
				},
			});
		} catch (error) {
			console.error("Error fetching league fixtures:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Update league standings (COMPETITION_ADMIN, LEAGUE_ADMIN only)
router.post(
	"/:id/update-standings",
	authenticateToken,
	requireLeagueAdmin,
	async (req, res) => {
		try {
			const { id: leagueId } = req.params;
			const { season } = req.body;

			// Get season ID
			let seasonId;
			if (season && season !== "all") {
				seasonId = season;
			} else {
				// Get the most recent season for this league
				const latestMatch = await prisma.match.findFirst({
					where: { leagueId },
					orderBy: { date: "desc" },
					select: { seasonId: true },
				});

				if (!latestMatch) {
					return res.status(404).json({
						success: false,
						error: {
							message: "No matches found for this league",
						},
					});
				}

				seasonId = latestMatch.seasonId;
			}

			const result = await leagueService.updateLeagueStandings(
				leagueId,
				seasonId
			);

			res.json({
				success: true,
				message: "League standings updated successfully",
				data: result,
			});
		} catch (error) {
			console.error("Error updating league standings:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

module.exports = router;

