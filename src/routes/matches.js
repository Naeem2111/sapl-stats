const express = require("express");
const Joi = require("joi");
const { prisma } = require("../database/prisma");
const { authenticateToken, requireManager } = require("../middleware/auth");

const router = express.Router();

// Validation schemas
const createMatchSchema = Joi.object({
	seasonId: Joi.string().required(),
	homeTeamId: Joi.string().required(),
	awayTeamId: Joi.string().required(),
	date: Joi.date().required(),
	competitionType: Joi.string()
		.valid("LEAGUE", "CUP", "FRIENDLY", "PLAYOFF")
		.required(),
});

const updateMatchSchema = Joi.object({
	homeScore: Joi.number().min(0).integer().optional(),
	awayScore: Joi.number().min(0).integer().optional(),
	date: Joi.date().optional(),
	competitionType: Joi.string()
		.valid("LEAGUE", "CUP", "FRIENDLY", "PLAYOFF")
		.optional(),
});

const playerMatchStatsSchema = Joi.object({
	playerId: Joi.string().required(),
	teamId: Joi.string().required(),
	goals: Joi.number().min(0).integer().default(0),
	assists: Joi.number().min(0).integer().default(0),
	shots: Joi.number().min(0).integer().default(0),
	passes: Joi.number().min(0).integer().default(0),
	passAccuracy: Joi.number().min(0).max(100).default(0),
	tackles: Joi.number().min(0).integer().default(0),
	interceptions: Joi.number().min(0).integer().default(0),
	saves: Joi.number().min(0).integer().default(0),
	cleanSheet: Joi.boolean().default(false),
	rating: Joi.number().min(0).max(10).default(0),
	minutesPlayed: Joi.number().min(0).max(90).default(0),
});

// Get all matches with pagination and filtering
router.get("/", async (req, res, next) => {
	try {
		const {
			page = 1,
			limit = 20,
			seasonId,
			teamId,
			competitionType,
			dateFrom,
			dateTo,
			search,
		} = req.query;

		const skip = (parseInt(page) - 1) * parseInt(limit);

		// Build where clause
		const where = {};

		if (seasonId) where.seasonId = seasonId;
		if (competitionType) where.competitionType = competitionType;
		if (teamId) {
			where.OR = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
		}
		if (dateFrom || dateTo) {
			where.date = {};
			if (dateFrom) where.date.gte = new Date(dateFrom);
			if (dateTo) where.date.lte = new Date(dateTo);
		}

		const [matches, total] = await Promise.all([
			prisma.match.findMany({
				where,
				skip,
				take: parseInt(limit),
				orderBy: { date: "desc" },
				include: {
					season: {
						select: { name: true },
					},
					homeTeam: {
						select: { id: true, name: true, logoUrl: true },
					},
					awayTeam: {
						select: { id: true, name: true, logoUrl: true },
					},
					_count: {
						select: {
							playerMatchStats: true,
						},
					},
				},
			}),
			prisma.match.count({ where }),
		]);

		res.json({
			success: true,
			data: matches,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total,
				pages: Math.ceil(total / parseInt(limit)),
			},
		});
	} catch (error) {
		next(error);
	}
});

// Get match by ID with detailed information
router.get("/:id", async (req, res, next) => {
	try {
		const { id } = req.params;

		const match = await prisma.match.findUnique({
			where: { id },
			include: {
				season: {
					select: { id: true, name: true, startDate: true, endDate: true },
				},
				homeTeam: {
					select: { id: true, name: true, logoUrl: true },
				},
				awayTeam: {
					select: { id: true, name: true, logoUrl: true },
				},
				playerMatchStats: {
					include: {
						player: {
							select: { id: true, gamertag: true, position: true },
						},
						team: {
							select: { id: true, name: true },
						},
					},
					orderBy: [{ teamId: "asc" }, { player: { gamertag: "asc" } }],
				},
			},
		});

		if (!match) {
			return res.status(404).json({
				error: "Match not found",
				message: "Match with the specified ID does not exist",
			});
		}

		res.json({
			success: true,
			data: match,
		});
	} catch (error) {
		next(error);
	}
});

// Create new match (managers and admins only)
router.post("/", authenticateToken, requireManager, async (req, res, next) => {
	try {
		const { error, value } = createMatchSchema.validate(req.body);
		if (error) {
			return res.status(400).json({
				error: "Validation error",
				message: error.details[0].message,
			});
		}

		const { seasonId, homeTeamId, awayTeamId, date, competitionType } = value;

		// Check if teams are different
		if (homeTeamId === awayTeamId) {
			return res.status(400).json({
				error: "Invalid teams",
				message: "Home and away teams must be different",
			});
		}

		// Check if season exists
		const season = await prisma.season.findUnique({
			where: { id: seasonId },
		});

		if (!season) {
			return res.status(400).json({
				error: "Season not found",
				message: "Season with the specified ID does not exist",
			});
		}

		// Check if both teams exist
		const [homeTeam, awayTeam] = await Promise.all([
			prisma.team.findUnique({ where: { id: homeTeamId } }),
			prisma.team.findUnique({ where: { id: awayTeamId } }),
		]);

		if (!homeTeam || !awayTeam) {
			return res.status(400).json({
				error: "Team not found",
				message: "One or both teams do not exist",
			});
		}

		const match = await prisma.match.create({
			data: {
				seasonId,
				homeTeamId,
				awayTeamId,
				date: new Date(date),
				competitionType,
			},
			include: {
				season: { select: { name: true } },
				homeTeam: { select: { name: true } },
				awayTeam: { select: { name: true } },
			},
		});

		res.status(201).json({
			success: true,
			message: "Match created successfully",
			data: match,
		});
	} catch (error) {
		next(error);
	}
});

// Update match (managers and admins only)
router.put(
	"/:id",
	authenticateToken,
	requireManager,
	async (req, res, next) => {
		try {
			const { id } = req.params;
			const { error, value } = updateMatchSchema.validate(req.body);

			if (error) {
				return res.status(400).json({
					error: "Validation error",
					message: error.details[0].message,
				});
			}

			// Check if match exists
			const existingMatch = await prisma.match.findUnique({
				where: { id },
			});

			if (!existingMatch) {
				return res.status(404).json({
					error: "Match not found",
					message: "Match with the specified ID does not exist",
				});
			}

			const updatedMatch = await prisma.match.update({
				where: { id },
				data: value,
				include: {
					season: { select: { name: true } },
					homeTeam: { select: { name: true } },
					awayTeam: { select: { name: true } },
				},
			});

			res.json({
				success: true,
				message: "Match updated successfully",
				data: updatedMatch,
			});
		} catch (error) {
			next(error);
		}
	}
);

// Add/Update player match statistics
router.post(
	"/:id/stats",
	authenticateToken,
	requireManager,
	async (req, res, next) => {
		try {
			const { id: matchId } = req.params;
			const { error, value } = playerMatchStatsSchema.validate(req.body);

			if (error) {
				return res.status(400).json({
					error: "Validation error",
					message: error.details[0].message,
				});
			}

			// Check if match exists
			const match = await prisma.match.findUnique({
				where: { id: matchId },
			});

			if (!match) {
				return res.status(404).json({
					error: "Match not found",
					message: "Match with the specified ID does not exist",
				});
			}

			// Check if player exists and is on the specified team
			const player = await prisma.player.findUnique({
				where: { id: value.playerId },
				include: { team: true },
			});

			if (!player) {
				return res.status(400).json({
					error: "Player not found",
					message: "Player with the specified ID does not exist",
				});
			}

			if (player.teamId !== value.teamId) {
				return res.status(400).json({
					error: "Invalid team",
					message: "Player is not on the specified team",
				});
			}

			// Upsert player match stats
			const playerStats = await prisma.playerMatchStat.upsert({
				where: {
					matchId_playerId: {
						matchId,
						playerId: value.playerId,
					},
				},
				update: value,
				create: {
					matchId,
					...value,
				},
			});

			res.json({
				success: true,
				message: "Player match statistics updated successfully",
				data: playerStats,
			});
		} catch (error) {
			next(error);
		}
	}
);

// Get match statistics summary
router.get("/:id/stats-summary", async (req, res, next) => {
	try {
		const { id: matchId } = req.params;

		const match = await prisma.match.findUnique({
			where: { id: matchId },
			include: {
				homeTeam: { select: { name: true } },
				awayTeam: { select: { name: true } },
				playerMatchStats: {
					include: {
						player: { select: { gamertag: true, position: true } },
						team: { select: { name: true } },
					},
				},
			},
		});

		if (!match) {
			return res.status(404).json({
				error: "Match not found",
				message: "Match with the specified ID does not exist",
			});
		}

		// Calculate team statistics
		const homeTeamStats = match.playerMatchStats
			.filter((stat) => stat.teamId === match.homeTeamId)
			.reduce(
				(acc, stat) => {
					acc.goals += stat.goals;
					acc.assists += stat.assists;
					acc.shots += stat.shots;
					acc.passes += stat.passes;
					acc.tackles += stat.tackles;
					acc.interceptions += stat.interceptions;
					acc.saves += stat.saves;
					acc.cleanSheets += stat.cleanSheet ? 1 : 0;
					acc.players.push({
						gamertag: stat.player.gamertag,
						position: stat.player.position,
						goals: stat.goals,
						assists: stat.assists,
						rating: stat.rating,
						minutesPlayed: stat.minutesPlayed,
					});
					return acc;
				},
				{
					goals: 0,
					assists: 0,
					shots: 0,
					passes: 0,
					tackles: 0,
					interceptions: 0,
					saves: 0,
					cleanSheets: 0,
					players: [],
				}
			);

		const awayTeamStats = match.playerMatchStats
			.filter((stat) => stat.teamId === match.awayTeamId)
			.reduce(
				(acc, stat) => {
					acc.goals += stat.goals;
					acc.assists += stat.assists;
					acc.shots += stat.shots;
					acc.passes += stat.passes;
					acc.tackles += stat.tackles;
					acc.interceptions += stat.interceptions;
					acc.saves += stat.saves;
					acc.cleanSheets += stat.cleanSheet ? 1 : 0;
					acc.players.push({
						gamertag: stat.player.gamertag,
						position: stat.player.position,
						goals: stat.goals,
						assists: stat.assists,
						rating: stat.rating,
						minutesPlayed: stat.minutesPlayed,
					});
					return acc;
				},
				{
					goals: 0,
					assists: 0,
					shots: 0,
					passes: 0,
					tackles: 0,
					interceptions: 0,
					saves: 0,
					cleanSheets: 0,
					players: [],
				}
			);

		res.json({
			success: true,
			data: {
				match: {
					id: match.id,
					date: match.date,
					homeTeam: match.homeTeam,
					awayTeam: match.awayTeam,
					homeScore: match.homeScore,
					awayScore: match.awayScore,
					competitionType: match.competitionType,
				},
				homeTeamStats,
				awayTeamStats,
			},
		});
	} catch (error) {
		next(error);
	}
});

// Delete match (admins only)
router.delete(
	"/:id",
	authenticateToken,
	requireManager,
	async (req, res, next) => {
		try {
			const { id } = req.params;

			// Check if match exists
			const match = await prisma.match.findUnique({
				where: { id },
				include: {
					_count: {
						select: {
							playerMatchStats: true,
						},
					},
				},
			});

			if (!match) {
				return res.status(404).json({
					error: "Match not found",
					message: "Match with the specified ID does not exist",
				});
			}

			// Check if match has statistics
			if (match._count.playerMatchStats > 0) {
				return res.status(400).json({
					error: "Cannot delete match",
					message: "Match has player statistics associated with it",
				});
			}

			await prisma.match.delete({
				where: { id },
			});

			res.json({
				success: true,
				message: "Match deleted successfully",
			});
		} catch (error) {
			next(error);
		}
	}
);

module.exports = router;
