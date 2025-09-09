const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const { prisma } = require("../database/prisma");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
	gamertag: Joi.string().min(3).max(30).required(),
	email: Joi.string().email().required(),
	password: Joi.string().min(6).required(),
	registrationType: Joi.string().valid("player", "team").required(),
	position: Joi.string().when("registrationType", {
		is: "player",
		then: Joi.string().required(),
		otherwise: Joi.string().optional(),
	}),
	teamName: Joi.string().when("registrationType", {
		is: "team",
		then: Joi.string().min(3).max(50).required(),
		otherwise: Joi.string().optional(),
	}),
	role: Joi.string()
		.valid("PLAYER", "TEAM_ADMIN", "LEAGUE_ADMIN", "COMPETITION_ADMIN")
		.default("PLAYER"),
});

const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
	currentPassword: Joi.string().required(),
	newPassword: Joi.string().min(6).required(),
});

// Register new user
router.post("/register", async (req, res) => {
	try {
		// Handle both JSON and multipart form data
		const body = req.body;

		const { error, value } = registerSchema.validate(body);
		if (error) {
			return res.status(400).json({
				success: false,
				error: {
					message: error.details[0].message,
				},
			});
		}

		const {
			gamertag,
			email,
			password,
			registrationType,
			position,
			teamName,
			role,
		} = value;

		// Check if user already exists
		const existingUser = await prisma.user.findFirst({
			where: {
				OR: [{ email }, { username: gamertag }],
			},
		});

		if (existingUser) {
			return res.status(400).json({
				success: false,
				error: {
					message: "User with this email or gamertag already exists",
				},
			});
		}

		// Hash password
		const passwordHash = await bcrypt.hash(password, 12);

		// Handle file upload if present
		let teamLogoUrl = null;
		if (req.files && req.files.length > 0) {
			const teamLogoFile = req.files.find(
				(file) => file.fieldname === "teamLogo"
			);
			if (teamLogoFile) {
				// In a real application, you would upload this to a cloud storage service
				// For now, we'll just store a placeholder
				teamLogoUrl = `/uploads/team-logos/${Date.now()}-${
					teamLogoFile.originalname
				}`;
			}
		}

		// Create user and associated profile in a transaction
		const result = await prisma.$transaction(async (tx) => {
			const user = await tx.user.create({
				data: {
					username: gamertag,
					email,
					passwordHash,
					role: registrationType === "team" ? "TEAM_ADMIN" : role,
				},
			});

			if (registrationType === "player") {
				// Create player profile
				const player = await tx.player.create({
					data: {
						gamertag,
						position,
						userId: user.id,
					},
				});
				return { user, player };
			} else {
				// Create team
				const team = await tx.team.create({
					data: {
						name: teamName,
						adminUserId: user.id,
						logoUrl: teamLogoUrl,
					},
				});
				return { user, team };
			}
		});

		// Generate JWT token
		const token = jwt.sign({ userId: result.user.id }, process.env.JWT_SECRET, {
			expiresIn: process.env.JWT_EXPIRES_IN || "24h",
		});

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
				token,
			},
		});
	} catch (error) {
		console.error("Registration error:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Login user
router.post("/login", async (req, res) => {
	try {
		const { error, value } = loginSchema.validate(req.body);
		if (error) {
			return res.status(400).json({
				success: false,
				error: {
					message: error.details[0].message,
				},
			});
		}

		const { email, password } = value;

		// Find user by email
		const user = await prisma.user.findUnique({
			where: { email },
			include: {
				players: {
					include: {
						team: true,
					},
				},
			},
		});

		if (!user) {
			return res.status(401).json({
				success: false,
				error: {
					message: "Invalid email or password",
				},
			});
		}

		// Verify password
		const isValidPassword = await bcrypt.compare(password, user.passwordHash);
		if (!isValidPassword) {
			return res.status(401).json({
				success: false,
				error: {
					message: "Invalid email or password",
				},
			});
		}

		// Generate JWT token
		const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
			expiresIn: process.env.JWT_EXPIRES_IN || "24h",
		});

		res.json({
			success: true,
			message: "Login successful",
			data: {
				user: {
					id: user.id,
					username: user.username,
					email: user.email,
					role: user.role,
					players: user.players,
				},
				token,
			},
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Get user profile
router.get("/profile", authenticateToken, async (req, res) => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: req.user.id },
			include: {
				players: {
					include: {
						team: true,
					},
				},
			},
		});

		res.json({
			success: true,
			data: {
				user: {
					id: user.id,
					username: user.username,
					email: user.email,
					role: user.role,
					players: user.players,
				},
			},
		});
	} catch (error) {
		console.error("Profile fetch error:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Change password
router.put("/change-password", authenticateToken, async (req, res) => {
	try {
		const { error, value } = changePasswordSchema.validate(req.body);
		if (error) {
			return res.status(400).json({
				success: false,
				error: {
					message: error.details[0].message,
				},
			});
		}

		const { currentPassword, newPassword } = value;

		// Get current user with password hash
		const user = await prisma.user.findUnique({
			where: { id: req.user.id },
		});

		// Verify current password
		const isValidPassword = await bcrypt.compare(
			currentPassword,
			user.passwordHash
		);
		if (!isValidPassword) {
			return res.status(400).json({
				success: false,
				error: {
					message: "Current password is incorrect",
				},
			});
		}

		// Hash new password
		const newPasswordHash = await bcrypt.hash(newPassword, 12);

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
		console.error("Password change error:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

module.exports = router;
