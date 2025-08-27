const express = require("express");
const { prisma } = require("../database/prisma");
const {
	authenticateToken,
	requireCompetitionAdmin,
	requireLeagueAdmin,
} = require("../middleware/auth");

const router = express.Router();

// Get all cups (COMPETITION_ADMIN, LEAGUE_ADMIN only)
router.get("/", authenticateToken, requireLeagueAdmin, async (req, res) => {
	try {
		const { season, status, format } = req.query;

		// Build where clause
		const where = {};
		if (season && season !== "all") {
			where.seasonId = season;
		}
		if (status && status !== "all") {
			where.status = status;
		}
		if (format && format !== "all") {
			where.format = format;
		}

		const cups = await prisma.cup.findMany({
			where,
			include: {
				season: {
					select: {
						id: true,
						name: true,
						startDate: true,
						endDate: true,
					},
				},
				entries: {
					include: {
						team: {
							select: {
								id: true,
								name: true,
								logoUrl: true,
							},
						},
					},
				},
				matches: {
					select: {
						id: true,
						status: true,
						homeScore: true,
						awayScore: true,
					},
				},
				rounds: {
					orderBy: {
						roundNumber: "asc",
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		// Add computed fields
		const cupsWithStats = cups.map((cup) => ({
			...cup,
			teamsCount: cup.entries.length,
			completedMatches: cup.matches.filter((m) => m.status === "COMPLETED")
				.length,
			totalMatches: cup.matches.length,
			progress:
				cup.matches.length > 0
					? Math.round(
							(cup.matches.filter((m) => m.status === "COMPLETED").length /
								cup.matches.length) *
								100
					  )
					: 0,
		}));

		res.json({
			success: true,
			data: cupsWithStats,
		});
	} catch (error) {
		console.error("Error fetching cups:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Get cup by ID (COMPETITION_ADMIN, LEAGUE_ADMIN only)
router.get("/:id", authenticateToken, requireLeagueAdmin, async (req, res) => {
	try {
		const { id } = req.params;

		const cup = await prisma.cup.findUnique({
			where: { id },
			include: {
				season: {
					select: {
						id: true,
						name: true,
						startDate: true,
						endDate: true,
					},
				},
				entries: {
					include: {
						team: {
							select: {
								id: true,
								name: true,
								logoUrl: true,
								saplId: true,
								saplData: true,
							},
						},
					},
					orderBy: {
						seed: "asc",
					},
				},
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
						cupRound: {
							select: {
								id: true,
								name: true,
								roundNumber: true,
							},
						},
					},
					orderBy: [
						{ cupRound: { roundNumber: "asc" } },
						{ matchNumber: "asc" },
					],
				},
				rounds: {
					orderBy: {
						roundNumber: "asc",
					},
				},
			},
		});

		if (!cup) {
			return res.status(404).json({
				success: false,
				error: {
					message: "Cup not found",
				},
			});
		}

		// Calculate cup statistics
		const totalMatches = cup.matches.length;
		const completedMatches = cup.matches.filter(
			(m) => m.status === "COMPLETED"
		).length;
		const scheduledMatches = cup.matches.filter(
			(m) => m.status === "SCHEDULED"
		).length;
		const inProgressMatches = cup.matches.filter(
			(m) => m.status === "IN_PROGRESS"
		).length;

		const cupStats = {
			...cup,
			statistics: {
				totalMatches,
				completedMatches,
				scheduledMatches,
				inProgressMatches,
				progress:
					totalMatches > 0
						? Math.round((completedMatches / totalMatches) * 100)
						: 0,
			},
		};

		res.json({
			success: true,
			data: cupStats,
		});
	} catch (error) {
		console.error("Error fetching cup:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Create new cup (COMPETITION_ADMIN only)
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
				format,
				startDate,
				endDate,
				maxTeams,
				minTeams,
			} = req.body;

			if (!name || !seasonId || !format || !startDate || !endDate) {
				return res.status(400).json({
					success: false,
					error: {
						message:
							"Name, season ID, format, start date, and end date are required",
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

			// Check if season exists
			const season = await prisma.season.findUnique({
				where: { id: seasonId },
			});

			if (!season) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Season not found",
					},
				});
			}

			// Check for overlapping cups in the same season
			const overlappingCup = await prisma.cup.findFirst({
				where: {
					seasonId,
					OR: [
						{
							startDate: { lte: end },
							endDate: { gte: start },
						},
					],
				},
			});

			if (overlappingCup) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Cup dates overlap with existing cup in this season",
					},
				});
			}

			const cup = await prisma.cup.create({
				data: {
					name,
					description,
					seasonId,
					format,
					startDate: start,
					endDate: end,
					maxTeams: maxTeams ? parseInt(maxTeams) : null,
					minTeams: minTeams ? parseInt(minTeams) : null,
				},
				include: {
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
				message: "Cup created successfully",
				data: cup,
			});
		} catch (error) {
			console.error("Error creating cup:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Update cup (COMPETITION_ADMIN only)
router.put(
	"/:id",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const { id } = req.params;
			const {
				name,
				description,
				format,
				startDate,
				endDate,
				maxTeams,
				minTeams,
				status,
			} = req.body;

			// Check if cup exists
			const existingCup = await prisma.cup.findUnique({
				where: { id },
			});

			if (!existingCup) {
				return res.status(404).json({
					success: false,
					error: {
						message: "Cup not found",
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

			// Check for overlapping cups if dates are being changed
			if ((startDate || endDate) && (start || end)) {
				const finalStart = start || existingCup.startDate;
				const finalEnd = end || existingCup.endDate;

				if (finalStart >= finalEnd) {
					return res.status(400).json({
						success: false,
						error: {
							message: "Start date must be before end date",
						},
					});
				}

				const overlappingCup = await prisma.cup.findFirst({
					where: {
						id: { not: id },
						seasonId: existingCup.seasonId,
						OR: [
							{
								startDate: { lte: finalEnd },
								endDate: { gte: finalStart },
							},
						],
					},
				});

				if (overlappingCup) {
					return res.status(400).json({
						success: false,
						error: {
							message: "Cup dates overlap with existing cup in this season",
						},
					});
				}
			}

			const updatedCup = await prisma.cup.update({
				where: { id },
				data: {
					name: name || existingCup.name,
					description:
						description !== undefined ? description : existingCup.description,
					format: format || existingCup.format,
					startDate: start || existingCup.startDate,
					endDate: end || existingCup.endDate,
					maxTeams:
						maxTeams !== undefined ? parseInt(maxTeams) : existingCup.maxTeams,
					minTeams:
						minTeams !== undefined ? parseInt(minTeams) : existingCup.minTeams,
					status: status || existingCup.status,
				},
				include: {
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
				message: "Cup updated successfully",
				data: updatedCup,
			});
		} catch (error) {
			console.error("Error updating cup:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Delete cup (COMPETITION_ADMIN only)
router.delete(
	"/:id",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const { id } = req.params;

			// Check if cup exists
			const existingCup = await prisma.cup.findUnique({
				where: { id },
				include: {
					matches: true,
					entries: true,
				},
			});

			if (!existingCup) {
				return res.status(404).json({
					success: false,
					error: {
						message: "Cup not found",
					},
				});
			}

			// Check if cup has matches or entries
			if (existingCup.matches.length > 0) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Cannot delete cup with matches",
					},
				});
			}

			if (existingCup.entries.length > 0) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Cannot delete cup with team entries",
					},
				});
			}

			await prisma.cup.delete({
				where: { id },
			});

			res.json({
				success: true,
				message: "Cup deleted successfully",
			});
		} catch (error) {
			console.error("Error deleting cup:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Add team to cup (COMPETITION_ADMIN, LEAGUE_ADMIN only)
router.post(
	"/:id/teams",
	authenticateToken,
	requireLeagueAdmin,
	async (req, res) => {
		try {
			const { id: cupId } = req.params;
			const { teamId, seed, group } = req.body;

			if (!teamId) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Team ID is required",
					},
				});
			}

			// Check if cup exists
			const cup = await prisma.cup.findUnique({
				where: { id: cupId },
			});

			if (!cup) {
				return res.status(404).json({
					success: false,
					error: {
						message: "Cup not found",
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

			// Check if team is already in the cup
			const existingEntry = await prisma.cupEntry.findUnique({
				where: {
					cupId_teamId: {
						cupId,
						teamId,
					},
				},
			});

			if (existingEntry) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Team is already registered for this cup",
					},
				});
			}

			// Check if cup is full
			if (cup.maxTeams) {
				const currentEntries = await prisma.cupEntry.count({
					where: { cupId },
				});

				if (currentEntries >= cup.maxTeams) {
					return res.status(400).json({
						success: false,
						error: {
							message: "Cup is full",
						},
					});
				}
			}

			const entry = await prisma.cupEntry.create({
				data: {
					cupId,
					teamId,
					seed: seed ? parseInt(seed) : null,
					group: group || null,
				},
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

			res.status(201).json({
				success: true,
				message: "Team added to cup successfully",
				data: entry,
			});
		} catch (error) {
			console.error("Error adding team to cup:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Remove team from cup (COMPETITION_ADMIN, LEAGUE_ADMIN only)
router.delete(
	"/:id/teams/:teamId",
	authenticateToken,
	requireLeagueAdmin,
	async (req, res) => {
		try {
			const { id: cupId, teamId } = req.params;

			// Check if entry exists
			const entry = await prisma.cupEntry.findUnique({
				where: {
					cupId_teamId: {
						cupId,
						teamId,
					},
				},
			});

			if (!entry) {
				return res.status(404).json({
					success: false,
					error: {
						message: "Team entry not found",
					},
				});
			}

			// Check if cup has started (has matches)
			const cupMatches = await prisma.match.findFirst({
				where: { cupId },
			});

			if (cupMatches) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Cannot remove team from cup that has already started",
					},
				});
			}

			await prisma.cupEntry.delete({
				where: {
					cupId_teamId: {
						cupId,
						teamId,
					},
				},
			});

			res.json({
				success: true,
				message: "Team removed from cup successfully",
			});
		} catch (error) {
			console.error("Error removing team from cup:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Get cup standings/bracket (COMPETITION_ADMIN, LEAGUE_ADMIN only)
router.get(
	"/:id/standings",
	authenticateToken,
	requireLeagueAdmin,
	async (req, res) => {
		try {
			const { id } = req.params;

			const cup = await prisma.cup.findUnique({
				where: { id },
				include: {
					entries: {
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
							seed: "asc",
						},
					},
					matches: {
						where: {
							status: "COMPLETED",
						},
						include: {
							homeTeam: {
								select: {
									id: true,
									name: true,
								},
							},
							awayTeam: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
				},
			});

			if (!cup) {
				return res.status(404).json({
					success: false,
					error: {
						message: "Cup not found",
					},
				});
			}

			// Calculate team statistics
			const teamStats = {};
			cup.entries.forEach((entry) => {
				teamStats[entry.teamId] = {
					team: entry.team,
					matches: 0,
					wins: 0,
					draws: 0,
					losses: 0,
					goalsFor: 0,
					goalsAgainst: 0,
					points: 0,
				};
			});

			// Calculate stats from matches
			cup.matches.forEach((match) => {
				const homeTeamId = match.homeTeamId;
				const awayTeamId = match.awayTeamId;

				if (teamStats[homeTeamId]) {
					teamStats[homeTeamId].matches++;
					teamStats[homeTeamId].goalsFor += match.homeScore;
					teamStats[homeTeamId].goalsAgainst += match.awayScore;

					if (match.homeScore > match.awayScore) {
						teamStats[homeTeamId].wins++;
						teamStats[homeTeamId].points += 3;
					} else if (match.homeScore === match.awayScore) {
						teamStats[homeTeamId].draws++;
						teamStats[homeTeamId].points += 1;
					} else {
						teamStats[homeTeamId].losses++;
					}
				}

				if (teamStats[awayTeamId]) {
					teamStats[awayTeamId].matches++;
					teamStats[awayTeamId].goalsFor += match.awayScore;
					teamStats[awayTeamId].goalsAgainst += match.homeScore;

					if (match.awayScore > match.homeScore) {
						teamStats[awayTeamId].wins++;
						teamStats[awayTeamId].points += 3;
					} else if (match.awayScore === match.homeScore) {
						teamStats[awayTeamId].draws++;
						teamStats[awayTeamId].points += 1;
					} else {
						teamStats[awayTeamId].losses++;
					}
				}
			});

			// Convert to array and sort
			const standings = Object.values(teamStats).sort((a, b) => {
				if (b.points !== a.points) return b.points - a.points;
				const aGoalDiff = a.goalsFor - a.goalsAgainst;
				const bGoalDiff = b.goalsFor - b.goalsAgainst;
				if (bGoalDiff !== aGoalDiff) return bGoalDiff - aGoalDiff;
				return b.goalsFor - a.goalsFor;
			});

			res.json({
				success: true,
				data: {
					cup: {
						id: cup.id,
						name: cup.name,
						format: cup.format,
						status: cup.status,
					},
					standings,
				},
			});
		} catch (error) {
			console.error("Error fetching cup standings:", error);
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

