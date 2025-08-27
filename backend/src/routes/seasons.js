const express = require("express");
const { prisma } = require("../database/prisma");
const {
	authenticateToken,
	requireCompetitionAdmin,
	requireLeagueAdmin,
} = require("../middleware/auth");

const router = express.Router();

// Get all seasons (public access)
router.get("/", async (req, res) => {
	try {
		const seasons = await prisma.season.findMany({
			include: {
				matches: {
					select: {
						id: true,
						status: true,
					},
				},
				playerSeasonStats: {
					select: {
						id: true,
					},
				},
			},
			orderBy: {
				startDate: "desc",
			},
		});

		// Add computed fields
		const seasonsWithStats = seasons.map((season) => ({
			...season,
			totalMatches: season.matches.length,
			completedMatches: season.matches.filter((m) => m.status === "COMPLETED")
				.length,
			activePlayers: season.playerSeasonStats.length,
		}));

		res.json({
			success: true,
			data: seasonsWithStats,
		});
	} catch (error) {
		console.error("Error fetching seasons:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Get season by ID (public access)
router.get("/:id", async (req, res) => {
	try {
		const season = await prisma.season.findUnique({
			where: { id: req.params.id },
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
				playerSeasonStats: {
					include: {
						player: {
							select: {
								id: true,
								gamertag: true,
								realName: true,
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
					},
				},
			},
		});

		if (!season) {
			return res.status(404).json({
				success: false,
				error: {
					message: "Season not found",
				},
			});
		}

		// Calculate season statistics
		const totalMatches = season.matches.length;
		const completedMatches = season.matches.filter(
			(m) => m.status === "COMPLETED"
		).length;
		const activePlayers = season.playerSeasonStats.length;

		const seasonWithStats = {
			...season,
			statistics: {
				totalMatches,
				completedMatches,
				pendingMatches: totalMatches - completedMatches,
				activePlayers,
			},
		};

		res.json({
			success: true,
			data: seasonWithStats,
		});
	} catch (error) {
		console.error("Error fetching season:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Create new season (COMPETITION_ADMIN, LEAGUE_ADMIN only)
router.post("/", authenticateToken, requireLeagueAdmin, async (req, res) => {
	try {
		const { name, startDate, endDate } = req.body;

		if (!name || !startDate || !endDate) {
			return res.status(400).json({
				success: false,
				error: {
					message: "Season name, start date, and end date are required",
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

		// Check for overlapping seasons
		const overlappingSeason = await prisma.season.findFirst({
			where: {
				OR: [
					{
						startDate: { lte: end },
						endDate: { gte: start },
					},
				],
			},
		});

		if (overlappingSeason) {
			return res.status(400).json({
				success: false,
				error: {
					message: "Season dates overlap with existing season",
				},
			});
		}

		const season = await prisma.season.create({
			data: {
				name,
				startDate: start,
				endDate: end,
			},
		});

		res.status(201).json({
			success: true,
			message: "Season created successfully",
			data: season,
		});
	} catch (error) {
		console.error("Error creating season:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Update season (COMPETITION_ADMIN, LEAGUE_ADMIN only)
router.put("/:id", authenticateToken, requireLeagueAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const { name, startDate, endDate } = req.body;

		// Check if season exists
		const existingSeason = await prisma.season.findUnique({
			where: { id },
		});

		if (!existingSeason) {
			return res.status(404).json({
				success: false,
				error: {
					message: "Season not found",
				},
			});
		}

		// Validate dates if provided
		let start, end;
		if (startDate) {
			start = new Date(startDate);
			if (isNaN(start.getTime())) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Invalid start date format",
					},
				});
			}
		}

		if (endDate) {
			end = new Date(endDate);
			if (isNaN(end.getTime())) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Invalid end date format",
					},
				});
			}
		}

		// Check for overlapping seasons if dates are being changed
		if ((startDate || endDate) && (start || end)) {
			const finalStart = start || existingSeason.startDate;
			const finalEnd = end || existingSeason.endDate;

			if (finalStart >= finalEnd) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Start date must be before end date",
					},
				});
			}

			const overlappingSeason = await prisma.season.findFirst({
				where: {
					id: { not: id },
					OR: [
						{
							startDate: { lte: finalEnd },
							endDate: { gte: finalStart },
						},
					],
				},
			});

			if (overlappingSeason) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Season dates overlap with existing season",
					},
				});
			}
		}

		const updatedSeason = await prisma.season.update({
			where: { id },
			data: {
				name: name || existingSeason.name,
				startDate: start || existingSeason.startDate,
				endDate: end || existingSeason.endDate,
			},
		});

		res.json({
			success: true,
			message: "Season updated successfully",
			data: updatedSeason,
		});
	} catch (error) {
		console.error("Error updating season:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Delete season (COMPETITION_ADMIN only)
router.delete(
	"/:id",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const { id } = req.params;

			// Check if season exists
			const existingSeason = await prisma.season.findUnique({
				where: { id },
				include: {
					matches: true,
					playerSeasonStats: true,
					awardedBadges: true,
				},
			});

			if (!existingSeason) {
				return res.status(404).json({
					success: false,
					error: {
						message: "Season not found",
					},
				});
			}

			// Check if season has matches or stats
			if (existingSeason.matches.length > 0) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Cannot delete season with matches",
					},
				});
			}

			if (existingSeason.playerSeasonStats.length > 0) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Cannot delete season with player statistics",
					},
				});
			}

			if (existingSeason.awardedBadges.length > 0) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Cannot delete season with awarded badges",
					},
				});
			}

			await prisma.season.delete({
				where: { id },
			});

			res.json({
				success: true,
				message: "Season deleted successfully",
			});
		} catch (error) {
			console.error("Error deleting season:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Get season standings (public access)
router.get("/:id/standings", async (req, res) => {
	try {
		const { id } = req.params;

		// Check if season exists
		const season = await prisma.season.findUnique({
			where: { id },
		});

		if (!season) {
			return res.status(404).json({
				success: false,
				error: {
					message: "Season not found",
				},
			});
		}

		// Get all teams that have played in this season
		const teams = await prisma.team.findMany({
			include: {
				homeMatches: {
					where: {
						seasonId: id,
						status: "COMPLETED",
					},
				},
				awayMatches: {
					where: {
						seasonId: id,
						status: "COMPLETED",
					},
				},
			},
		});

		// Calculate standings for each team
		const standings = teams
			.map((team) => {
				const homeMatches = team.homeMatches;
				const awayMatches = team.awayMatches;
				const allMatches = [...homeMatches, ...awayMatches];

				if (allMatches.length === 0) return null;

				let wins = 0;
				let draws = 0;
				let losses = 0;
				let goalsFor = 0;
				let goalsAgainst = 0;

				allMatches.forEach((match) => {
					const isHome = match.homeTeamId === team.id;
					const teamScore = isHome ? match.homeScore : match.awayScore;
					const opponentScore = isHome ? match.awayScore : match.homeScore;

					goalsFor += teamScore;
					goalsAgainst += opponentScore;

					if (teamScore > opponentScore) {
						wins++;
					} else if (teamScore === opponentScore) {
						draws++;
					} else {
						losses++;
					}
				});

				return {
					team: {
						id: team.id,
						name: team.name,
						logoUrl: team.logoUrl,
					},
					matches: allMatches.length,
					wins,
					draws,
					losses,
					goalsFor,
					goalsAgainst,
					goalDifference: goalsFor - goalsAgainst,
					points: wins * 3 + draws,
				};
			})
			.filter(Boolean)
			.sort((a, b) => {
				// Sort by points (desc), then goal difference (desc), then goals for (desc)
				if (b.points !== a.points) return b.points - a.points;
				if (b.goalDifference !== a.goalDifference)
					return b.goalDifference - a.goalDifference;
				return b.goalsFor - a.goalsFor;
			});

		res.json({
			success: true,
			data: {
				season: {
					id: season.id,
					name: season.name,
				},
				standings,
			},
		});
	} catch (error) {
		console.error("Error fetching season standings:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

module.exports = router;
