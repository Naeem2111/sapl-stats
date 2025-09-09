const express = require("express");
const { prisma } = require("../database/prisma");
const {
	authenticateToken,
	requireCompetitionAdmin,
} = require("../middleware/auth");

const router = express.Router();

// Get all seasons (public)
router.get("/", async (req, res) => {
	try {
		const seasons = await prisma.season.findMany({
			select: {
				id: true,
				name: true,
				startDate: true,
				endDate: true,
				description: true,
				isActive: true,
				createdAt: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		res.json({
			success: true,
			data: seasons,
		});
	} catch (error) {
		console.error("Error fetching seasons:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Failed to fetch seasons",
			},
		});
	}
});

// Get active season (public)
router.get("/active", async (req, res) => {
	try {
		const activeSeason = await prisma.season.findFirst({
			where: {
				isActive: true,
			},
			select: {
				id: true,
				name: true,
				startDate: true,
				endDate: true,
				description: true,
				createdAt: true,
			},
		});

		if (!activeSeason) {
			return res.status(404).json({
				success: false,
				error: {
					message: "No active season found",
				},
			});
		}

		res.json({
			success: true,
			data: activeSeason,
		});
	} catch (error) {
		console.error("Error fetching active season:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Failed to fetch active season",
			},
		});
	}
});

// Create new season (competition admin only)
router.post(
	"/",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const { name, startDate, endDate, description } = req.body;

			// Validate required fields
			if (!name || !startDate || !endDate) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Name, start date, and end date are required",
					},
				});
			}

			// Create the season
			const season = await prisma.season.create({
				data: {
					name,
					startDate: new Date(startDate),
					endDate: new Date(endDate),
					description: description || null,
					isActive: false, // New seasons are inactive by default
				},
			});

			res.status(201).json({
				success: true,
				data: season,
			});
		} catch (error) {
			console.error("Error creating season:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Failed to create season",
				},
			});
		}
	}
);

// Set active season (competition admin only)
router.post(
	"/:seasonId/set-active",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const { seasonId } = req.params;

			// First, deactivate all seasons
			await prisma.season.updateMany({
				data: {
					isActive: false,
				},
			});

			// Then activate the selected season
			const updatedSeason = await prisma.season.update({
				where: {
					id: seasonId,
				},
				data: {
					isActive: true,
				},
				select: {
					id: true,
					name: true,
					startDate: true,
					endDate: true,
					description: true,
					isActive: true,
					createdAt: true,
				},
			});

			res.json({
				success: true,
				data: updatedSeason,
			});
		} catch (error) {
			console.error("Error setting active season:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Failed to set active season",
				},
			});
		}
	}
);

// Update season (competition admin only)
router.put(
	"/:seasonId",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const { seasonId } = req.params;
			const { name, startDate, endDate, description } = req.body;

			const updatedSeason = await prisma.season.update({
				where: {
					id: seasonId,
				},
				data: {
					...(name && { name }),
					...(startDate && { startDate: new Date(startDate) }),
					...(endDate && { endDate: new Date(endDate) }),
					...(description !== undefined && { description }),
				},
				select: {
					id: true,
					name: true,
					startDate: true,
					endDate: true,
					description: true,
					isActive: true,
					createdAt: true,
				},
			});

			res.json({
				success: true,
				data: updatedSeason,
			});
		} catch (error) {
			console.error("Error updating season:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Failed to update season",
				},
			});
		}
	}
);

// Delete season (competition admin only)
router.delete(
	"/:seasonId",
	authenticateToken,
	requireCompetitionAdmin,
	async (req, res) => {
		try {
			const { seasonId } = req.params;

			// Check if season has competitions
			const competitions = await prisma.competition.count({
				where: {
					seasonId: seasonId,
				},
			});

			if (competitions > 0) {
				return res.status(400).json({
					success: false,
					error: {
						message: "Cannot delete season with existing competitions",
					},
				});
			}

			await prisma.season.delete({
				where: {
					id: seasonId,
				},
			});

			res.json({
				success: true,
				message: "Season deleted successfully",
			});
		} catch (error) {
			console.error("Error deleting season:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Failed to delete season",
				},
			});
		}
	}
);

module.exports = router;
