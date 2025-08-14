const express = require("express");
const Joi = require("joi");
const { prisma } = require("../database/prisma");
const { authenticateToken, requireManager } = require("../middleware/auth");

const router = express.Router();

// Validation schemas
const updatePlayerSchema = Joi.object({
	realName: Joi.string().optional(),
	position: Joi.string()
		.valid(
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
			"CF"
		)
		.optional(),
	teamId: Joi.string().optional().allow(null),
});

const assignTeamSchema = Joi.object({
	teamId: Joi.string().required(),
});

// Get all players with pagination and filtering
router.get("/", async (req, res, next) => {
	try {
		const {
			page = 1,
			limit = 20,
			teamId,
			position,
			search,
			sortBy = "gamertag",
			sortOrder = "asc",
		} = req.query;

		const skip = (parseInt(page) - 1) * parseInt(limit);

		// Build where clause
		const where = {};

		if (teamId) where.teamId = teamId;
		if (position) where.position = position;
		if (search) {
			where.OR = [
				{ gamertag: { contains: search, mode: "insensitive" } },
				{ realName: { contains: search, mode: "insensitive" } },
			];
		}

		// Build order by clause
		const orderBy = {};
		orderBy[sortBy] = sortOrder;

		const [players, total] = await Promise.all([
			prisma.player.findMany({
				where,
				skip,
				take: parseInt(limit),
				orderBy,
				include: {
					user: {
						select: {
							username: true,
							email: true,
							role: true,
						},
					},
					team: {
						select: {
							id: true,
							name: true,
							logoUrl: true,
						},
					},
				},
			}),
			prisma.player.count({ where }),
		]);

		res.json({
			success: true,
			data: players,
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

// Get player by ID
router.get("/:id", async (req, res, next) => {
	try {
		const { id } = req.params;

		const player = await prisma.player.findUnique({
			where: { id },
			include: {
				user: {
					select: {
						username: true,
						email: true,
						role: true,
						createdAt: true,
					},
				},
				team: {
					select: {
						id: true,
						name: true,
						logoUrl: true,
					},
				},
			},
		});

		if (!player) {
			return res.status(404).json({
				error: "Player not found",
				message: "Player with the specified ID does not exist",
			});
		}

		res.json({
			success: true,
			data: player,
		});
	} catch (error) {
		next(error);
	}
});

// Update player (managers and admins only)
router.put(
	"/:id",
	authenticateToken,
	requireManager,
	async (req, res, next) => {
		try {
			const { id } = req.params;
			const { error, value } = updatePlayerSchema.validate(req.body);

			if (error) {
				return res.status(400).json({
					error: "Validation error",
					message: error.details[0].message,
				});
			}

			// Check if player exists
			const existingPlayer = await prisma.player.findUnique({
				where: { id },
			});

			if (!existingPlayer) {
				return res.status(404).json({
					error: "Player not found",
					message: "Player with the specified ID does not exist",
				});
			}

			// If assigning to a team, check if team exists
			if (value.teamId) {
				const team = await prisma.team.findUnique({
					where: { id: value.teamId },
				});

				if (!team) {
					return res.status(400).json({
						error: "Team not found",
						message: "Team with the specified ID does not exist",
					});
				}
			}

			const updatedPlayer = await prisma.player.update({
				where: { id },
				data: value,
				include: {
					user: {
						select: {
							username: true,
							email: true,
							role: true,
						},
					},
					team: {
						select: {
							id: true,
							name: true,
							logoUrl: true,
						},
					},
				},
			});

			res.json({
				success: true,
				message: "Player updated successfully",
				data: updatedPlayer,
			});
		} catch (error) {
			next(error);
		}
	}
);

// Assign player to team (managers and admins only)
router.post(
	"/:id/assign-team",
	authenticateToken,
	requireManager,
	async (req, res, next) => {
		try {
			const { id } = req.params;
			const { error, value } = assignTeamSchema.validate(req.body);

			if (error) {
				return res.status(400).json({
					error: "Validation error",
					message: error.details[0].message,
				});
			}

			const { teamId } = value;

			// Check if player exists
			const player = await prisma.player.findUnique({
				where: { id },
			});

			if (!player) {
				return res.status(404).json({
					error: "Player not found",
					message: "Player with the specified ID does not exist",
				});
			}

			// Check if team exists
			const team = await prisma.team.findUnique({
				where: { id: teamId },
			});

			if (!team) {
				return res.status(400).json({
					error: "Team not found",
					message: "Team with the specified ID does not exist",
				});
			}

			// Update player's team
			const updatedPlayer = await prisma.player.update({
				where: { id },
				data: { teamId },
				include: {
					user: {
						select: {
							username: true,
							email: true,
							role: true,
						},
					},
					team: {
						select: {
							id: true,
							name: true,
							logoUrl: true,
						},
					},
				},
			});

			res.json({
				success: true,
				message: "Player assigned to team successfully",
				data: updatedPlayer,
			});
		} catch (error) {
			next(error);
		}
	}
);

// Remove player from team (managers and admins only)
router.delete(
	"/:id/remove-team",
	authenticateToken,
	requireManager,
	async (req, res, next) => {
		try {
			const { id } = req.params;

			// Check if player exists
			const player = await prisma.player.findUnique({
				where: { id },
			});

			if (!player) {
				return res.status(404).json({
					error: "Player not found",
					message: "Player with the specified ID does not exist",
				});
			}

			if (!player.teamId) {
				return res.status(400).json({
					error: "Player not on team",
					message: "Player is not currently assigned to any team",
				});
			}

			// Remove player from team
			const updatedPlayer = await prisma.player.update({
				where: { id },
				data: { teamId: null },
				include: {
					user: {
						select: {
							username: true,
							email: true,
							role: true,
						},
					},
					team: null,
				},
			});

			res.json({
				success: true,
				message: "Player removed from team successfully",
				data: updatedPlayer,
			});
		} catch (error) {
			next(error);
		}
	}
);

// Get player statistics
router.get("/:id/stats", async (req, res, next) => {
	try {
		const { id } = req.params;
		const { seasonId } = req.query;

		// Check if player exists
		const player = await prisma.player.findUnique({
			where: { id },
		});

		if (!player) {
			return res.status(404).json({
				error: "Player not found",
				message: "Player with the specified ID does not exist",
			});
		}

		// Build where clause for season stats
		const whereClause = { playerId: id };
		if (seasonId) {
			whereClause.seasonId = seasonId;
		}

		// Get player season statistics
		const seasonStats = await prisma.playerSeasonStat.findMany({
			where: whereClause,
			include: {
				season: {
					select: {
						id: true,
						name: true,
						startDate: true,
						endDate: true,
					},
				},
				team: {
					select: {
						id: true,
						name: true,
						logoUrl: true,
					},
				},
			},
			orderBy: { season: { startDate: "desc" } },
		});

		// Get player match statistics
		const matchStats = await prisma.playerMatchStat.findMany({
			where: { playerId: id },
			include: {
				match: {
					select: {
						id: true,
						date: true,
						homeTeam: { select: { name: true } },
						awayTeam: { select: { name: true } },
						homeScore: true,
						awayScore: true,
					},
				},
				team: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: { match: { date: "desc" } },
			take: 10, // Last 10 matches
		});

		res.json({
			success: true,
			data: {
				player: {
					id: player.id,
					gamertag: player.gamertag,
					realName: player.realName,
					position: player.position,
					team: player.teamId
						? {
								id: player.teamId,
								name: player.team?.name,
						  }
						: null,
				},
				seasonStats,
				recentMatches: matchStats,
			},
		});
	} catch (error) {
		next(error);
	}
});

// Get players by position
router.get("/position/:position", async (req, res, next) => {
	try {
		const { position } = req.params;
		const { page = 1, limit = 20, teamId } = req.query;

		const skip = (parseInt(page) - 1) * parseInt(limit);

		// Validate position
		const validPositions = [
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
		];
		if (!validPositions.includes(position)) {
			return res.status(400).json({
				error: "Invalid position",
				message: "Position must be one of: " + validPositions.join(", "),
			});
		}

		// Build where clause
		const where = { position };
		if (teamId) where.teamId = teamId;

		const [players, total] = await Promise.all([
			prisma.player.findMany({
				where,
				skip,
				take: parseInt(limit),
				orderBy: { gamertag: "asc" },
				include: {
					team: {
						select: {
							id: true,
							name: true,
							logoUrl: true,
						},
					},
				},
			}),
			prisma.player.count({ where }),
		]);

		res.json({
			success: true,
			data: players,
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

module.exports = router;
