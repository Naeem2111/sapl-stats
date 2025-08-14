const express = require("express");
const Joi = require("joi");
const { prisma } = require("../database/prisma");
const { authenticateToken, requireManager } = require("../middleware/auth");

const router = express.Router();

// Validation schemas
const createTeamSchema = Joi.object({
	name: Joi.string().min(2).max(50).required(),
	logoUrl: Joi.string().uri().optional(),
});

const updateTeamSchema = Joi.object({
	name: Joi.string().min(2).max(50).optional(),
	logoUrl: Joi.string().uri().optional(),
});

// Get all teams
router.get("/", async (req, res, next) => {
	try {
		const { page = 1, limit = 20, search } = req.query;
		const skip = (parseInt(page) - 1) * parseInt(limit);

		const where = search
			? {
					OR: [{ name: { contains: search, mode: "insensitive" } }],
			  }
			: {};

		const [teams, total] = await Promise.all([
			prisma.team.findMany({
				where,
				skip,
				take: parseInt(limit),
				orderBy: { name: "asc" },
				include: {
					_count: {
						select: {
							players: true,
						},
					},
				},
			}),
			prisma.team.count({ where }),
		]);

		res.json({
			success: true,
			data: teams,
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

// Get team by ID
router.get("/:id", async (req, res, next) => {
	try {
		const { id } = req.params;

		const team = await prisma.team.findUnique({
			where: { id },
			include: {
				players: {
					include: {
						user: {
							select: {
								username: true,
							},
						},
					},
					orderBy: { gamertag: "asc" },
				},
				_count: {
					select: {
						players: true,
						homeMatches: true,
						awayMatches: true,
					},
				},
			},
		});

		if (!team) {
			return res.status(404).json({
				error: "Team not found",
				message: "Team with the specified ID does not exist",
			});
		}

		res.json({
			success: true,
			data: team,
		});
	} catch (error) {
		next(error);
	}
});

// Create new team (managers and admins only)
router.post("/", authenticateToken, requireManager, async (req, res, next) => {
	try {
		const { error, value } = createTeamSchema.validate(req.body);
		if (error) {
			return res.status(400).json({
				error: "Validation error",
				message: error.details[0].message,
			});
		}

		const { name, logoUrl } = value;

		// Check if team name already exists
		const existingTeam = await prisma.team.findUnique({
			where: { name },
		});

		if (existingTeam) {
			return res.status(400).json({
				error: "Team name taken",
				message: "A team with this name already exists",
			});
		}

		const team = await prisma.team.create({
			data: {
				name,
				logoUrl,
			},
		});

		res.status(201).json({
			success: true,
			message: "Team created successfully",
			data: team,
		});
	} catch (error) {
		next(error);
	}
});

// Update team (managers and admins only)
router.put(
	"/:id",
	authenticateToken,
	requireManager,
	async (req, res, next) => {
		try {
			const { id } = req.params;
			const { error, value } = updateTeamSchema.validate(req.body);

			if (error) {
				return res.status(400).json({
					error: "Validation error",
					message: error.details[0].message,
				});
			}

			// Check if team exists
			const existingTeam = await prisma.team.findUnique({
				where: { id },
			});

			if (!existingTeam) {
				return res.status(404).json({
					error: "Team not found",
					message: "Team with the specified ID does not exist",
				});
			}

			// Check if new name conflicts with existing team
			if (value.name && value.name !== existingTeam.name) {
				const nameConflict = await prisma.team.findUnique({
					where: { name: value.name },
				});

				if (nameConflict) {
					return res.status(400).json({
						error: "Team name taken",
						message: "A team with this name already exists",
					});
				}
			}

			const updatedTeam = await prisma.team.update({
				where: { id },
				data: value,
			});

			res.json({
				success: true,
				message: "Team updated successfully",
				data: updatedTeam,
			});
		} catch (error) {
			next(error);
		}
	}
);

// Delete team (admins only)
router.delete(
	"/:id",
	authenticateToken,
	requireManager,
	async (req, res, next) => {
		try {
			const { id } = req.params;

			// Check if team exists
			const team = await prisma.team.findUnique({
				where: { id },
				include: {
					_count: {
						select: {
							players: true,
							homeMatches: true,
							awayMatches: true,
						},
					},
				},
			});

			if (!team) {
				return res.status(404).json({
					error: "Team not found",
					message: "Team with the specified ID does not exist",
				});
			}

			// Check if team has players or matches
			if (
				team._count.players > 0 ||
				team._count.homeMatches > 0 ||
				team._count.awayMatches > 0
			) {
				return res.status(400).json({
					error: "Cannot delete team",
					message: "Team has players or matches associated with it",
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
			next(error);
		}
	}
);

// Get team statistics
router.get("/:id/stats", async (req, res, next) => {
	try {
		const { id } = req.params;
		const { seasonId } = req.query;

		// Check if team exists
		const team = await prisma.team.findUnique({
			where: { id },
		});

		if (!team) {
			return res.status(404).json({
				error: "Team not found",
				message: "Team with the specified ID does not exist",
			});
		}

		// Build where clause for season stats
		const whereClause = { teamId: id };
		if (seasonId) {
			whereClause.seasonId = seasonId;
		}

		// Get team season statistics
		const seasonStats = await prisma.playerSeasonStat.findMany({
			where: whereClause,
			include: {
				player: {
					select: {
						id: true,
						gamertag: true,
						position: true,
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

		// Calculate team totals
		const teamTotals = seasonStats.reduce(
			(acc, stat) => {
				acc.totalGoals += stat.totalGoals;
				acc.totalAssists += stat.totalAssists;
				acc.totalShots += stat.totalShots;
				acc.totalPasses += stat.totalPasses;
				acc.totalTackles += stat.totalTackles;
				acc.totalInterceptions += stat.totalInterceptions;
				acc.totalSaves += stat.totalSaves;
				acc.cleanSheets += stat.cleanSheets;
				acc.matchesPlayed += stat.matchesPlayed;
				return acc;
			},
			{
				totalGoals: 0,
				totalAssists: 0,
				totalShots: 0,
				totalPasses: 0,
				totalTackles: 0,
				totalInterceptions: 0,
				totalSaves: 0,
				cleanSheets: 0,
				matchesPlayed: 0,
			}
		);

		// Calculate averages
		const playerCount = seasonStats.length;
		if (playerCount > 0) {
			teamTotals.avgPassAccuracy =
				seasonStats.reduce((sum, stat) => sum + stat.avgPassAccuracy, 0) /
				playerCount;
			teamTotals.avgRating =
				seasonStats.reduce((sum, stat) => sum + stat.avgRating, 0) /
				playerCount;
		}

		res.json({
			success: true,
			data: {
				team,
				seasonStats,
				teamTotals,
				playerCount,
			},
		});
	} catch (error) {
		next(error);
	}
});

module.exports = router;
