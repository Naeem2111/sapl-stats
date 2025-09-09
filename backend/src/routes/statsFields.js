const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();

const prisma = new PrismaClient();

// Make these routes public (no authentication required)

// Get all available stats fields from PlayerMatchStat model
router.get("/available", async (req, res) => {
	try {
		// Get the schema information for PlayerMatchStat
		const statsFields = [
			// Basic stats
			{
				name: "goals",
				type: "number",
				description: "Goals scored",
				category: "Attacking",
			},
			{
				name: "assists",
				type: "number",
				description: "Assists made",
				category: "Attacking",
			},
			{
				name: "shots",
				type: "number",
				description: "Shots taken",
				category: "Attacking",
			},
			{
				name: "passes",
				type: "number",
				description: "Passes completed",
				category: "Passing",
			},
			{
				name: "passAccuracy",
				type: "percentage",
				description: "Pass accuracy percentage",
				category: "Passing",
			},
			{
				name: "tackles",
				type: "number",
				description: "Tackles made",
				category: "Defending",
			},
			{
				name: "interceptions",
				type: "number",
				description: "Interceptions made",
				category: "Defending",
			},
			{
				name: "saves",
				type: "number",
				description: "Saves made",
				category: "Goalkeeping",
			},
			{
				name: "cleanSheet",
				type: "boolean",
				description: "Clean sheet achieved",
				category: "Goalkeeping",
			},
			{
				name: "rating",
				type: "number",
				description: "Base player rating",
				category: "General",
			},
			{
				name: "minutesPlayed",
				type: "number",
				description: "Minutes played",
				category: "General",
			},
			{
				name: "yellowCards",
				type: "number",
				description: "Yellow cards received",
				category: "Discipline",
			},
			{
				name: "redCards",
				type: "number",
				description: "Red cards received",
				category: "Discipline",
			},

			// Advanced stats
			{
				name: "possessionLost",
				type: "number",
				description: "Possession lost",
				category: "Possession",
			},
			{
				name: "possessionWon",
				type: "number",
				description: "Possession won",
				category: "Possession",
			},
			{
				name: "tackleSuccessRate",
				type: "percentage",
				description: "Tackle success rate",
				category: "Defending",
			},
			{
				name: "savesSuccessRate",
				type: "percentage",
				description: "Save success rate",
				category: "Goalkeeping",
			},
			{
				name: "goalsConceded",
				type: "number",
				description: "Goals conceded",
				category: "Goalkeeping",
			},
			{
				name: "xG",
				type: "number",
				description: "Expected Goals",
				category: "Advanced",
			},
			{
				name: "totalDuelSuccess",
				type: "percentage",
				description: "Total duel success rate",
				category: "Advanced",
			},
			{
				name: "playersBeatenByPass",
				type: "number",
				description: "Players beaten by pass",
				category: "Advanced",
			},
			{
				name: "xA",
				type: "number",
				description: "Expected Assists",
				category: "Advanced",
			},
			{
				name: "tacklesAttempted",
				type: "number",
				description: "Tackles attempted",
				category: "Defending",
			},
		];

		// Group by category
		const groupedFields = statsFields.reduce((acc, field) => {
			if (!acc[field.category]) {
				acc[field.category] = [];
			}
			acc[field.category].push(field);
			return acc;
		}, {});

		res.json({
			success: true,
			data: { fields: statsFields, grouped: groupedFields },
		});
	} catch (error) {
		console.error("Error fetching stats fields:", error);
		res.status(500).json({
			success: false,
			error: { message: "Failed to fetch stats fields" },
		});
	}
});

// Get available formations for position mappings
router.get("/formations", async (req, res) => {
	try {
		const formations = [
			"3-1-4-2",
			"3-4-1-2",
			"3-4-2-1",
			"3-4-3",
			"3-4-3 Diamond",
			"3-4-3 Flat",
			"3-5-1-1",
			"3-5-2",
			"4-1-2-1-2",
			"4-1-2-1-2 (2)",
			"4-1-2-1-2 Narrow",
			"4-1-2-1-2 Wide",
			"4-1-3-2",
			"4-1-4-1",
			"4-2-1-3",
			"4-2-2-2",
			"4-2-3-1",
			"4-2-3-1 (2)",
			"4-2-3-1 Narrow",
			"4-2-3-1 Wide",
			"4-2-4",
			"4-3-1-2",
			"4-3-2-1",
			"4-3-3",
			"4-3-3 (2)",
			"4-3-3 (3)",
			"4-3-3 (4)",
			"4-3-3 (5)",
			"4-3-3 Attack",
			"4-3-3 Defend",
			"4-3-3 False 9",
			"4-3-3 Flat",
			"4-3-3 Holding",
			"4-4-1-1",
			"4-4-1-1 (2)",
			"4-4-1-1 Attack",
			"4-4-1-1 Midfield",
			"4-4-2",
			"4-4-2 (2) Holding",
			"4-4-2 Flat",
			"4-4-2 Holding",
			"4-5-1",
			"4-5-1 (2)",
			"4-5-1 Attack",
			"4-5-1 Flat",
			"5-1-2-2",
			"5-2-1-2",
			"5-2-2-1",
			"5-2-3",
			"5-3-2",
			"5-4-1",
			"5-4-1 Diamond",
			"5-4-1 Flat",
		];

		res.json({ success: true, data: formations });
	} catch (error) {
		console.error("Error fetching formations:", error);
		res.status(500).json({
			success: false,
			error: { message: "Failed to fetch formations" },
		});
	}
});

// Get available positions
router.get("/positions", async (req, res) => {
	try {
		const positions = [
			// Goalkeeper
			{ value: "GK", label: "Goalkeeper", category: "Goalkeeper" },

			// Defenders
			{ value: "RCB", label: "Right Center Back", category: "Defender" },
			{ value: "CB", label: "Center Back", category: "Defender" },
			{ value: "LCB", label: "Left Center Back", category: "Defender" },
			{ value: "RB", label: "Right Back", category: "Defender" },
			{ value: "LB", label: "Left Back", category: "Defender" },
			{ value: "RWB", label: "Right Wing Back", category: "Defender" },
			{ value: "LWB", label: "Left Wing Back", category: "Defender" },

			// Midfielders
			{ value: "CDM", label: "Defensive Midfielder", category: "Midfielder" },
			{
				value: "RCM",
				label: "Right Central Midfielder",
				category: "Midfielder",
			},
			{ value: "CM", label: "Central Midfielder", category: "Midfielder" },
			{
				value: "LCM",
				label: "Left Central Midfielder",
				category: "Midfielder",
			},
			{ value: "RM", label: "Right Midfielder", category: "Midfielder" },
			{ value: "LM", label: "Left Midfielder", category: "Midfielder" },
			{
				value: "CAM",
				label: "Central Attacking Midfielder",
				category: "Midfielder",
			},
			{
				value: "RAM",
				label: "Right Attacking Midfielder",
				category: "Midfielder",
			},
			{
				value: "LAM",
				label: "Left Attacking Midfielder",
				category: "Midfielder",
			},

			// Forwards
			{ value: "RW", label: "Right Winger", category: "Forward" },
			{ value: "LW", label: "Left Winger", category: "Forward" },
			{ value: "RF", label: "Right Forward", category: "Forward" },
			{ value: "LF", label: "Left Forward", category: "Forward" },
			{ value: "ST", label: "Striker", category: "Forward" },
			{ value: "CF", label: "Center Forward", category: "Forward" },
		];

		res.json({ success: true, data: positions });
	} catch (error) {
		console.error("Error fetching positions:", error);
		res.status(500).json({
			success: false,
			error: { message: "Failed to fetch positions" },
		});
	}
});

// Get available mapped roles
router.get("/mapped-roles", async (req, res) => {
	try {
		const mappedRoles = [
			// Goalkeeper
			{ value: "GOALKEEPER", label: "Goalkeeper" },

			// Defenders
			{ value: "CENTERBACK", label: "Center Back" },
			{ value: "FULLBACK", label: "Full Back" },
			{ value: "WINGBACK", label: "Wing Back" },
			{ value: "SWEEPER", label: "Sweeper" },

			// Midfielders
			{ value: "DEFENSIVEMIDFIELDER", label: "Defensive Midfielder" },
			{ value: "CENTRALMIDFIELDER", label: "Central Midfielder" },
			{ value: "WIDEMIDFIELDER", label: "Wide Midfielder" },
			{ value: "ATTACKINGMIDFIELDER", label: "Attacking Midfielder" },
			{ value: "BOXTOBOX", label: "Box-to-Box Midfielder" },
			{ value: "HOLDINGMIDFIELDER", label: "Holding Midfielder" },

			// Forwards
			{ value: "WINGER", label: "Winger" },
			{ value: "INSIDEFORWARD", label: "Inside Forward" },
			{ value: "STRIKER", label: "Striker" },
			{ value: "CENTERFORWARD", label: "Center Forward" },
			{ value: "FALSE9", label: "False 9" },
			{ value: "TARGETMAN", label: "Target Man" },
			{ value: "POACHER", label: "Poacher" },
			{ value: "DEEPSTRIKER", label: "Deep Lying Forward" },
		];

		res.json({ success: true, data: mappedRoles });
	} catch (error) {
		console.error("Error fetching mapped roles:", error);
		res.status(500).json({
			success: false,
			error: { message: "Failed to fetch mapped roles" },
		});
	}
});

module.exports = router;
