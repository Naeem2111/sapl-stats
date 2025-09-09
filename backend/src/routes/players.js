const express = require("express");
const { prisma } = require("../database/prisma");
const {
	authenticateToken,
	requireTeamAdmin,
	requireLeagueAdmin,
} = require("../middleware/auth");

const router = express.Router();

// Get all players (public access)
router.get("/", async (req, res) => {
	try {
		const {
			team,
			league,
			position,
			search,
			page = 1,
			limit = 1000,
		} = req.query;
		const skip = (parseInt(page) - 1) * parseInt(limit);

		// Build where clause
		const where = {};

		// Team filtering
		if (team && team !== "all") {
			where.teamId = team;
		}

		// League filtering through team
		if (league && league !== "all") {
			where.team = {
				leagueId: league,
			};
		}

		// Position filtering
		if (position && position !== "all") {
			where.position = position;
		}

		// Search filtering
		if (search) {
			where.OR = [
				{ gamertag: { contains: search, mode: "insensitive" } },
				{ realName: { contains: search, mode: "insensitive" } },
				{ firstName: { contains: search, mode: "insensitive" } },
				{ lastName: { contains: search, mode: "insensitive" } },
			];
		}

		// Get players with team and user information
		const [players, totalPlayers] = await Promise.all([
			prisma.player.findMany({
				where,
				include: {
					team: {
						select: {
							id: true,
							name: true,
							logoUrl: true,
							league: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
					user: {
						select: {
							id: true,
							username: true,
							email: true,
						},
					},
				},
				skip,
				take: parseInt(limit),
				orderBy: { gamertag: "asc" },
			}),
			prisma.player.count({ where }),
		]);

		// Calculate pagination info
		const totalPages = Math.ceil(totalPlayers / parseInt(limit));
		const hasNextPage = parseInt(page) < totalPages;
		const hasPrevPage = parseInt(page) > 1;

		res.json({
			success: true,
			data: players,
			pagination: {
				currentPage: parseInt(page),
				totalPages,
				totalPlayers,
				hasNextPage,
				hasPrevPage,
				limit: parseInt(limit),
			},
		});
	} catch (error) {
		console.error("Error fetching players:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Get player by ID (public access)
router.get("/:id", async (req, res) => {
	try {
		const { id } = req.params;

		const player = await prisma.player.findUnique({
			where: { id },
			include: {
				team: {
					select: {
						id: true,
						name: true,
						logoUrl: true,
						league: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
				user: {
					select: {
						id: true,
						username: true,
						email: true,
					},
				},
				playerMatchStats: {
					include: {
						match: {
							select: {
								id: true,
								date: true,
								homeTeam: {
									select: {
										name: true,
									},
								},
								awayTeam: {
									select: {
										name: true,
									},
								},
							},
						},
					},
					orderBy: {
						match: {
							date: "desc",
						},
					},
					take: 10, // Last 10 matches
				},
			},
		});

		if (!player) {
			return res.status(404).json({
				success: false,
				error: {
					message: "Player not found",
				},
			});
		}

		res.json({
			success: true,
			data: player,
		});
	} catch (error) {
		console.error("Error fetching player:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Create new player (Team Admin and above)
router.post("/", authenticateToken, requireTeamAdmin, async (req, res) => {
	try {
		const {
			gamertag,
			realName,
			firstName,
			lastName,
			position,
			teamId,
			userId,
		} = req.body;

		// Validate required fields
		if (!gamertag || !teamId) {
			return res.status(400).json({
				success: false,
				error: {
					message: "Missing required fields: gamertag, teamId",
				},
			});
		}

		// Check if team exists
		const team = await prisma.team.findUnique({
			where: { id: teamId },
		});

		if (!team) {
			return res.status(400).json({
				success: false,
				error: {
					message: "Team not found",
				},
			});
		}

		// Check if user exists (if provided)
		if (userId) {
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});

			if (!user) {
				return res.status(400).json({
					success: false,
					error: {
						message: "User not found",
					},
				});
			}
		}

		const player = await prisma.player.create({
			data: {
				gamertag,
				realName,
				firstName,
				lastName,
				position,
				teamId,
				userId,
			},
			include: {
				team: {
					select: {
						id: true,
						name: true,
						logoUrl: true,
					},
				},
				user: {
					select: {
						id: true,
						username: true,
						email: true,
					},
				},
			},
		});

		res.status(201).json({
			success: true,
			data: player,
			message: "Player created successfully",
		});
	} catch (error) {
		console.error("Error creating player:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Failed to create player",
			},
		});
	}
});

// Update player (Team Admin and above)
router.put("/:id", authenticateToken, requireTeamAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const {
			gamertag,
			realName,
			firstName,
			lastName,
			position,
			teamId,
			userId,
		} = req.body;

		// Check if player exists
		const existingPlayer = await prisma.player.findUnique({
			where: { id },
		});

		if (!existingPlayer) {
			return res.status(404).json({
				success: false,
				error: {
					message: "Player not found",
				},
			});
		}

		// Check if team exists (if provided)
		if (teamId) {
			const team = await prisma.team.findUnique({
				where: { id: teamId },
			});

			if (!team) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Team not found",
					},
				});
			}
		}

		// Check if user exists (if provided)
		if (userId) {
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});

			if (!user) {
				return res.status(400).json({
					success: false,
					error: {
						message: "User not found",
					},
				});
			}
		}

		const player = await prisma.player.update({
			where: { id },
			data: {
				gamertag,
				realName,
				firstName,
				lastName,
				position,
				teamId,
				userId,
			},
			include: {
				team: {
					select: {
						id: true,
						name: true,
						logoUrl: true,
					},
				},
				user: {
					select: {
						id: true,
						username: true,
						email: true,
					},
				},
			},
		});

		res.json({
			success: true,
			data: player,
			message: "Player updated successfully",
		});
	} catch (error) {
		console.error("Error updating player:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Failed to update player",
			},
		});
	}
});

// Delete player (League Admin and above)
router.delete(
	"/:id",
	authenticateToken,
	requireLeagueAdmin,
	async (req, res) => {
		try {
			const { id } = req.params;

			// Check if player exists
			const player = await prisma.player.findUnique({
				where: { id },
			});

			if (!player) {
				return res.status(404).json({
					success: false,
					error: {
						message: "Player not found",
					},
				});
			}

			// Delete the player (cascade will handle related stats)
			await prisma.player.delete({ where: { id } });

			res.json({
				success: true,
				message: "Player deleted successfully",
			});
		} catch (error) {
			console.error("Error deleting player:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Failed to delete player",
				},
			});
		}
	}
);

module.exports = router;
