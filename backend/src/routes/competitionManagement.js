const express = require("express");
const { prisma } = require("../database/prisma");
const {
	authenticateToken,
	requireCompetitionAdmin,
	requireLeagueAdmin,
} = require("../middleware/auth");

const router = express.Router();

// Get all competitions for management
router.get(
	"/competitions",
	authenticateToken,
	requireLeagueAdmin,
	async (req, res) => {
		try {
			// First get the active season
			const activeSeason = await prisma.season.findFirst({
				where: {
					isActive: true,
				},
			});

			if (!activeSeason) {
				return res.status(404).json({
					success: false,
					error: {
						message:
							"No active season found. Please set an active season first.",
					},
				});
			}

			const competitions = await prisma.competition.findMany({
				where: {
					seasonId: activeSeason.id,
				},
				include: {
					season: {
						select: {
							id: true,
							name: true,
						},
					},
					teams: {
						select: {
							id: true,
							name: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			});

			res.json({
				success: true,
				data: competitions,
			});
		} catch (error) {
			console.error("Error fetching competitions:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Get fixtures for a specific competition
router.get(
	"/competitions/:competitionId/fixtures",
	authenticateToken,
	requireLeagueAdmin,
	async (req, res) => {
		try {
			const { competitionId } = req.params;

			const fixtures = await prisma.match.findMany({
				where: {
					competitionId: competitionId,
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
				},
				orderBy: {
					date: "asc",
				},
			});

			res.json({
				success: true,
				data: fixtures,
			});
		} catch (error) {
			console.error("Error fetching fixtures:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Lock stats for a specific fixture
router.post(
	"/fixtures/:fixtureId/lock-stats",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const { fixtureId } = req.params;

			const fixture = await prisma.match.update({
				where: { id: fixtureId },
				data: { statsLocked: true },
			});

			res.json({
				success: true,
				message: "Fixture stats locked successfully",
				data: fixture,
			});
		} catch (error) {
			console.error("Error locking fixture stats:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Unlock stats for a specific fixture
router.post(
	"/fixtures/:fixtureId/unlock-stats",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const { fixtureId } = req.params;

			const fixture = await prisma.match.update({
				where: { id: fixtureId },
				data: { statsLocked: false },
			});

			res.json({
				success: true,
				message: "Fixture stats unlocked successfully",
				data: fixture,
			});
		} catch (error) {
			console.error("Error unlocking fixture stats:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Bulk actions on fixtures
router.post(
	"/competitions/bulk-action",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const { fixtureIds, action, newMatchTime } = req.body;

			if (
				!fixtureIds ||
				!Array.isArray(fixtureIds) ||
				fixtureIds.length === 0
			) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Please provide valid fixture IDs",
					},
				});
			}

			let result;

			switch (action) {
				case "lock-stats":
					result = await prisma.match.updateMany({
						where: { id: { in: fixtureIds } },
						data: { statsLocked: true },
					});
					break;

				case "unlock-stats":
					result = await prisma.match.updateMany({
						where: { id: { in: fixtureIds } },
						data: { statsLocked: false },
					});
					break;

				case "delete-results":
					// Delete match results and reset stats
					await prisma.$transaction(async (tx) => {
						// Delete match stats
						await tx.matchStat.deleteMany({
							where: { matchId: { in: fixtureIds } },
						});

						// Reset match scores and status
						await tx.match.updateMany({
							where: { id: { in: fixtureIds } },
							data: {
								homeScore: 0,
								awayScore: 0,
								status: "SCHEDULED",
								statsLocked: false,
							},
						});
					});
					result = { count: fixtureIds.length };
					break;

				case "update-time":
					if (!newMatchTime) {
						return res.status(400).json({
							success: false,
							error: {
								message: "New match time is required for update-time action",
							},
						});
					}
					result = await prisma.match.updateMany({
						where: { id: { in: fixtureIds } },
						data: { date: new Date(newMatchTime) },
					});
					break;

				default:
					return res.status(400).json({
						success: false,
						error: {
							message: "Invalid action specified",
						},
					});
			}

			res.json({
				success: true,
				message: `Successfully ${action} ${
					result.count || fixtureIds.length
				} fixtures`,
				data: result,
			});
		} catch (error) {
			console.error("Error performing bulk action:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// League table adjustments
router.post(
	"/competitions/league-adjustment",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const { teamId, type, value, reason } = req.body;

			if (!teamId || !type || value === undefined || !reason) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Team ID, type, value, and reason are required",
					},
				});
			}

			// Validate adjustment type
			const validTypes = [
				"points",
				"goalDifference",
				"goalsFor",
				"goalsAgainst",
			];
			if (!validTypes.includes(type)) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Invalid adjustment type",
					},
				});
			}

			// Check if team exists
			const team = await prisma.team.findUnique({
				where: { id: teamId },
			});

			if (!team) {
				return res.status(404).json({
					success: false,
					error: {
						message: "Team not found",
					},
				});
			}

			// Create league adjustment record
			const adjustment = await prisma.leagueAdjustment.create({
				data: {
					teamId,
					type,
					value,
					reason,
					adjustedBy: req.user.id,
					adjustedAt: new Date(),
				},
			});

			// Update team's league table data
			// Note: This would need to be implemented based on your league table structure
			// For now, we'll just record the adjustment

			res.json({
				success: true,
				message: "League adjustment applied successfully",
				data: adjustment,
			});
		} catch (error) {
			console.error("Error applying league adjustment:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Get league adjustments history
router.get(
	"/competitions/league-adjustments",
	authenticateToken,
	async (req, res) => {
		try {
			const adjustments = await prisma.leagueAdjustment.findMany({
				include: {
					team: {
						select: {
							id: true,
							name: true,
						},
					},
					adjustedByUser: {
						select: {
							id: true,
							username: true,
						},
					},
				},
				orderBy: {
					adjustedAt: "desc",
				},
			});

			res.json({
				success: true,
				data: adjustments,
			});
		} catch (error) {
			console.error("Error fetching league adjustments:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Get teams for a specific competition
router.get(
	"/competitions/:competitionId/teams",
	authenticateToken,
	requireLeagueAdmin,
	async (req, res) => {
		try {
			const { competitionId } = req.params;

			const teams = await prisma.team.findMany({
				where: {
					competitions: {
						some: {
							id: competitionId,
						},
					},
				},
				select: {
					id: true,
					name: true,
					logoUrl: true,
				},
			});

			res.json({
				success: true,
				data: teams,
			});
		} catch (error) {
			console.error("Error fetching competition teams:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Remove team from competition (with bulk delete of results)
router.delete(
	"/competitions/:competitionId/teams/:teamId",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const { competitionId, teamId } = req.params;

			await prisma.$transaction(async (tx) => {
				// Remove team from competition
				await tx.competition.update({
					where: { id: competitionId },
					data: {
						teams: {
							disconnect: { id: teamId },
						},
					},
				});

				// Get all matches involving this team in this competition
				const teamMatches = await tx.match.findMany({
					where: {
						competitionId: competitionId,
						OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
					},
					select: { id: true },
				});

				const matchIds = teamMatches.map((match) => match.id);

				// Delete all match stats for these matches
				await tx.matchStat.deleteMany({
					where: { matchId: { in: matchIds } },
				});

				// Delete the matches
				await tx.match.deleteMany({
					where: { id: { in: matchIds } },
				});

				// Reset player season stats for this team in this competition's season
				const competition = await tx.competition.findUnique({
					where: { id: competitionId },
					include: { season: true },
				});

				if (competition?.season) {
					await tx.playerSeasonStat.updateMany({
						where: {
							teamId: teamId,
							seasonId: competition.season.id,
						},
						data: {
							matchesPlayed: 0,
							totalGoals: 0,
							totalAssists: 0,
							totalShots: 0,
							totalPasses: 0,
							totalTackles: 0,
							totalInterceptions: 0,
							totalSaves: 0,
							cleanSheets: 0,
							avgRating: 0,
							avgPassAccuracy: 0,
						},
					});
				}
			});

			res.json({
				success: true,
				message: "Team removed from competition and all related data deleted",
			});
		} catch (error) {
			console.error("Error removing team from competition:", error);
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
