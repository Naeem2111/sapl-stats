const express = require("express");
const bcrypt = require("bcryptjs");
const { prisma } = require("../database/prisma");
const {
	authenticateToken,
	requireCompetitionAdmin,
	requireLeagueAdmin,
} = require("../middleware/auth");

const router = express.Router();

// Get all users (COMPETITION_ADMIN, LEAGUE_ADMIN only)
router.get("/", authenticateToken, requireLeagueAdmin, async (req, res) => {
	try {
		const { role, search, page = 1, limit = 20 } = req.query;
		const skip = (parseInt(page) - 1) * parseInt(limit);

		// Build where clause
		const where = {};
		if (role && role !== "all") {
			where.role = role;
		}
		if (search) {
			where.OR = [
				{ username: { contains: search, mode: "insensitive" } },
				{ email: { contains: search, mode: "insensitive" } },
			];
		}

		// Get users with pagination
		const [users, totalUsers] = await Promise.all([
			prisma.user.findMany({
				where,
				select: {
					id: true,
					username: true,
					email: true,
					role: true,
					createdAt: true,
					updatedAt: true,
					players: {
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
				orderBy: {
					createdAt: "desc",
				},
				skip,
				take: parseInt(limit),
			}),
			prisma.user.count({ where }),
		]);

		// Calculate pagination info
		const totalPages = Math.ceil(totalUsers / parseInt(limit));
		const hasNextPage = parseInt(page) < totalPages;
		const hasPrevPage = parseInt(page) > 1;

		res.json({
			success: true,
			data: {
				users,
				pagination: {
					currentPage: parseInt(page),
					totalPages,
					totalUsers,
					hasNextPage,
					hasPrevPage,
					limit: parseInt(limit),
				},
			},
		});
	} catch (error) {
		console.error("Error fetching users:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Get user by ID (COMPETITION_ADMIN, LEAGUE_ADMIN only)
router.get("/:id", authenticateToken, requireLeagueAdmin, async (req, res) => {
	try {
		const { id } = req.params;

		const user = await prisma.user.findUnique({
			where: { id },
			select: {
				id: true,
				username: true,
				email: true,
				role: true,
				createdAt: true,
				updatedAt: true,
				players: {
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
		});

		if (!user) {
			return res.status(404).json({
				success: false,
				error: {
					message: "User not found",
				},
			});
		}

		res.json({
			success: true,
			data: user,
		});
	} catch (error) {
		console.error("Error fetching user:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Create new user (COMPETITION_ADMIN only)
router.post(
	"/",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const {
				username,
				email,
				password,
				role,
				gamertag,
				realName,
				position,
				teamId,
			} = req.body;

			if (!username || !email || !password || !role) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Username, email, password, and role are required",
					},
				});
			}

			// Validate role
			const validRoles = [
				"PLAYER",
				"TEAM_ADMIN",
				"LEAGUE_ADMIN",
				"COMPETITION_ADMIN",
			];
			if (!validRoles.includes(role)) {
				return res.status(400).json({
					success: false,
					error: {
						message:
							"Invalid role. Must be one of: PLAYER, TEAM_ADMIN, LEAGUE_ADMIN, COMPETITION_ADMIN",
					},
				});
			}

			// Check if user already exists
			const existingUser = await prisma.user.findFirst({
				where: {
					OR: [{ email }, { username }],
				},
			});

			if (existingUser) {
				return res.status(400).json({
					success: false,
					error: {
						message: "User with this email or username already exists",
					},
				});
			}

			// Hash password
			const passwordHash = await bcrypt.hash(password, 12);

			// Create user and player in a transaction
			const result = await prisma.$transaction(async (tx) => {
				const user = await tx.user.create({
					data: {
						username,
						email,
						passwordHash,
						role,
					},
				});

				// Create associated player profile if gamertag is provided
				let player = null;
				if (gamertag) {
					player = await tx.player.create({
						data: {
							gamertag,
							realName: realName || null,
							position: position || null,
							userId: user.id,
							teamId: teamId || null,
						},
					});
				}

				return { user, player };
			});

			res.status(201).json({
				success: true,
				message: "User created successfully",
				data: {
					user: {
						id: result.user.id,
						username: result.user.username,
						email: result.user.email,
						role: result.user.role,
					},
					player: result.player,
				},
			});
		} catch (error) {
			console.error("Error creating user:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Update user (COMPETITION_ADMIN only)
router.put(
	"/:id",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const { id } = req.params;
			const { username, email, role, gamertag, realName, position, teamId } =
				req.body;

			// Check if user exists
			const existingUser = await prisma.user.findUnique({
				where: { id },
				include: {
					players: true,
				},
			});

			if (!existingUser) {
				return res.status(404).json({
					success: false,
					error: {
						message: "User not found",
					},
				});
			}

			// Validate role if provided
			if (role) {
				const validRoles = [
					"PLAYER",
					"TEAM_ADMIN",
					"LEAGUE_ADMIN",
					"COMPETITION_ADMIN",
				];
				if (!validRoles.includes(role)) {
					return res.status(400).json({
						success: false,
						error: {
							message:
								"Invalid role. Must be one of: PLAYER, TEAM_ADMIN, LEAGUE_ADMIN, COMPETITION_ADMIN",
						},
					});
				}
			}

			// Check for conflicts if username or email is being changed
			if (username && username !== existingUser.username) {
				const usernameConflict = await prisma.user.findUnique({
					where: { username },
				});

				if (usernameConflict) {
					return res.status(400).json({
						success: false,
						error: {
							message: "Username already taken",
						},
					});
				}
			}

			if (email && email !== existingUser.email) {
				const emailConflict = await prisma.user.findUnique({
					where: { email },
				});

				if (emailConflict) {
					return res.status(400).json({
						success: false,
						error: {
							message: "Email already taken",
						},
					});
				}
			}

			// Update user and player in a transaction
			const result = await prisma.$transaction(async (tx) => {
				const updatedUser = await tx.user.update({
					where: { id },
					data: {
						username: username || existingUser.username,
						email: email || existingUser.email,
						role: role || existingUser.role,
					},
				});

				// Update or create player profile
				let updatedPlayer = null;
				if (existingUser.players.length > 0) {
					// Update existing player
					updatedPlayer = await tx.player.update({
						where: { id: existingUser.players[0].id },
						data: {
							gamertag: gamertag || existingUser.players[0].gamertag,
							realName:
								realName !== undefined
									? realName
									: existingUser.players[0].realName,
							position: position || existingUser.players[0].position,
							teamId:
								teamId !== undefined ? teamId : existingUser.players[0].teamId,
						},
					});
				} else if (gamertag) {
					// Create new player profile
					updatedPlayer = await tx.player.create({
						data: {
							gamertag,
							realName: realName || null,
							position: position || null,
							userId: id,
							teamId: teamId || null,
						},
					});
				}

				return { user: updatedUser, player: updatedPlayer };
			});

			res.json({
				success: true,
				message: "User updated successfully",
				data: {
					user: {
						id: result.user.id,
						username: result.user.username,
						email: result.user.email,
						role: result.user.role,
					},
					player: result.player,
				},
			});
		} catch (error) {
			console.error("Error updating user:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Delete user (COMPETITION_ADMIN only)
router.delete(
	"/:id",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const { id } = req.params;

			// Check if user exists
			const existingUser = await prisma.user.findUnique({
				where: { id },
				include: {
					players: {
						include: {
							playerMatchStats: true,
							playerSeasonStats: true,
							awardedBadges: true,
						},
					},
				},
			});

			if (!existingUser) {
				return res.status(404).json({
					success: false,
					error: {
						message: "User not found",
					},
				});
			}

			// Check if user has associated data
			if (existingUser.players.length > 0) {
				const player = existingUser.players[0];

				if (
					player.playerMatchStats.length > 0 ||
					player.playerSeasonStats.length > 0 ||
					player.awardedBadges.length > 0
				) {
					return res.status(400).json({
						success: false,
						error: {
							message:
								"Cannot delete user with associated match statistics or badges",
						},
					});
				}
			}

			// Delete user and associated data in a transaction
			await prisma.$transaction(async (tx) => {
				// Delete player profile if it exists
				if (existingUser.players.length > 0) {
					await tx.player.delete({
						where: { id: existingUser.players[0].id },
					});
				}

				// Delete user
				await tx.user.delete({
					where: { id },
				});
			});

			res.json({
				success: true,
				message: "User deleted successfully",
			});
		} catch (error) {
			console.error("Error deleting user:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Change user password (COMPETITION_ADMIN only)
router.put(
	"/:id/password",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const { id } = req.params;
			const { newPassword } = req.body;

			if (!newPassword || newPassword.length < 6) {
				return res.status(400).json({
					success: false,
					error: {
						message: "New password must be at least 6 characters long",
					},
				});
			}

			// Check if user exists
			const existingUser = await prisma.user.findUnique({
				where: { id },
			});

			if (!existingUser) {
				return res.status(404).json({
					success: false,
					error: {
						message: "User not found",
					},
				});
			}

			// Hash new password
			const newPasswordHash = await bcrypt.hash(newPassword, 12);

			// Update password
			await prisma.user.update({
				where: { id },
				data: { passwordHash: newPasswordHash },
			});

			res.json({
				success: true,
				message: "User password changed successfully",
			});
		} catch (error) {
			console.error("Error changing user password:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}
);

// Get user statistics (COMPETITION_ADMIN, LEAGUE_ADMIN only)
router.get(
	"/:id/stats",
	authenticateToken,
	requireLeagueAdmin,
	async (req, res) => {
		try {
			const { id } = req.params;
			const { season } = req.query;

			// Check if user exists
			const user = await prisma.user.findUnique({
				where: { id },
				include: {
					players: {
						include: {
							team: true,
							playerMatchStats: {
								where:
									season && season !== "all"
										? {
												match: { seasonId: season },
										  }
										: {},
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
								},
							},
							playerSeasonStats:
								season && season !== "all"
									? {
											where: { seasonId: season },
									  }
									: {},
							awardedBadges:
								season && season !== "all"
									? {
											where: { seasonId: season },
									  }
									: {},
						},
					},
				},
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					error: {
						message: "User not found",
					},
				});
			}

			// Calculate user statistics
			const player = user.players[0];
			if (!player) {
				return res.json({
					success: true,
					data: {
						user: {
							id: user.id,
							username: user.username,
							email: user.email,
							role: user.role,
						},
						player: null,
						statistics: {
							matches: 0,
							goals: 0,
							assists: 0,
							cleanSheets: 0,
							badges: 0,
						},
					},
				});
			}

			const totalMatches = player.playerMatchStats.length;
			const totalGoals = player.playerMatchStats.reduce(
				(sum, stat) => sum + (stat.goals || 0),
				0
			);
			const totalAssists = player.playerMatchStats.reduce(
				(sum, stat) => sum + (stat.assists || 0),
				0
			);
			const totalCleanSheets = player.playerMatchStats.reduce(
				(sum, stat) => sum + (stat.cleanSheets || 0),
				0
			);
			const totalBadges = player.awardedBadges.length;

			// Calculate match results
			let wins = 0;
			let draws = 0;
			let losses = 0;

			player.playerMatchStats.forEach((stat) => {
				if (stat.match) {
					const isHome = stat.match.homeTeam.name === player.team?.name;
					const teamScore = isHome
						? stat.match.homeScore
						: stat.match.awayScore;
					const opponentScore = isHome
						? stat.match.awayScore
						: stat.match.homeScore;

					if (teamScore > opponentScore) {
						wins++;
					} else if (teamScore === opponentScore) {
						draws++;
					} else {
						losses++;
					}
				}
			});

			const userStats = {
				user: {
					id: user.id,
					username: user.username,
					email: user.email,
					role: user.role,
				},
				player: {
					id: player.id,
					gamertag: player.gamertag,
					realName: player.realName,
					position: player.position,
					team: player.team,
				},
				statistics: {
					matches: totalMatches,
					goals: totalGoals,
					assists: totalAssists,
					cleanSheets: totalCleanSheets,
					badges: totalBadges,
					wins,
					draws,
					losses,
					winRate:
						totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0,
				},
				recentMatches: player.playerMatchStats
					.sort((a, b) => new Date(b.match.date) - new Date(a.match.date))
					.slice(0, 5)
					.map((stat) => ({
						date: stat.match.date,
						homeTeam: stat.match.homeTeam.name,
						awayTeam: stat.match.awayTeam.name,
						score: `${stat.match.homeScore}-${stat.match.awayScore}`,
						goals: stat.goals || 0,
						assists: stat.assists || 0,
					})),
			};

			res.json({
				success: true,
				data: userStats,
			});
		} catch (error) {
			console.error("Error fetching user stats:", error);
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
