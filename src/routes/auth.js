const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const { prisma } = require("../database/prisma");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
	username: Joi.string().alphanum().min(3).max(30).required(),
	email: Joi.string().email().required(),
	password: Joi.string().min(6).required(),
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
	gamertag: Joi.string().required(),
});

const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
});

// Register new user
router.post("/register", async (req, res, next) => {
	try {
		const { error, value } = registerSchema.validate(req.body);
		if (error) {
			return res.status(400).json({
				error: "Validation error",
				message: error.details[0].message,
			});
		}

		const { username, email, password, realName, position, gamertag } = value;

		// Check if user already exists
		const existingUser = await prisma.user.findFirst({
			where: {
				OR: [{ email }, { username }],
			},
		});

		if (existingUser) {
			return res.status(400).json({
				error: "User already exists",
				message: "A user with this email or username already exists",
			});
		}

		// Check if gamertag is already taken
		const existingPlayer = await prisma.player.findUnique({
			where: { gamertag },
		});

		if (existingPlayer) {
			return res.status(400).json({
				error: "Gamertag taken",
				message: "This gamertag is already in use",
			});
		}

		// Hash password
		const saltRounds = 12;
		const passwordHash = await bcrypt.hash(password, saltRounds);

		// Create user and player in a transaction
		const result = await prisma.$transaction(async (tx) => {
			const user = await tx.user.create({
				data: {
					username,
					email,
					passwordHash,
					role: "PLAYER",
				},
			});

			const player = await tx.player.create({
				data: {
					gamertag,
					realName,
					position: position || "CM",
					userId: user.id,
				},
			});

			return { user, player };
		});

		// Generate JWT token
		const token = jwt.sign(
			{ userId: result.user.id, username: result.user.username },
			process.env.JWT_SECRET,
			{ expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
		);

		res.status(201).json({
			success: true,
			message: "User registered successfully",
			data: {
				user: {
					id: result.user.id,
					username: result.user.username,
					email: result.user.email,
					role: result.user.role,
				},
				player: {
					id: result.player.id,
					gamertag: result.player.gamertag,
					position: result.player.position,
				},
				token,
			},
		});
	} catch (error) {
		next(error);
	}
});

// Login user
router.post("/login", async (req, res, next) => {
	try {
		const { error, value } = loginSchema.validate(req.body);
		if (error) {
			return res.status(400).json({
				error: "Validation error",
				message: error.details[0].message,
			});
		}

		const { email, password } = value;

		// Find user by email
		const user = await prisma.user.findUnique({
			where: { email },
			include: {
				players: {
					select: {
						id: true,
						gamertag: true,
						position: true,
						teamId: true,
					},
				},
			},
		});

		if (!user) {
			return res.status(401).json({
				error: "Invalid credentials",
				message: "Email or password is incorrect",
			});
		}

		// Check password
		const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
		if (!isPasswordValid) {
			return res.status(401).json({
				error: "Invalid credentials",
				message: "Email or password is incorrect",
			});
		}

		// Generate JWT token
		const token = jwt.sign(
			{ userId: user.id, username: user.username },
			process.env.JWT_SECRET,
			{ expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
		);

		res.json({
			success: true,
			message: "Login successful",
			data: {
				user: {
					id: user.id,
					username: user.username,
					email: user.email,
					role: user.role,
				},
				players: user.players,
				token,
			},
		});
	} catch (error) {
		next(error);
	}
});

// Get current user profile
router.get("/profile", authenticateToken, async (req, res, next) => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: req.user.id },
			include: {
				players: {
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
			},
		});

		if (!user) {
			return res.status(404).json({
				error: "User not found",
				message: "User profile could not be retrieved",
			});
		}

		res.json({
			success: true,
			data: {
				user: {
					id: user.id,
					username: user.username,
					email: user.email,
					role: user.role,
					createdAt: user.createdAt,
				},
				players: user.players,
			},
		});
	} catch (error) {
		next(error);
	}
});

// Change password
router.put("/change-password", authenticateToken, async (req, res, next) => {
	try {
		const { currentPassword, newPassword } = req.body;

		if (!currentPassword || !newPassword) {
			return res.status(400).json({
				error: "Missing fields",
				message: "Current password and new password are required",
			});
		}

		if (newPassword.length < 6) {
			return res.status(400).json({
				error: "Invalid password",
				message: "New password must be at least 6 characters long",
			});
		}

		// Get current user with password hash
		const user = await prisma.user.findUnique({
			where: { id: req.user.id },
		});

		// Verify current password
		const isCurrentPasswordValid = await bcrypt.compare(
			currentPassword,
			user.passwordHash
		);
		if (!isCurrentPasswordValid) {
			return res.status(401).json({
				error: "Invalid password",
				message: "Current password is incorrect",
			});
		}

		// Hash new password
		const saltRounds = 12;
		const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

		// Update password
		await prisma.user.update({
			where: { id: req.user.id },
			data: { passwordHash: newPasswordHash },
		});

		res.json({
			success: true,
			message: "Password changed successfully",
		});
	} catch (error) {
		next(error);
	}
});

module.exports = router;
