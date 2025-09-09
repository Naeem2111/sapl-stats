const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Get available player positions
 */
router.get("/positions", async (req, res) => {
	try {
		const positions = [
			{ value: "GK", label: "Goalkeeper", description: "Goalkeeper" },
			{ value: "CB", label: "Centre Back", description: "Central Defender" },
			{ value: "LB", label: "Left Back", description: "Left Full Back" },
			{ value: "RB", label: "Right Back", description: "Right Full Back" },
			{
				value: "CDM",
				label: "Defensive Midfielder",
				description: "Central Defensive Midfielder",
			},
			{
				value: "CM",
				label: "Central Midfielder",
				description: "Central Midfielder",
			},
			{
				value: "CAM",
				label: "Attacking Midfielder",
				description: "Central Attacking Midfielder",
			},
			{ value: "LM", label: "Left Midfielder", description: "Left Midfielder" },
			{
				value: "RM",
				label: "Right Midfielder",
				description: "Right Midfielder",
			},
			{ value: "LW", label: "Left Winger", description: "Left Winger" },
			{ value: "RW", label: "Right Winger", description: "Right Winger" },
			{ value: "ST", label: "Striker", description: "Striker" },
			{ value: "CF", label: "Centre Forward", description: "Centre Forward" },
		];

		res.json({ positions });
	} catch (error) {
		console.error("Error fetching positions:", error);
		res.status(500).json({ error: "Failed to fetch positions" });
	}
});

/**
 * Update player position(s)
 */
router.post("/update", authenticateToken, async (req, res) => {
	try {
		const userId = req.user.id;
		const { positions } = req.body;

		if (!positions || !Array.isArray(positions) || positions.length === 0) {
			return res
				.status(400)
				.json({ error: "At least one position is required" });
		}

		// Validate positions
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

		const invalidPositions = positions.filter(
			(pos) => !validPositions.includes(pos)
		);
		if (invalidPositions.length > 0) {
			return res.status(400).json({
				error: `Invalid positions: ${invalidPositions.join(", ")}`,
			});
		}

		// Find player record
		const player = await prisma.player.findFirst({
			where: { userId: userId },
		});

		if (!player) {
			return res.status(404).json({ error: "Player record not found" });
		}

		// Update player with primary position (first one selected)
		const primaryPosition = positions[0];

		const updatedPlayer = await prisma.player.update({
			where: { id: player.id },
			data: {
				position: primaryPosition,
				// Store additional positions in a JSON field if needed
				// For now, we'll just use the primary position
			},
			include: {
				user: {
					select: { username: true, email: true },
				},
				team: {
					select: { name: true },
				},
			},
		});

		res.json({
			message: "Position updated successfully",
			player: {
				id: updatedPlayer.id,
				name: `${updatedPlayer.firstName} ${updatedPlayer.lastName}`,
				position: updatedPlayer.position,
				team: updatedPlayer.team?.name,
				username: updatedPlayer.user?.username,
			},
		});
	} catch (error) {
		console.error("Error updating player position:", error);
		res.status(500).json({ error: "Failed to update position" });
	}
});

/**
 * Get player's current position
 */
router.get("/current", authenticateToken, async (req, res) => {
	try {
		const userId = req.user.id;

		const player = await prisma.player.findFirst({
			where: { userId: userId },
			select: {
				id: true,
				position: true,
				firstName: true,
				lastName: true,
				team: {
					select: { name: true },
				},
			},
		});

		if (!player) {
			return res.status(404).json({ error: "Player record not found" });
		}

		res.json({
			player: {
				id: player.id,
				name: `${player.firstName} ${player.lastName}`,
				position: player.position,
				team: player.team?.name,
			},
		});
	} catch (error) {
		console.error("Error fetching current position:", error);
		res.status(500).json({ error: "Failed to fetch current position" });
	}
});

/**
 * Get players by position for a team
 */
router.get("/team/:teamId/position/:position", async (req, res) => {
	try {
		const { teamId, position } = req.params;

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
			return res.status(400).json({ error: "Invalid position" });
		}

		const players = await prisma.player.findMany({
			where: {
				teamId: teamId,
				position: position,
			},
			select: {
				id: true,
				firstName: true,
				lastName: true,
				position: true,
				user: {
					select: { username: true },
				},
			},
			orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
		});

		res.json({
			position,
			players: players.map((p) => ({
				id: p.id,
				name: `${p.firstName} ${p.lastName}`,
				position: p.position,
				username: p.user?.username,
			})),
		});
	} catch (error) {
		console.error("Error fetching players by position:", error);
		res.status(500).json({ error: "Failed to fetch players by position" });
	}
});

module.exports = router;
