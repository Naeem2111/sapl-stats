const express = require("express");
const router = express.Router();
const saplService = require("../services/saplService");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Test SAPL API connection
router.get("/test-connection", async (req, res) => {
	try {
		const connectionStatus = await saplService.testConnection();
		res.json({
			success: true,
			data: connectionStatus,
		});
	} catch (error) {
		console.error("Error testing SAPL connection:", error);
		res.status(500).json({
			success: false,
			error: "Failed to test SAPL connection",
			details: error.message,
		});
	}
});

// Get SAPL teams
router.get("/teams", async (req, res) => {
	try {
		const teams = await saplService.getAllTeams();
		res.json({
			success: true,
			data: {
				teams,
				count: teams.length,
			},
		});
	} catch (error) {
		console.error("Error fetching SAPL teams:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch SAPL teams",
			details: error.message,
		});
	}
});

// Sync SAPL teams to database
router.post("/sync-teams", async (req, res) => {
	try {
		const results = await saplService.syncTeamsToDatabase(prisma);
		res.json({
			success: true,
			data: results,
		});
	} catch (error) {
		console.error("Error syncing SAPL teams:", error);
		res.status(500).json({
			success: false,
			error: "Failed to sync SAPL teams",
			details: error.message,
		});
	}
});

// Get SAPL seasons for league
router.get("/seasons", async (req, res) => {
	try {
		const seasons = await saplService.getSeasonsForLeague();
		res.json({
			success: true,
			data: {
				seasons,
				count: seasons.length,
			},
		});
	} catch (error) {
		console.error("Error fetching SAPL seasons:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch SAPL seasons",
			details: error.message,
		});
	}
});

// Get SAPL fixtures for season 28
router.get("/fixtures/season-28", async (req, res) => {
	try {
		const fixtures = await saplService.getFixturesForSeason28();
		res.json({
			success: true,
			data: {
				fixtures,
				count: fixtures.length,
			},
		});
	} catch (error) {
		console.error("Error fetching SAPL fixtures for season 28:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch SAPL fixtures for season 28",
			details: error.message,
		});
	}
});

// Get SAPL teams for fixture group
router.get("/teams/fixture-group/:fixtureGroupId", async (req, res) => {
	try {
		const { fixtureGroupId } = req.params;
		const teams = await saplService.getTeamsForFixtureGroup(fixtureGroupId);
		res.json({
			success: true,
			data: {
				teams,
				count: teams.length,
			},
		});
	} catch (error) {
		console.error("Error fetching SAPL teams for fixture group:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch SAPL teams for fixture group",
			details: error.message,
		});
	}
});

// Get SAPL standings for fixture group
router.get("/standings/fixture-group/:fixtureGroupId", async (req, res) => {
	try {
		const { fixtureGroupId } = req.params;
		const { fixtureTypeId = 1 } = req.query; // Default to division (1)
		const standings = await saplService.getStandingsForFixtureGroup(
			fixtureGroupId,
			fixtureTypeId
		);
		res.json({
			success: true,
			data: standings,
		});
	} catch (error) {
		console.error("Error fetching SAPL standings:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch SAPL standings",
			details: error.message,
		});
	}
});

// Get full fixture details
router.get("/fixtures/:fixtureId", async (req, res) => {
	try {
		const { fixtureId } = req.params;
		const fixture = await saplService.getFullFixtureDetails(fixtureId);
		res.json({
			success: true,
			data: fixture,
		});
	} catch (error) {
		console.error("Error fetching SAPL fixture details:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch SAPL fixture details",
			details: error.message,
		});
	}
});

// Get team statistics for season
router.get("/teams/:teamId/stats/:seasonId", async (req, res) => {
	try {
		const { teamId, seasonId } = req.params;
		const stats = await saplService.getStatisticSummaryForTeam(
			seasonId,
			teamId
		);
		res.json({
			success: true,
			data: stats,
		});
	} catch (error) {
		console.error("Error fetching SAPL team statistics:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch SAPL team statistics",
			details: error.message,
		});
	}
});

// Import all SAPL data for a specific season
router.post("/import-season", async (req, res) => {
	try {
		const { seasonId } = req.body;
		const results = await saplService.importSeasonData(prisma, seasonId);
		res.json({
			success: true,
			data: results,
		});
	} catch (error) {
		console.error("Error importing SAPL season data:", error);
		res.status(500).json({
			success: false,
			error: "Failed to import SAPL season data",
			details: error.message,
		});
	}
});

// Keep the old route for backward compatibility
router.post("/import-season-28", async (req, res) => {
	try {
		const results = await saplService.importSeasonData(prisma, "825650177"); // Season 28 ID
		res.json({
			success: true,
			data: results,
		});
	} catch (error) {
		console.error("Error importing SAPL season 28 data:", error);
		res.status(500).json({
			success: false,
			error: "Failed to import SAPL season 28 data",
			details: error.message,
		});
	}
});

// Sync specific fixture group
router.post("/sync-fixture-group/:fixtureGroupId", async (req, res) => {
	try {
		const { fixtureGroupId } = req.params;
		const results = await saplService.syncFixtureGroup(prisma, fixtureGroupId);
		res.json({
			success: true,
			data: results,
		});
	} catch (error) {
		console.error("Error syncing SAPL fixture group:", error);
		res.status(500).json({
			success: false,
			error: "Failed to sync SAPL fixture group",
			details: error.message,
		});
	}
});

module.exports = router;
