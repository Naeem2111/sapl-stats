const express = require("express");
const { prisma } = require("../database/prisma");
const {
	authenticateToken,
	requireCompetitionAdmin,
	requireLeagueAdmin,
	requireTeamAdmin,
} = require("../middleware/auth");

const router = express.Router();

// Get all teams (public access)
router.get("/", async (req, res) => {
	try {
		const teams = await prisma.team.findMany({
			include: {
				players: {
					include: {
						user: {
							select: {
								username: true,
								email: true,
							},
						},
					},
				},
			},
		});

		res.json({
			success: true,
			data: teams,
		});
	} catch (error) {
		console.error("Error fetching teams:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Get team by ID (public access)
router.get("/:id", async (req, res) => {
	try {
		const team = await prisma.team.findUnique({
			where: { id: req.params.id },
			include: {
				players: {
					include: {
						user: {
							select: {
								username: true,
								email: true,
							},
						},
					},
				},
			},
		});

		if (!team) {
			return res.status(404).json({
				success: false,
				error: {
					message: "Team not found",
				},
			});
		}

		res.json({
			success: true,
			data: team,
		});
	} catch (error) {
		console.error("Error fetching team:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Create new team (COMPETITION_ADMIN, LEAGUE_ADMIN only)
router.post("/", authenticateToken, requireLeagueAdmin, async (req, res) => {
	try {
		const { name, logoUrl } = req.body;

		if (!name) {
			return res.status(400).json({
				success: false,
				error: {
					message: "Team name is required",
				},
			});
		}

		// Check if team name already exists
		const existingTeam = await prisma.team.findUnique({
			where: { name },
		});

		if (existingTeam) {
			return res.status(400).json({
				success: false,
				error: {
					message: "Team with this name already exists",
				},
			});
		}

		const team = await prisma.team.create({
			data: {
				name,
				logoUrl: logoUrl || null,
			},
		});

		res.status(201).json({
			success: true,
			message: "Team created successfully",
			data: team,
		});
	} catch (error) {
		console.error("Error creating team:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Update team (COMPETITION_ADMIN, LEAGUE_ADMIN only)
router.put("/:id", authenticateToken, requireLeagueAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const { name, logoUrl } = req.body;

		// Check if team exists
		const existingTeam = await prisma.team.findUnique({
			where: { id },
		});

		if (!existingTeam) {
			return res.status(404).json({
				success: false,
				error: {
					message: "Team not found",
				},
			});
		}

		// Check if new name conflicts with existing team
		if (name && name !== existingTeam.name) {
			const nameConflict = await prisma.team.findUnique({
				where: { name },
			});

			if (nameConflict) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Team with this name already exists",
					},
				});
			}
		}

		const updatedTeam = await prisma.team.update({
			where: { id },
			data: {
				name: name || existingTeam.name,
				logoUrl: logoUrl !== undefined ? logoUrl : existingTeam.logoUrl,
			},
		});

		res.json({
			success: true,
			message: "Team updated successfully",
			data: updatedTeam,
		});
	} catch (error) {
		console.error("Error updating team:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Delete team (COMPETITION_ADMIN only)
router.delete(
	"/:id",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const { id } = req.params;

			// Check if team exists
			const existingTeam = await prisma.team.findUnique({
				where: { id },
				include: {
					players: true,
					homeMatches: true,
					awayMatches: true,
				},
			});

			if (!existingTeam) {
				return res.status(404).json({
					success: false,
					error: {
						message: "Team not found",
					},
				});
			}

			// Check if team has players or matches
			if (existingTeam.players.length > 0) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Cannot delete team with active players",
					},
				});
			}

			if (
				existingTeam.homeMatches.length > 0 ||
				existingTeam.awayMatches.length > 0
			) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Cannot delete team with match history",
					},
				});
			}

			await prisma.team.delete({
				where: { id },
			});

			res.json({
				success: true,
				message: "Team deleted successfully",
			});
		} catch (error) {
			console.error("Error deleting team:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Get team statistics (COMPETITION_ADMIN, LEAGUE_ADMIN, TEAM_ADMIN)
router.get(
	"/:id/stats",
	authenticateToken,
	requireTeamAdmin,
	async (req, res) => {
		try {
			const { id } = req.params;
			const { season } = req.query;

			// Check if team exists
			const team = await prisma.team.findUnique({
				where: { id },
			});

			if (!team) {
				return res.status(404).json({
					success: false,
					error: {
						message: "Team not found",
					},
				});
			}

			// Build where clause for season filtering
			const where = { teamId: id };
			if (season && season !== "all") {
				where.match = { seasonId: season };
			}

			// Get team statistics
			const stats = await prisma.playerMatchStat.groupBy({
				by: ["teamId"],
				where,
				_sum: {
					goals: true,
					assists: true,
					cleanSheets: true,
					yellowCards: true,
					redCards: true,
				},
				_count: {
					matchId: true,
				},
			});

			// Get team match results
			const matches = await prisma.match.findMany({
				where: {
					OR: [{ homeTeamId: id }, { awayTeamId: id }],
					...(season && season !== "all" ? { seasonId: season } : {}),
				},
				select: {
					id: true,
					homeTeamId: true,
					awayTeamId: true,
					homeScore: true,
					awayScore: true,
					status: true,
					date: true,
				},
			});

			// Calculate match statistics
			let wins = 0;
			let draws = 0;
			let losses = 0;
			let goalsFor = 0;
			let goalsAgainst = 0;

			matches.forEach((match) => {
				if (match.status === "COMPLETED") {
					const isHome = match.homeTeamId === id;
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
				}
			});

			const teamStats = {
				team: {
					id: team.id,
					name: team.name,
					logoUrl: team.logoUrl,
				},
				statistics: {
					matches: matches.length,
					wins,
					draws,
					losses,
					goalsFor,
					goalsAgainst,
					goalDifference: goalsFor - goalsAgainst,
					points: wins * 3 + draws,
					...stats[0]?._sum,
				},
				recentMatches: matches.slice(0, 5),
			};

			res.json({
				success: true,
				data: teamStats,
			});
		} catch (error) {
			console.error("Error fetching team stats:", error);
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
