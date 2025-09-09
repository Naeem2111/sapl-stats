const { PrismaClient } = require("@prisma/client");
const axios = require("axios");

const prisma = new PrismaClient();

/**
 * Extract Player Positions from League Republic Fixture API
 *
 * This script fetches fixture data from League Republic API and maps player positions
 * based on their participation in matches. Players who appear in match squads
 * will have their positions updated based on their role in the team.
 */

/**
 * Map League Republic position data to our PlayerPosition enum
 */
function mapPositionFromFixture(positionData) {
	// League Republic might provide position data in different formats
	// This function maps their data to our enum values
	if (!positionData) return "UNKNOWN";

	const position = positionData.toString().toUpperCase();

	// Map common position abbreviations
	const positionMap = {
		GK: "GK",
		GOALKEEPER: "GK",
		CB: "CB",
		CENTRE_BACK: "CB",
		CENTER_BACK: "CB",
		LB: "LB",
		LEFT_BACK: "LB",
		RB: "RB",
		RIGHT_BACK: "RB",
		CDM: "CDM",
		DEFENSIVE_MIDFIELDER: "CDM",
		CM: "CM",
		CENTRAL_MIDFIELDER: "CM",
		CENTER_MIDFIELDER: "CM",
		CAM: "CAM",
		ATTACKING_MIDFIELDER: "CAM",
		LM: "LM",
		LEFT_MIDFIELDER: "LM",
		RM: "RM",
		RIGHT_MIDFIELDER: "RM",
		LW: "LW",
		LEFT_WINGER: "LW",
		RW: "RW",
		RIGHT_WINGER: "RW",
		ST: "ST",
		STRIKER: "ST",
		CF: "CF",
		CENTRE_FORWARD: "CF",
		CENTER_FORWARD: "CF",
	};

	return positionMap[position] || "UNKNOWN";
}

/**
 * Fetch fixture data from League Republic API
 */
async function fetchFixtureData(fixtureId) {
	try {
		const url = `https://api.leaguerepublic.com/json/getFullFixtureDetails/${fixtureId}.json`;
		console.log(`📡 Fetching fixture data for ID: ${fixtureId}`);

		const response = await axios.get(url, {
			timeout: 10000,
			headers: {
				"User-Agent": "ProClubs Stats Hub/1.0",
			},
		});

		return response.data;
	} catch (error) {
		console.error(`❌ Error fetching fixture ${fixtureId}:`, error.message);
		return null;
	}
}

/**
 * Extract player positions from fixture data
 */
async function extractPositionsFromFixture(fixtureData) {
	const positionUpdates = [];

	if (!fixtureData) return positionUpdates;

	const { availableHomePlayers, availableRoadPlayers, fixture } = fixtureData;

	// Process home team players
	if (availableHomePlayers && Array.isArray(availableHomePlayers)) {
		for (const player of availableHomePlayers) {
			if (player.personID) {
				positionUpdates.push({
					personId: player.personID,
					firstName: player.firstName,
					lastName: player.lastName,
					team: fixture.homeTeamName,
					position: mapPositionFromFixture(player.position || player.role),
					fixtureId: fixture.fixtureID,
					side: "home",
				});
			}
		}
	}

	// Process away team players
	if (availableRoadPlayers && Array.isArray(availableRoadPlayers)) {
		for (const player of availableRoadPlayers) {
			if (player.personID) {
				positionUpdates.push({
					personId: player.personID,
					firstName: player.firstName,
					lastName: player.lastName,
					team: fixture.roadTeamName,
					position: mapPositionFromFixture(player.position || player.role),
					fixtureId: fixture.fixtureID,
					side: "away",
				});
			}
		}
	}

	return positionUpdates;
}

/**
 * Update player positions in database
 */
async function updatePlayerPositions(positionUpdates) {
	let updated = 0;
	let notFound = 0;
	let errors = 0;

	for (const update of positionUpdates) {
		try {
			// Find player by SAPL Person ID (convert to string)
			const player = await prisma.player.findFirst({
				where: { saplId: update.personId.toString() },
				include: { user: true },
			});

			if (!player) {
				console.log(
					`   ⚠️  Player with Person ID ${update.personId} not found in database`
				);
				notFound++;
				continue;
			}

			// Only update if position is not UNKNOWN and current position is UNKNOWN
			if (update.position !== "UNKNOWN" && player.position === "UNKNOWN") {
				await prisma.player.update({
					where: { id: player.id },
					data: { position: update.position },
				});

				console.log(
					`   ✅ Updated ${player.firstName} ${player.lastName} (${update.personId}) to position: ${update.position}`
				);
				updated++;
			} else if (
				update.position !== "UNKNOWN" &&
				player.position !== "UNKNOWN"
			) {
				console.log(
					`   📋 ${player.firstName} ${player.lastName} already has position: ${player.position}`
				);
			}
		} catch (error) {
			console.error(
				`   ❌ Error updating player ${update.personId}:`,
				error.message
			);
			errors++;
		}
	}

	return { updated, notFound, errors };
}

/**
 * Process multiple fixtures to extract positions
 */
async function processFixturesForPositions(fixtureIds) {
	console.log(
		`🚀 Starting position extraction from ${fixtureIds.length} fixtures...`
	);

	let totalUpdated = 0;
	let totalNotFound = 0;
	let totalErrors = 0;

	for (const fixtureId of fixtureIds) {
		try {
			console.log(`\n📊 Processing fixture: ${fixtureId}`);

			// Fetch fixture data
			const fixtureData = await fetchFixtureData(fixtureId);
			if (!fixtureData) {
				console.log(`   ⚠️  No data available for fixture ${fixtureId}`);
				continue;
			}

			// Extract position updates
			const positionUpdates = await extractPositionsFromFixture(fixtureData);
			console.log(`   📋 Found ${positionUpdates.length} players in fixture`);

			// Update player positions
			const results = await updatePlayerPositions(positionUpdates);
			totalUpdated += results.updated;
			totalNotFound += results.notFound;
			totalErrors += results.errors;

			// Add delay to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 1000));
		} catch (error) {
			console.error(`❌ Error processing fixture ${fixtureId}:`, error.message);
			totalErrors++;
		}
	}

	console.log(`\n🎉 Position extraction completed!`);
	console.log(`📈 Results:`);
	console.log(`   - Players updated: ${totalUpdated}`);
	console.log(`   - Players not found: ${totalNotFound}`);
	console.log(`   - Errors: ${totalErrors}`);

	return { totalUpdated, totalNotFound, totalErrors };
}

/**
 * Get fixture IDs from a specific season (Season 29)
 */
async function getSeason29FixtureIds() {
	// This would typically come from your database or League Republic API
	// For now, we'll use the example fixture ID and some common ones
	const season29Fixtures = [
		40185260, // Example from the API
		// Add more fixture IDs for Season 29
	];

	return season29Fixtures;
}

/**
 * Main function to extract positions from Season 29 fixtures
 */
async function extractSeason29Positions() {
	try {
		console.log("🏆 Extracting player positions from Season 29 fixtures...");

		// Get Season 29 fixture IDs
		const fixtureIds = await getSeason29FixtureIds();
		console.log(`📅 Found ${fixtureIds.length} fixtures for Season 29`);

		// Process fixtures
		const results = await processFixturesForPositions(fixtureIds);

		return results;
	} catch (error) {
		console.error("❌ Error in position extraction:", error);
		throw error;
	}
}

async function main() {
	try {
		await extractSeason29Positions();
	} catch (error) {
		console.error("Script failed:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// Run the script if called directly
if (require.main === module) {
	main();
}

module.exports = {
	extractSeason29Positions,
	processFixturesForPositions,
	fetchFixtureData,
	extractPositionsFromFixture,
};
