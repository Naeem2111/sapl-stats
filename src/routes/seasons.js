const express = require("express");
const Joi = require("joi");
const { prisma } = require("../database/prisma");
const { authenticateToken, requireManager } = require("../middleware/auth");

const router = express.Router();

// Validation schemas
const createSeasonSchema = Joi.object({
	name: Joi.string().min(2).max(100).required(),
	startDate: Joi.date().required(),
	endDate: Joi.date().greater(Joi.ref("startDate")).required(),
});

const updateSeasonSchema = Joi.object({
	name: Joi.string().min(2).max(100).optional(),
	startDate: Joi.date().optional(),
	endDate: Joi.date().optional(),
});

// Get all seasons
router.get("/", async (req, res, next) => {
	try {
		const { page = 1, limit = 20, active } = req.query;
		const skip = (parseInt(page) - 1) * parseInt(limit);

		// Build where clause
		const where = {};
		if (active === "true") {
			const now = new Date();
			where.AND = [{ startDate: { lte: now } }, { endDate: { gte: now } }];
		} else if (active === "false") {
			const now = new Date();
			where.OR = [{ startDate: { gt: now } }, { endDate: { lt: now } }];
		}

		const [seasons, total] = await Promise.all([
			prisma.season.findMany({
				where,
				skip,
				take: parseInt(limit),
				orderBy: { startDate: "desc" },
				include: {
					_count: {
						select: {
							matches: true,
							playerSeasonStats: true,
						},
					},
				},
			}),
			prisma.season.count({ where }),
		]);

		res.json({
			success: true,
			data: seasons,
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

// Get season by ID
router.get("/:id", async (req, res, next) => {
	try {
		const { id } = req.params;

		const season = await prisma.season.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						matches: true,
						playerSeasonStats: true,
					},
				},
			},
		});

		if (!season) {
			return res.status(404).json({
				error: "Season not found",
				message: "Season with the specified ID does not exist",
			});
		}

		res.json({
			success: true,
			data: season,
		});
	} catch (error) {
		next(error);
	}
});

// Create new season (managers and admins only)
router.post("/", authenticateToken, requireManager, async (req, res, next) => {
	try {
		const { error, value } = createSeasonSchema.validate(req.body);
		if (error) {
			return res.status(400).json({
				error: "Validation error",
				message: error.details[0].message,
			});
		}

		const { name, startDate, endDate } = value;

		// Check if season name already exists
		const existingSeason = await prisma.season.findUnique({
			where: { name },
		});

		if (existingSeason) {
			return res.status(400).json({
				error: "Season name taken",
				message: "A season with this name already exists",
			});
		}

		const season = await prisma.season.create({
			data: {
				name,
				startDate: new Date(startDate),
				endDate: new Date(endDate),
			},
		});

		res.status(201).json({
			success: true,
			message: "Season created successfully",
			data: season,
		});
	} catch (error) {
		next(error);
	}
});

// Update season (managers and admins only)
router.put(
	"/:id",
	authenticateToken,
	requireManager,
	async (req, res, next) => {
		try {
			const { id } = req.params;
			const { error, value } = updateSeasonSchema.validate(req.body);

			if (error) {
				return res.status(400).json({
					error: "Validation error",
					message: error.details[0].message,
				});
			}

			// Check if season exists
			const existingSeason = await prisma.season.findUnique({
				where: { id },
			});

			if (!existingSeason) {
				return res.status(404).json({
					error: "Season not found",
					message: "Season with the specified ID does not exist",
				});
			}

			// Validate date logic if both dates are being updated
			if (value.startDate && value.endDate) {
				if (new Date(value.startDate) >= new Date(value.endDate)) {
					return res.status(400).json({
						error: "Invalid dates",
						message: "End date must be after start date",
					});
				}
			}

			// If only one date is being updated, validate against existing date
			if (value.startDate && !value.endDate) {
				if (new Date(value.startDate) >= existingSeason.endDate) {
					return res.status(400).json({
						error: "Invalid start date",
						message: "Start date must be before end date",
					});
				}
			}

			if (value.endDate && !value.startDate) {
				if (existingSeason.startDate >= new Date(value.endDate)) {
					return res.status(400).json({
						error: "Invalid end date",
						message: "End date must be after start date",
					});
				}
			}

			// Check if new name conflicts with existing season
			if (value.name && value.name !== existingSeason.name) {
				const nameConflict = await prisma.season.findUnique({
					where: { name: value.name },
				});

				if (nameConflict) {
					return res.status(400).json({
						error: "Season name taken",
						message: "A season with this name already exists",
					});
				}
			}

			const updatedSeason = await prisma.season.update({
				where: { id },
				data: value,
			});

			res.json({
				success: true,
				message: "Season updated successfully",
				data: updatedSeason,
			});
		} catch (error) {
			next(error);
		}
	}
);

// Delete season (admins only)
router.delete(
	"/:id",
	authenticateToken,
	requireManager,
	async (req, res, next) => {
		try {
			const { id } = req.params;

			// Check if season exists
			const season = await prisma.season.findUnique({
				where: { id },
				include: {
					_count: {
						select: {
							matches: true,
							playerSeasonStats: true,
						},
					},
				},
			});

			if (!season) {
				return res.status(404).json({
					error: "Season not found",
					message: "Season with the specified ID does not exist",
				});
			}

			// Check if season has matches or statistics
			if (season._count.matches > 0 || season._count.playerSeasonStats > 0) {
				return res.status(400).json({
					error: "Cannot delete season",
					message: "Season has matches or player statistics associated with it",
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
			next(error);
		}
	}
);

// Get current/active season
router.get("/current/active", async (req, res, next) => {
	try {
		const now = new Date();

		const activeSeason = await prisma.season.findFirst({
			where: {
				AND: [{ startDate: { lte: now } }, { endDate: { gte: now } }],
			},
			include: {
				_count: {
					select: {
						matches: true,
						playerSeasonStats: true,
					},
				},
			},
		});

		if (!activeSeason) {
			return res.status(404).json({
				error: "No active season",
				message: "There is currently no active season",
			});
		}

		res.json({
			success: true,
			data: activeSeason,
		});
	} catch (error) {
		next(error);
	}
});

// Get upcoming seasons
router.get("/upcoming", async (req, res, next) => {
	try {
		const { limit = 5 } = req.query;
		const now = new Date();

		const upcomingSeasons = await prisma.season.findMany({
			where: {
				startDate: { gt: now },
			},
			take: parseInt(limit),
			orderBy: { startDate: "asc" },
		});

		res.json({
			success: true,
			data: upcomingSeasons,
		});
	} catch (error) {
		next(error);
	}
});

// Get season summary
router.get("/:id/summary", async (req, res, next) => {
	try {
		const { id } = req.params;

		// Check if season exists
		const season = await prisma.season.findUnique({
			where: { id },
		});

		if (!season) {
			return res.status(404).json({
				error: "Season not found",
				message: "Season with the specified ID does not exist",
			});
		}

		// Get season statistics
		const [matchCount, playerCount, teamCount] = await Promise.all([
			prisma.match.count({ where: { seasonId: id } }),
			prisma.playerSeasonStat.count({ where: { seasonId: id } }),
			prisma.playerSeasonStat.groupBy({
				by: ["teamId"],
				where: { seasonId: id },
				_count: { teamId: true },
			}),
		]);

		const summary = {
			season,
			matchCount,
			playerCount,
			teamCount: teamCount.length,
			isActive: season.startDate <= new Date() && season.endDate >= new Date(),
			isUpcoming: season.startDate > new Date(),
			isPast: season.endDate < new Date(),
		};

		res.json({
			success: true,
			data: summary,
		});
	} catch (error) {
		next(error);
	}
});

module.exports = router;
