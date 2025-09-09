const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const { prisma } = require("../database/prisma");
const ocrService = require("../services/ocrService");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.join(__dirname, "../../uploads"));
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, `screenshot-${uniqueSuffix}${path.extname(file.originalname)}`);
	},
});

const upload = multer({
	storage: storage,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit
	},
	fileFilter: (req, file, cb) => {
		// Accept only image files
		if (file.mimetype.startsWith("image/")) {
			cb(null, true);
		} else {
			cb(new Error("Only image files are allowed"), false);
		}
	},
});

/**
 * POST /api/ocr/process-screenshot
 * Process a screenshot and extract statistics
 */
router.post(
	"/process-screenshot",
	authenticateToken,
	upload.single("screenshot"),
	async (req, res) => {
		try {
			if (!req.file) {
				return res.status(400).json({
					success: false,
					error: "No screenshot file provided",
				});
			}

			const { playerId, seasonId, matchId } = req.body;

			if (!playerId) {
				// Clean up uploaded file
				await ocrService.cleanupFile(req.file.path);
				return res.status(400).json({
					success: false,
					error: "Player ID is required",
				});
			}

			// Verify player exists and user has access
			const player = await prisma.player.findFirst({
				where: {
					id: playerId,
					OR: [
						{ userId: req.user.id },
						{ team: { members: { some: { userId: req.user.id } } } },
					],
				},
				include: {
					team: true,
					user: true,
				},
			});

			if (!player) {
				await ocrService.cleanupFile(req.file.path);
				return res.status(404).json({
					success: false,
					error: "Player not found or access denied",
				});
			}

			// Process the screenshot
			const result = await ocrService.processScreenshot(req.file.path);

			if (!result.success) {
				await ocrService.cleanupFile(req.file.path);
				return res.status(500).json({
					success: false,
					error: result.error,
					message: result.message,
				});
			}

			// Clean up the uploaded file
			await ocrService.cleanupFile(req.file.path);

			res.json({
				success: true,
				data: {
					player: {
						id: player.id,
						name: `${player.firstName} ${player.lastName}`,
						gamertag: player.gamertag,
						team: player.team?.name,
					},
					ocrText: result.ocrText,
					extractedStats: result.statistics,
					message: "Screenshot processed successfully",
				},
			});
		} catch (error) {
			console.error("OCR processing error:", error);

			// Clean up file if it exists
			if (req.file) {
				await ocrService.cleanupFile(req.file.path);
			}

			res.status(500).json({
				success: false,
				error: "Internal server error",
				message: "Failed to process screenshot",
			});
		}
	}
);

/**
 * POST /api/ocr/apply-stats
 * Apply extracted statistics to player record
 */
router.post("/apply-stats", authenticateToken, async (req, res) => {
	try {
		const {
			playerId,
			seasonId,
			matchId,
			statistics,
			isMatchStats = false,
		} = req.body;

		if (!playerId || !statistics) {
			return res.status(400).json({
				success: false,
				error: "Player ID and statistics are required",
			});
		}

		// Verify player exists and user has access
		const player = await prisma.player.findFirst({
			where: {
				id: playerId,
				OR: [
					{ userId: req.user.id },
					{ team: { members: { some: { userId: req.user.id } } } },
				],
			},
		});

		if (!player) {
			return res.status(404).json({
				success: false,
				error: "Player not found or access denied",
			});
		}

		// Map OCR statistics to database fields
		const statMapping = {
			goals: "goals",
			totalGoals: "totalGoals",
			assists: "assists",
			totalAssists: "totalAssists",
			shots: "shots",
			totalShots: "totalShots",
			shotsOnTarget: "shotsOnTarget",
			passes: "passes",
			totalPasses: "totalPasses",
			passAccuracy: "passAccuracy",
			tackles: "tackles",
			totalTackles: "totalTackles",
			tacklesAttempted: "tacklesAttempted",
			tackleSuccessRate: "tackleSuccessRate",
			interceptions: "interceptions",
			totalInterceptions: "totalInterceptions",
			saves: "saves",
			totalSaves: "totalSaves",
			savesSuccessRate: "savesSuccessRate",
			cleanSheets: "cleanSheets",
			yellowCards: "yellowCards",
			redCards: "redCards",
			rating: "rating",
			possessionLost: "possessionLost",
			possessionWon: "possessionWon",
			manOfTheMatch: "manOfTheMatch",
			xG: "xG",
			expectedGoals: "totalXG",
			xA: "xA",
			expectedAssists: "totalXA",
			duelSuccess: "totalDuelSuccess",
			totalDuelSuccess: "avgDuelSuccess",
			playersBeatenByPass: "playersBeatenByPass",
			goalsConceded: "goalsConceded",
			minutesPlayed: "minutesPlayed",
			matchesPlayed: "matchesPlayed",
			appearances: "matchesPlayed",
		};

		// Prepare update data
		const updateData = {};
		for (const [ocrKey, value] of Object.entries(statistics)) {
			const dbField = statMapping[ocrKey];
			if (dbField && !isNaN(value)) {
				updateData[dbField] = value;
			}
		}

		if (Object.keys(updateData).length === 0) {
			return res.status(400).json({
				success: false,
				error: "No valid statistics found to apply",
			});
		}

		let result;

		if (isMatchStats && matchId) {
			// Update match statistics
			result = await prisma.playerMatchStat.upsert({
				where: {
					matchId_playerId: {
						matchId: matchId,
						playerId: playerId,
					},
				},
				update: updateData,
				create: {
					matchId: matchId,
					playerId: playerId,
					teamId: player.teamId,
					...updateData,
				},
			});
		} else {
			// Update season statistics
			const season = seasonId
				? await prisma.season.findUnique({ where: { id: seasonId } })
				: await prisma.season.findFirst({ where: { name: "Season 29" } });

			if (!season) {
				return res.status(404).json({
					success: false,
					error: "Season not found",
				});
			}

			result = await prisma.playerSeasonStat.upsert({
				where: {
					seasonId_playerId: {
						seasonId: season.id,
						playerId: playerId,
					},
				},
				update: updateData,
				create: {
					seasonId: season.id,
					playerId: playerId,
					teamId: player.teamId,
					...updateData,
				},
			});
		}

		res.json({
			success: true,
			data: {
				updatedStats: updateData,
				message: `Statistics applied successfully to ${
					isMatchStats ? "match" : "season"
				} record`,
			},
		});
	} catch (error) {
		console.error("Error applying statistics:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
			message: "Failed to apply statistics",
		});
	}
});

/**
 * GET /api/ocr/test
 * Test OCR functionality with a sample image
 */
router.get("/test", async (req, res) => {
	try {
		res.json({
			success: true,
			message: "OCR service is running",
			version: "1.0.0",
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			error: error.message,
		});
	}
});

/**
 * POST /api/ocr/process-player-screenshot
 * Process a screenshot for a specific player and extract their statistics
 */
router.post(
	"/process-player-screenshot",
	authenticateToken,
	upload.single("screenshot"),
	async (req, res) => {
		try {
			if (!req.file) {
				return res.status(400).json({
					success: false,
					error: { message: "No screenshot file provided" },
				});
			}

			const { playerId, matchId } = req.body;

			if (!playerId || !matchId) {
				return res.status(400).json({
					success: false,
					error: { message: "Player ID and Match ID are required" },
				});
			}

			// Verify player exists
			const player = await prisma.player.findUnique({
				where: { id: playerId },
				include: { user: true, team: true },
			});

			if (!player) {
				return res.status(404).json({
					success: false,
					error: { message: "Player not found" },
				});
			}

			// Verify match exists
			const match = await prisma.match.findUnique({
				where: { id: matchId },
			});

			if (!match) {
				return res.status(404).json({
					success: false,
					error: { message: "Match not found" },
				});
			}

			// Process the screenshot with player stats optimization
			const result = await ocrService.processPlayerScreenshot(req.file.path);

			if (!result.success) {
				return res.status(400).json({
					success: false,
					error: { message: result.error },
				});
			}

			// Parse the extracted statistics for this specific player
			const playerStats = ocrService.parsePlayerStats(
				result.extractedText,
				player.user.username || player.user.email
			);

			// Clean up the uploaded file
			await fs.unlink(req.file.path);

			res.json({
				success: true,
				data: {
					playerId,
					playerName: player.user.username || player.user.email,
					extractedStats: playerStats,
					confidence: result.confidence,
					extractedText: result.extractedText,
				},
			});
		} catch (error) {
			console.error("Error processing player screenshot:", error);

			// Clean up file on error
			if (req.file) {
				try {
					await fs.unlink(req.file.path);
				} catch (unlinkError) {
					console.error("Error cleaning up file:", unlinkError);
				}
			}

			res.status(500).json({
				success: false,
				error: { message: "Failed to process screenshot" },
			});
		}
	}
);

/**
 * POST /api/ocr/process-with-regions
 * Process screenshot with user-defined regions for training
 */
router.post(
	"/process-with-regions",
	authenticateToken,
	upload.single("screenshot"),
	async (req, res) => {
		try {
			if (!req.file) {
				return res.status(400).json({
					success: false,
					error: { message: "No screenshot file provided" },
				});
			}

			const { regions, playerName } = req.body;
			let parsedRegions = regions;

			// Parse regions if they're JSON strings
			if (typeof regions === "string") {
				try {
					parsedRegions = JSON.parse(regions);
				} catch (e) {
					return res.status(400).json({
						success: false,
						error: { message: "Invalid regions format" },
					});
				}
			}

			// Process with regions
			const result = await ocrService.processWithRegions(
				req.file.path,
				parsedRegions
			);

			if (!result.success) {
				return res.status(400).json({
					success: false,
					error: { message: result.error },
				});
			}

			// Parse player stats if player name provided
			let playerStats = {};
			if (playerName) {
				playerStats = ocrService.parsePlayerStats(
					result.extractedText,
					playerName
				);
			}

			// Clean up the uploaded file
			await fs.unlink(req.file.path);

			res.json({
				success: true,
				data: {
					extractedText: result.extractedText,
					playerStats: playerStats,
					regionResults: result.regionResults,
					confidence: result.confidence,
				},
			});
		} catch (error) {
			console.error("Error processing with regions:", error);

			// Clean up file on error
			if (req.file) {
				try {
					await fs.unlink(req.file.path);
				} catch (unlinkError) {
					console.error("Error cleaning up file:", unlinkError);
				}
			}

			res.status(500).json({
				success: false,
				error: { message: "Failed to process screenshot with regions" },
			});
		}
	}
);

/**
 * POST /api/ocr/save-training-regions
 * Save training regions for future use
 */
router.post("/save-training-regions", authenticateToken, async (req, res) => {
	try {
		const { regions, name, description } = req.body;

		// In a real implementation, you'd save this to a database
		// For now, we'll just log it
		console.log(`Saving training regions: ${name}`);
		console.log("Regions:", JSON.stringify(regions, null, 2));

		// You could save to a JSON file or database here
		const trainingData = {
			name,
			description,
			regions,
			createdAt: new Date().toISOString(),
			createdBy: req.user.id,
		};

		// For now, just return success
		res.json({
			success: true,
			data: {
				message: "Training regions saved successfully",
				trainingData,
			},
		});
	} catch (error) {
		console.error("Error saving training regions:", error);
		res.status(500).json({
			success: false,
			error: { message: "Failed to save training regions" },
		});
	}
});

/**
 * GET /api/ocr/training-regions
 * Get saved training regions
 */
router.get("/training-regions", authenticateToken, async (req, res) => {
	try {
		// In a real implementation, you'd fetch from database
		// For now, return empty array
		res.json({
			success: true,
			data: {
				regions: [],
			},
		});
	} catch (error) {
		console.error("Error fetching training regions:", error);
		res.status(500).json({
			success: false,
			error: { message: "Failed to fetch training regions" },
		});
	}
});

module.exports = router;
