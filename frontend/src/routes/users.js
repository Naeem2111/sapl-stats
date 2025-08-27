const express = require("express");
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const { prisma } = require("../database/prisma");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Validation schemas
const updateUserSchema = Joi.object({
	username: Joi.string().alphanum().min(3).max(30).optional(),
	email: Joi.string().email().optional(),
	role: Joi.string().valid("ADMIN", "MANAGER", "PLAYER").optional(),
});

const changePasswordSchema = Joi.object({
	currentPassword: Joi.string().required(),
	newPassword: Joi.string().min(6).required(),
});

// Get all users (admins only)
router.get("/", authenticateToken, requireAdmin, async (req, res, next) => {
	try {
		const {
			page = 1,
			limit = 20,
			role,
			search,
			sortBy = "createdAt",
			sortOrder = "desc",
		} = req.query;

		const skip = (parseInt(page) - 1) * parseInt(limit);

		// Build where clause
		const where = {};

		if (role) where.role = role;
		if (search) {
			where.OR = [
				{ username: { contains: search, mode: "insensitive" } },
				{ email: { contains: search, mode: "insensitive" } },
			];
		}

		// Build order by clause
		const orderBy = {};
		orderBy[sortBy] = sortOrder;

		const [users, total] = await Promise.all([
			prisma.user.findMany({
				where,
				skip,
				take: parseInt(limit),
				orderBy,
				select: {
					id: true,
					username: true,
					email: true,
					role: true,
					createdAt: true,
					updatedAt: true,
					_count: {
						select: {
							players: true,
						},
					},
				},
			}),
			prisma.user.count({ where }),
		]);

		res.json({
			success: true,
			data: users,
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

// Get user by ID
router.get("/:id", authenticateToken, async (req, res, next) => {
	try {
		const { id } = req.params;

		// Users can only view their own profile unless they're admin
		if (req.user.id !== id && req.user.role !== "ADMIN") {
			return res.status(403).json({
				error: "Access denied",
				message: "You can only view your own profile",
			});
		}

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
						position: true,
						realName: true,
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
				error: "User not found",
				message: "User with the specified ID does not exist",
			});
		}

		res.json({
			success: true,
			data: user,
		});
	} catch (error) {
		next(error);
	}
});

// Update user (users can update their own profile, admins can update any)
router.put("/:id", authenticateToken, async (req, res, next) => {
	try {
		const { id } = req.params;
		const { error, value } = updateUserSchema.validate(req.body);

		if (error) {
			return res.status(400).json({
				error: "Validation error",
				message: error.details[0].message,
			});
		}

		// Check if user exists
		const existingUser = await prisma.user.findUnique({
			where: { id },
		});

		if (!existingUser) {
			return res.status(404).json({
				error: "User not found",
				message: "User with the specified ID does not exist",
			});
		}

		// Users can only update their own profile unless they're admin
		if (req.user.id !== id && req.user.role !== "ADMIN") {
			return res.status(403).json({
				error: "Access denied",
				message: "You can only update your own profile",
			});
		}

		// Regular users cannot change their role
		if (value.role && req.user.role !== "ADMIN") {
			return res.status(403).json({
				error: "Access denied",
				message: "You cannot change your role",
			});
		}

		// Check if username or email conflicts
		if (value.username && value.username !== existingUser.username) {
			const usernameConflict = await prisma.user.findUnique({
				where: { username: value.username },
			});

			if (usernameConflict) {
				return res.status(400).json({
					error: "Username taken",
					message: "A user with this username already exists",
				});
			}
		}

		if (value.email && value.email !== existingUser.email) {
			const emailConflict = await prisma.user.findUnique({
				where: { email: value.email },
			});

			if (emailConflict) {
				return res.status(400).json({
					error: "Email taken",
					message: "A user with this email already exists",
				});
			}
		}

		const updatedUser = await prisma.user.update({
			where: { id },
			data: value,
			select: {
				id: true,
				username: true,
				email: true,
				role: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		res.json({
			success: true,
			message: "User updated successfully",
			data: updatedUser,
		});
	} catch (error) {
		next(error);
	}
});

// Change user password
router.put(
	"/:id/change-password",
	authenticateToken,
	async (req, res, next) => {
		try {
			const { id } = req.params;
			const { error, value } = changePasswordSchema.validate(req.body);

			if (error) {
				return res.status(400).json({
					error: "Validation error",
					message: error.details[0].message,
				});
			}

			// Users can only change their own password unless they're admin
			if (req.user.id !== id && req.user.role !== "ADMIN") {
				return res.status(403).json({
					error: "Access denied",
					message: "You can only change your own password",
				});
			}

			// Get current user with password hash
			const user = await prisma.user.findUnique({
				where: { id },
			});

			if (!user) {
				return res.status(404).json({
					error: "User not found",
					message: "User with the specified ID does not exist",
				});
			}

			// Verify current password (unless admin is changing someone else's password)
			if (req.user.id === id) {
				const isCurrentPasswordValid = await bcrypt.compare(
					value.currentPassword,
					user.passwordHash
				);
				if (!isCurrentPasswordValid) {
					return res.status(401).json({
						error: "Invalid password",
						message: "Current password is incorrect",
					});
				}
			}

			// Hash new password
			const saltRounds = 12;
			const newPasswordHash = await bcrypt.hash(value.newPassword, saltRounds);

			// Update password
			await prisma.user.update({
				where: { id },
				data: { passwordHash: newPasswordHash },
			});

			res.json({
				success: true,
				message: "Password changed successfully",
			});
		} catch (error) {
			next(error);
		}
	}
);

// Delete user (admins only)
router.delete(
	"/:id",
	authenticateToken,
	requireAdmin,
	async (req, res, next) => {
		try {
			const { id } = req.params;

			// Check if user exists
			const user = await prisma.user.findUnique({
				where: { id },
				include: {
					_count: {
						select: {
							players: true,
						},
					},
				},
			});

			if (!user) {
				return res.status(404).json({
					error: "User not found",
					message: "User with the specified ID does not exist",
				});
			}

			// Check if user has players
			if (user._count.players > 0) {
				return res.status(400).json({
					error: "Cannot delete user",
					message: "User has players associated with it",
				});
			}

			await prisma.user.delete({
				where: { id },
			});

			res.json({
				success: true,
				message: "User deleted successfully",
			});
		} catch (error) {
			next(error);
		}
	}
);

// Get user statistics
router.get("/:id/stats", authenticateToken, async (req, res, next) => {
	try {
		const { id } = req.params;

		// Users can only view their own stats unless they're admin
		if (req.user.id !== id && req.user.role !== "ADMIN") {
			return res.status(403).json({
				error: "Access denied",
				message: "You can only view your own statistics",
			});
		}

		// Check if user exists
		const user = await prisma.user.findUnique({
			where: { id },
		});

		if (!user) {
			return res.status(404).json({
				error: "User not found",
				message: "User with the specified ID does not exist",
			});
		}

		// Get user's player statistics
		const playerStats = await prisma.playerSeasonStat.findMany({
			where: {
				player: {
					userId: id,
				},
			},
			include: {
				player: {
					select: {
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
				team: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: { season: { startDate: "desc" } },
		});

		// Calculate user totals across all players
		const userTotals = playerStats.reduce(
			(acc, stat) => {
				acc.totalGoals += stat.totalGoals;
				acc.totalAssists += stat.totalAssists;
				acc.totalShots += stat.totalShots;
				acc.totalPasses += stat.totalPasses;
				acc.totalTackles += stat.totalTackles;
				acc.totalInterceptions += stat.totalInterceptions;
				acc.totalSaves += stat.totalSaves;
				acc.totalCleanSheets += stat.cleanSheets;
				acc.totalMatches += stat.matchesPlayed;
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
				totalCleanSheets: 0,
				totalMatches: 0,
			}
		);

		// Calculate averages
		const playerCount = playerStats.length;
		if (playerCount > 0) {
			userTotals.avgPassAccuracy =
				playerStats.reduce((sum, stat) => sum + stat.avgPassAccuracy, 0) /
				playerCount;
			userTotals.avgRating =
				playerStats.reduce((sum, stat) => sum + stat.avgRating, 0) /
				playerCount;
		}

		res.json({
			success: true,
			data: {
				user: {
					id: user.id,
					username: user.username,
					role: user.role,
				},
				playerStats,
				userTotals,
				playerCount,
			},
		});
	} catch (error) {
		next(error);
	}
});

// Get users by role
router.get(
	"/role/:role",
	authenticateToken,
	requireAdmin,
	async (req, res, next) => {
		try {
			const { role } = req.params;
			const { page = 1, limit = 20 } = req.query;

			const skip = (parseInt(page) - 1) * parseInt(limit);

			// Validate role
			const validRoles = ["ADMIN", "MANAGER", "PLAYER"];
			if (!validRoles.includes(role)) {
				return res.status(400).json({
					error: "Invalid role",
					message: "Role must be one of: " + validRoles.join(", "),
				});
			}

			const [users, total] = await Promise.all([
				prisma.user.findMany({
					where: { role },
					skip,
					take: parseInt(limit),
					orderBy: { createdAt: "asc" },
					select: {
						id: true,
						username: true,
						email: true,
						role: true,
						createdAt: true,
						_count: {
							select: {
								players: true,
							},
						},
					},
				}),
				prisma.user.count({ where: { role } }),
			]);

			res.json({
				success: true,
				data: users,
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
	}
);

module.exports = router;
