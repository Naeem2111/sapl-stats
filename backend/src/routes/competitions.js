const express = require("express");
const { prisma } = require("../database/prisma");
const {
	authenticateToken,
	requireCompetitionAdmin,
	requireLeagueAdmin,
} = require("../middleware/auth");

const router = express.Router();

// Get all competitions overview (COMPETITION_ADMIN, LEAGUE_ADMIN only)
router.get(
	"/overview",
	authenticateToken,
	requireLeagueAdmin,
	async (req, res) => {
		try {
			const competitions = await prisma.season.findMany({
				include: {
					matches: {
						select: {
							id: true,
							status: true,
							homeScore: true,
							awayScore: true,
						},
					},
					playerSeasonStats: {
						select: {
							id: true,
							player: {
								select: {
									teamId: true,
								},
							},
						},
					},
				},
				orderBy: {
					startDate: "desc",
				},
			});

			// Calculate competition statistics
			const competitionsWithStats = competitions.map((competition) => {
				const totalMatches = competition.matches.length;
				const completedMatches = competition.matches.filter(
					(m) => m.status === "COMPLETED"
				).length;
				const pendingMatches = totalMatches - completedMatches;

				// Count unique teams
				const uniqueTeams = new Set();
				competition.playerSeasonStats.forEach((stat) => {
					if (stat.player.teamId) {
						uniqueTeams.add(stat.player.teamId);
					}
				});

				// Calculate total goals
				const totalGoals = competition.matches
					.filter((m) => m.status === "COMPLETED")
					.reduce((sum, match) => sum + match.homeScore + match.awayScore, 0);

				return {
					id: competition.id,
					name: competition.name,
					startDate: competition.startDate,
					endDate: competition.endDate,
					statistics: {
						totalMatches,
						completedMatches,
						pendingMatches,
						teams: uniqueTeams.size,
						totalGoals,
						completionRate:
							totalMatches > 0
								? Math.round((completedMatches / totalMatches) * 100)
								: 0,
					},
				};
			});

			res.json({
				success: true,
				data: competitionsWithStats,
			});
		} catch (error) {
			console.error("Error fetching competitions overview:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Get competition details (COMPETITION_ADMIN, LEAGUE_ADMIN only)
router.get("/:id", authenticateToken, requireLeagueAdmin, async (req, res) => {
	try {
		const { id } = req.params;

		const competition = await prisma.season.findUnique({
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
						playerMatchStats: {
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
					orderBy: {
						date: "asc",
					},
				},
			},
		});

		if (!competition) {
			return res.status(404).json({
				success: false,
				error: {
					message: "Competition not found",
				},
			});
		}

		// Calculate detailed statistics
		const totalMatches = competition.matches.length;
		const completedMatches = competition.matches.filter(
			(m) => m.status === "COMPLETED"
		).length;
		const scheduledMatches = competition.matches.filter(
			(m) => m.status === "SCHEDULED"
		).length;
		const inProgressMatches = competition.matches.filter(
			(m) => m.status === "IN_PROGRESS"
		).length;
		const cancelledMatches = competition.matches.filter(
			(m) => m.status === "CANCELLED"
		).length;
		const postponedMatches = competition.matches.filter(
			(m) => m.status === "POSTPONED"
		).length;

		// Count unique teams and players
		const uniqueTeams = new Set();
		const uniquePlayers = new Set();
		let totalGoals = 0;
		let totalAssists = 0;
		let totalCleanSheets = 0;
		let totalYellowCards = 0;
		let totalRedCards = 0;

		competition.matches.forEach((match) => {
			if (match.status === "COMPLETED") {
				totalGoals += match.homeScore + match.awayScore;
			}

			match.playerMatchStats.forEach((stat) => {
				if (stat.player.teamId) {
					uniqueTeams.add(stat.player.teamId);
				}
				uniquePlayers.add(stat.player.id);

				totalAssists += stat.assists || 0;
				totalCleanSheets += stat.cleanSheets || 0;
				totalYellowCards += stat.yellowCards || 0;
				totalRedCards += stat.redCards || 0;
			});
		});

		const competitionStats = {
			...competition,
			statistics: {
				totalMatches,
				completedMatches,
				scheduledMatches,
				inProgressMatches,
				cancelledMatches,
				postponedMatches,
				teams: uniqueTeams.size,
				players: uniquePlayers.size,
				totalGoals,
				totalAssists,
				totalCleanSheets,
				totalYellowCards,
				totalRedCards,
				completionRate:
					totalMatches > 0
						? Math.round((completedMatches / totalMatches) * 100)
						: 0,
			},
		};

		res.json({
			success: true,
			data: competitionStats,
		});
	} catch (error) {
		console.error("Error fetching competition details:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Create new competition (COMPETITION_ADMIN only)
router.post(
	"/",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const { name, startDate, endDate, description, competitionType } =
				req.body;

			if (!name || !startDate || !endDate) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Competition name, start date, and end date are required",
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

			// Check for overlapping competitions
			const overlappingCompetition = await prisma.season.findFirst({
				where: {
					OR: [
						{
							startDate: { lte: end },
							endDate: { gte: start },
						},
					],
				},
			});

			if (overlappingCompetition) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Competition dates overlap with existing competition",
					},
				});
			}

			const competition = await prisma.season.create({
				data: {
					name,
					startDate: start,
					endDate: end,
				},
			});

			res.status(201).json({
				success: true,
				message: "Competition created successfully",
				data: competition,
			});
		} catch (error) {
			console.error("Error creating competition:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Update competition (COMPETITION_ADMIN only)
router.put(
	"/:id",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const { id } = req.params;
			const { name, startDate, endDate, description } = req.body;

			// Check if competition exists
			const existingCompetition = await prisma.season.findUnique({
				where: { id },
			});

			if (!existingCompetition) {
				return res.status(404).json({
					success: false,
					error: {
						message: "Competition not found",
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

			// Check for overlapping competitions if dates are being changed
			if ((startDate || endDate) && (start || end)) {
				const finalStart = start || existingCompetition.startDate;
				const finalEnd = end || existingCompetition.endDate;

				if (finalStart >= finalEnd) {
					return res.status(400).json({
						success: false,
						error: {
							message: "Start date must be before end date",
						},
					});
				}

				const overlappingCompetition = await prisma.season.findFirst({
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

				if (overlappingCompetition) {
					return res.status(400).json({
						success: false,
						error: {
							message: "Competition dates overlap with existing competition",
						},
					});
				}
			}

			const updatedCompetition = await prisma.season.update({
				where: { id },
				data: {
					name: name || existingCompetition.name,
					startDate: start || existingCompetition.startDate,
					endDate: end || existingCompetition.endDate,
				},
			});

			res.json({
				success: true,
				message: "Competition updated successfully",
				data: updatedCompetition,
			});
		} catch (error) {
			console.error("Error updating competition:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Delete competition (COMPETITION_ADMIN only)
router.delete(
	"/:id",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const { id } = req.params;

			// Check if competition exists
			const existingCompetition = await prisma.season.findUnique({
				where: { id },
				include: {
					matches: true,
					playerSeasonStats: true,
					awardedBadges: true,
				},
			});

			if (!existingCompetition) {
				return res.status(404).json({
					success: false,
					error: {
						message: "Competition not found",
					},
				});
			}

			// Check if competition has matches or stats
			if (existingCompetition.matches.length > 0) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Cannot delete competition with matches",
					},
				});
			}

			if (existingCompetition.playerSeasonStats.length > 0) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Cannot delete competition with player statistics",
					},
				});
			}

			if (existingCompetition.awardedBadges.length > 0) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Cannot delete competition with awarded badges",
					},
				});
			}

			await prisma.season.delete({
				where: { id },
			});

			res.json({
				success: true,
				message: "Competition deleted successfully",
			});
		} catch (error) {
			console.error("Error deleting competition:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Get competition standings (COMPETITION_ADMIN, LEAGUE_ADMIN only)
router.get(
	"/:id/standings",
	authenticateToken,
	requireLeagueAdmin,
	async (req, res) => {
		try {
			const { id } = req.params;

			// Check if competition exists
			const competition = await prisma.season.findUnique({
				where: { id },
			});

			if (!competition) {
				return res.status(404).json({
					success: false,
					error: {
						message: "Competition not found",
					},
				});
			}

			// Get all teams that have played in this competition
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
					competition: {
						id: competition.id,
						name: competition.name,
					},
					standings,
				},
			});
		} catch (error) {
			console.error("Error fetching competition standings:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Get competition analytics (COMPETITION_ADMIN only)
router.get(
	"/:id/analytics",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const { id } = req.params;

			// Check if competition exists
			const competition = await prisma.season.findUnique({
				where: { id },
				include: {
					matches: {
						include: {
							playerMatchStats: {
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
												},
											},
										},
									},
								},
							},
						},
					},
				},
			});

			if (!competition) {
				return res.status(404).json({
					success: false,
					error: {
						message: "Competition not found",
					},
				});
			}

			// Calculate comprehensive analytics
			const totalMatches = competition.matches.length;
			const completedMatches = competition.matches.filter(
				(m) => m.status === "COMPLETED"
			).length;
			const totalGoals = competition.matches
				.filter((m) => m.status === "COMPLETED")
				.reduce(
					(sum, match) => sum + (match.homeScore || 0) + (match.awayScore || 0),
					0
				);

			// Player statistics
			const playerStats = {};
			competition.matches.forEach((match) => {
				match.playerMatchStats.forEach((stat) => {
					const playerId = stat.player.id;
					if (!playerStats[playerId]) {
						playerStats[playerId] = {
							player: stat.player,
							goals: 0,
							assists: 0,
							cleanSheets: 0,
							yellowCards: 0,
							redCards: 0,
							matches: 0,
						};
					}

					playerStats[playerId].goals += stat.goals || 0;
					playerStats[playerId].assists += stat.assists || 0;
					playerStats[playerId].cleanSheets += stat.cleanSheets || 0;
					playerStats[playerId].yellowCards += stat.yellowCards || 0;
					playerStats[playerId].redCards += stat.redCards || 0;
					playerStats[playerId].matches += 1;
				});
			});

			// Top performers
			const topScorers = Object.values(playerStats)
				.sort((a, b) => b.goals - a.goals)
				.slice(0, 10);

			const topAssisters = Object.values(playerStats)
				.sort((a, b) => b.assists - a.assists)
				.slice(0, 10);

			const topCleanSheets = Object.values(playerStats)
				.sort((a, b) => b.cleanSheets - a.cleanSheets)
				.slice(0, 10);

			// Team statistics
			const teamStats = {};
			competition.matches.forEach((match) => {
				if (match.status === "COMPLETED") {
					[match.homeTeamId, match.awayTeamId].forEach((teamId) => {
						if (!teamStats[teamId]) {
							teamStats[teamId] = {
								teamId,
								matches: 0,
								wins: 0,
								draws: 0,
								losses: 0,
								goalsFor: 0,
								goalsAgainst: 0,
							};
						}

						teamStats[teamId].matches += 1;
					});
				}
			});

			const analytics = {
				competition: {
					id: competition.id,
					name: competition.name,
				},
				overview: {
					totalMatches,
					completedMatches,
					pendingMatches: totalMatches - completedMatches,
					totalGoals,
					averageGoalsPerMatch:
						completedMatches > 0
							? (totalGoals / completedMatches).toFixed(2)
							: 0,
					completionRate:
						totalMatches > 0
							? Math.round((completedMatches / totalMatches) * 100)
							: 0,
				},
				topPerformers: {
					scorers: topScorers,
					assisters: topAssisters,
					cleanSheets: topCleanSheets,
				},
				teamStatistics: Object.values(teamStats),
			};

			res.json({
				success: true,
				data: analytics,
			});
		} catch (error) {
			console.error("Error fetching competition analytics:", error);
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


