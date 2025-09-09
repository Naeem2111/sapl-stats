const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();

const prisma = new PrismaClient();

// Get all rating formulas
router.get("/formulas", async (req, res) => {
	try {
		const formulas = await prisma.ratingFormula.findMany({
			where: { isActive: true },
			orderBy: [{ position: "asc" }, { name: "asc" }],
		});

		res.json({ success: true, data: formulas });
	} catch (error) {
		console.error("Error fetching rating formulas:", error);
		res
			.status(500)
			.json({
				success: false,
				error: { message: "Failed to fetch rating formulas" },
			});
	}
});

// Create a new rating formula
router.post("/formulas", async (req, res) => {
	try {
		const { name, description, formula, position, color } = req.body;

		const newFormula = await prisma.ratingFormula.create({
			data: {
				name,
				description,
				formula,
				position: position || null,
				color: color || null,
			},
		});

		res.json({ success: true, data: newFormula });
	} catch (error) {
		console.error("Error creating rating formula:", error);
		res
			.status(500)
			.json({
				success: false,
				error: { message: "Failed to create rating formula" },
			});
	}
});

// Update a rating formula
router.put("/formulas/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { name, description, formula, position, color, isActive } = req.body;

		const updatedFormula = await prisma.ratingFormula.update({
			where: { id },
			data: {
				name,
				description,
				formula,
				position: position || null,
				color: color || null,
				isActive: isActive !== undefined ? isActive : true,
			},
		});

		res.json({ success: true, data: updatedFormula });
	} catch (error) {
		console.error("Error updating rating formula:", error);
		res
			.status(500)
			.json({
				success: false,
				error: { message: "Failed to update rating formula" },
			});
	}
});

// Delete a rating formula
router.delete("/formulas/:id", async (req, res) => {
	try {
		const { id } = req.params;

		await prisma.ratingFormula.delete({
			where: { id },
		});

		res.json({ success: true, message: "Rating formula deleted successfully" });
	} catch (error) {
		console.error("Error deleting rating formula:", error);
		res
			.status(500)
			.json({
				success: false,
				error: { message: "Failed to delete rating formula" },
			});
	}
});

// Get all position mappings
router.get("/position-mappings", async (req, res) => {
	try {
		const mappings = await prisma.positionMapping.findMany({
			where: { isActive: true },
			orderBy: [{ position: "asc" }, { formation: "asc" }],
		});

		res.json({ success: true, data: mappings });
	} catch (error) {
		console.error("Error fetching position mappings:", error);
		res
			.status(500)
			.json({
				success: false,
				error: { message: "Failed to fetch position mappings" },
			});
	}
});

// Create a new position mapping
router.post("/position-mappings", async (req, res) => {
	try {
		const { position, formation, mappedRole, description } = req.body;

		const newMapping = await prisma.positionMapping.create({
			data: {
				position,
				formation,
				mappedRole,
				description,
			},
		});

		res.json({ success: true, data: newMapping });
	} catch (error) {
		console.error("Error creating position mapping:", error);
		res
			.status(500)
			.json({
				success: false,
				error: { message: "Failed to create position mapping" },
			});
	}
});

// Update a position mapping
router.put("/position-mappings/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { position, formation, mappedRole, description, isActive } = req.body;

		const updatedMapping = await prisma.positionMapping.update({
			where: { id },
			data: {
				position,
				formation,
				mappedRole,
				description,
				isActive: isActive !== undefined ? isActive : true,
			},
		});

		res.json({ success: true, data: updatedMapping });
	} catch (error) {
		console.error("Error updating position mapping:", error);
		res
			.status(500)
			.json({
				success: false,
				error: { message: "Failed to update position mapping" },
			});
	}
});

// Delete a position mapping
router.delete("/position-mappings/:id", async (req, res) => {
	try {
		const { id } = req.params;

		await prisma.positionMapping.delete({
			where: { id },
		});

		res.json({
			success: true,
			message: "Position mapping deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting position mapping:", error);
		res
			.status(500)
			.json({
				success: false,
				error: { message: "Failed to delete position mapping" },
			});
	}
});

// Get all rating calculations
router.get("/calculations", async (req, res) => {
	try {
		const calculations = await prisma.ratingCalculation.findMany({
			include: {
				formula: true,
				season: { select: { id: true, name: true } },
				league: { select: { id: true, name: true } },
				team: { select: { id: true, name: true } },
				_count: {
					select: { playerRatings: true },
				},
			},
			orderBy: { createdAt: "desc" },
		});

		res.json({ success: true, data: calculations });
	} catch (error) {
		console.error("Error fetching rating calculations:", error);
		res
			.status(500)
			.json({
				success: false,
				error: { message: "Failed to fetch rating calculations" },
			});
	}
});

// Create a new rating calculation
router.post("/calculations", async (req, res) => {
	try {
		const { name, type, fixtureRange, seasonId, leagueId, teamId, formulaId } =
			req.body;

		const newCalculation = await prisma.ratingCalculation.create({
			data: {
				name,
				type,
				fixtureRange: fixtureRange ? JSON.parse(fixtureRange) : null,
				seasonId: seasonId || null,
				leagueId: leagueId || null,
				teamId: teamId || null,
				formulaId,
			},
			include: {
				formula: true,
				season: { select: { id: true, name: true } },
				league: { select: { id: true, name: true } },
				team: { select: { id: true, name: true } },
			},
		});

		res.json({ success: true, data: newCalculation });
	} catch (error) {
		console.error("Error creating rating calculation:", error);
		res
			.status(500)
			.json({
				success: false,
				error: { message: "Failed to create rating calculation" },
			});
	}
});

// Execute a rating calculation
router.post("/calculations/:id/execute", async (req, res) => {
	try {
		const { id } = req.params;
		const { formation } = req.body; // Optional formation for position mapping

		// Get the calculation
		const calculation = await prisma.ratingCalculation.findUnique({
			where: { id },
			include: { formula: true },
		});

		if (!calculation) {
			return res
				.status(404)
				.json({ success: false, error: { message: "Calculation not found" } });
		}

		// Get position mappings for the formation
		const positionMappings = await prisma.positionMapping.findMany({
			where: {
				formation: formation || "4-4-2", // Default formation
				isActive: true,
			},
		});

		// Get player match stats based on calculation criteria
		let whereClause = {};

		if (calculation.seasonId) {
			whereClause.match = { seasonId: calculation.seasonId };
		}
		if (calculation.leagueId) {
			whereClause.match = {
				...whereClause.match,
				leagueId: calculation.leagueId,
			};
		}
		if (calculation.teamId) {
			whereClause.teamId = calculation.teamId;
		}
		if (calculation.fixtureRange) {
			const { start, end } = calculation.fixtureRange;
			whereClause.match = {
				...whereClause.match,
				date: {
					gte: new Date(start),
					lte: new Date(end),
				},
			};
		}

		const playerStats = await prisma.playerMatchStat.findMany({
			where: whereClause,
			include: {
				player: {
					select: { id: true, gamertag: true, realName: true, position: true },
				},
				match: {
					select: {
						id: true,
						date: true,
						homeTeam: { select: { name: true } },
						awayTeam: { select: { name: true } },
					},
				},
			},
		});

		// Calculate ratings for each player
		const playerRatings = [];
		const formula = new Function(
			"stats",
			`return ${calculation.formula.formula}`
		);

		for (const stat of playerStats) {
			try {
				// Map position if formation is specified
				let mappedRole = null;
				if (formation) {
					const mapping = positionMappings.find(
						(m) =>
							m.position === stat.player.position && m.formation === formation
					);
					if (mapping) {
						mappedRole = mapping.mappedRole;
					}
				}

				// Prepare stats object for formula
				const stats = {
					goals: stat.goals,
					assists: stat.assists,
					shots: stat.shots,
					passes: stat.passes,
					passAccuracy: stat.passAccuracy,
					tackles: stat.tackles,
					interceptions: stat.interceptions,
					saves: stat.saves,
					cleanSheet: stat.cleanSheet,
					rating: stat.rating,
					minutesPlayed: stat.minutesPlayed,
					yellowCards: stat.yellowCards,
					redCards: stat.redCards,
					possessionLost: stat.possessionLost,
					possessionWon: stat.possessionWon,
					tackleSuccessRate: stat.tackleSuccessRate,
					savesSuccessRate: stat.savesSuccessRate,
					goalsConceded: stat.goalsConceded,
					xG: stat.xG,
					totalDuelSuccess: stat.totalDuelSuccess,
					playersBeatenByPass: stat.playersBeatenByPass,
					xA: stat.xA,
					tacklesAttempted: stat.tacklesAttempted,
					position: stat.player.position,
					mappedRole,
				};

				// Apply position-specific formula if exists
				let formulaToUse = calculation.formula.formula;
				if (
					calculation.formula.position &&
					calculation.formula.position !== stat.player.position
				) {
					// Skip if formula is position-specific and doesn't match
					continue;
				}

				const calculatedRating = formula(stats);

				playerRatings.push({
					calculationId: id,
					playerId: stat.player.id,
					matchId: stat.match.id,
					position: stat.player.position,
					mappedRole,
					baseStats: stats,
					calculatedRating,
					formulaUsed: formulaToUse,
				});
			} catch (error) {
				console.error(
					`Error calculating rating for player ${stat.player.gamertag}:`,
					error
				);
				continue;
			}
		}

		// Sort by calculated rating and assign ranks
		playerRatings.sort((a, b) => b.calculatedRating - a.calculatedRating);
		playerRatings.forEach((rating, index) => {
			rating.rank = index + 1;
		});

		// Clear existing ratings for this calculation
		await prisma.playerRating.deleteMany({
			where: { calculationId: id },
		});

		// Save new ratings
		const savedRatings = await prisma.playerRating.createMany({
			data: playerRatings,
		});

		res.json({
			success: true,
			data: {
				calculation,
				ratingsCount: savedRatings.count,
				message: `Successfully calculated ratings for ${savedRatings.count} players`,
			},
		});
	} catch (error) {
		console.error("Error executing rating calculation:", error);
		res
			.status(500)
			.json({
				success: false,
				error: { message: "Failed to execute rating calculation" },
			});
	}
});

// Get player ratings for a calculation
router.get("/calculations/:id/ratings", async (req, res) => {
	try {
		const { id } = req.params;
		const { limit = 50, offset = 0 } = req.query;

		const ratings = await prisma.playerRating.findMany({
			where: { calculationId: id },
			include: {
				player: {
					select: { id: true, gamertag: true, realName: true, position: true },
				},
				match: {
					select: {
						id: true,
						date: true,
						homeTeam: { select: { name: true } },
						awayTeam: { select: { name: true } },
					},
				},
			},
			orderBy: { rank: "asc" },
			take: parseInt(limit),
			skip: parseInt(offset),
		});

		const totalCount = await prisma.playerRating.count({
			where: { calculationId: id },
		});

		res.json({
			success: true,
			data: ratings,
			pagination: {
				total: totalCount,
				limit: parseInt(limit),
				offset: parseInt(offset),
			},
		});
	} catch (error) {
		console.error("Error fetching player ratings:", error);
		res
			.status(500)
			.json({
				success: false,
				error: { message: "Failed to fetch player ratings" },
			});
	}
});

// Delete a rating calculation
router.delete("/calculations/:id", async (req, res) => {
	try {
		const { id } = req.params;

		// Delete associated player ratings first
		await prisma.playerRating.deleteMany({
			where: { calculationId: id },
		});

		// Delete the calculation
		await prisma.ratingCalculation.delete({
			where: { id },
		});

		res.json({
			success: true,
			message: "Rating calculation deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting rating calculation:", error);
		res
			.status(500)
			.json({
				success: false,
				error: { message: "Failed to delete rating calculation" },
			});
	}
});

module.exports = router;
