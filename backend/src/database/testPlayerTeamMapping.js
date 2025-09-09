const { PrismaClient } = require("@prisma/client");
const { mapPlayersToTeams } = require("./mapPlayersToTeams");

const prisma = new PrismaClient();

/**
 * Test Player Team Mapping
 *
 * This script tests the player-to-team mapping with a small sample
 * to ensure everything works correctly before running the full import.
 */

async function testPlayerTeamMapping() {
	console.log("🧪 Testing player-to-team mapping with sample data...");

	try {
		// First, let's check what players we have in the database
		const players = await prisma.player.findMany({
			where: {
				saplId: { not: null },
			},
			include: {
				user: true,
				team: true,
			},
			take: 5,
		});

		console.log(
			`📊 Found ${players.length} players with SAPL IDs in database:`
		);
		players.forEach((player) => {
			console.log(
				`   - ${player.firstName} ${player.lastName} (${
					player.saplId
				}) - Team: ${player.team?.name || "None"}`
			);
		});

		// Check what teams we have
		const teams = await prisma.team.findMany({
			take: 10,
		});

		console.log(`\n🏟️ Found ${teams.length} teams in database:`);
		teams.forEach((team) => {
			console.log(`   - ${team.name} (ID: ${team.id})`);
		});

		// Run the mapping process
		console.log(`\n🔄 Running player-to-team mapping...`);
		const results = await mapPlayersToTeams();

		console.log(`\n✅ Test completed successfully!`);
		console.log(`📈 Results:`, results);
	} catch (error) {
		console.error("❌ Test failed:", error);
		throw error;
	}
}

async function main() {
	try {
		await testPlayerTeamMapping();
	} catch (error) {
		console.error("Test script failed:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// Run the script if called directly
if (require.main === module) {
	main();
}

module.exports = { testPlayerTeamMapping };
