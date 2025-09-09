const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Verify SAPL Player Mapping
 *
 * This script verifies that players are correctly mapped to teams
 * and provides SAPL URLs for verification.
 */

async function verifySAPLMapping() {
	console.log("🔍 Verifying SAPL player mapping...");

	try {
		// Get players with their teams
		const players = await prisma.player.findMany({
			where: {
				saplId: { not: null },
				teamId: { not: null },
			},
			include: {
				user: true,
				team: true,
			},
			orderBy: {
				team: {
					name: "asc",
				},
			},
		});

		console.log(`📊 Found ${players.length} players mapped to teams:`);
		console.log("=" * 80);

		let currentTeam = null;
		players.forEach((player) => {
			if (currentTeam !== player.team?.name) {
				currentTeam = player.team?.name;
				console.log(`\n🏟️ Team: ${currentTeam}`);
				console.log("-" * 40);
			}

			const saplUrl = `http://sapl.co.za/player/${player.saplId}.html`;
			console.log(`   👤 ${player.firstName} ${player.lastName}`);
			console.log(`      Person ID: ${player.saplId}`);
			console.log(`      SAPL URL: ${saplUrl}`);
			console.log(`      Username: ${player.user?.username || "N/A"}`);
			console.log("");
		});

		// Summary by team
		const teamStats = await prisma.team.findMany({
			include: {
				players: {
					select: {
						id: true,
					},
				},
			},
		});

		console.log("\n📈 Team Statistics:");
		console.log("=" * 50);
		teamStats.forEach((team) => {
			console.log(`🏟️ ${team.name}: ${team.players.length} players`);
		});

		// Players without teams
		const playersWithoutTeams = await prisma.player.findMany({
			where: {
				saplId: { not: null },
				teamId: null,
			},
			include: {
				user: true,
			},
		});

		if (playersWithoutTeams.length > 0) {
			console.log(`\n⚠️  ${playersWithoutTeams.length} players without teams:`);
			playersWithoutTeams.forEach((player) => {
				console.log(
					`   - ${player.firstName} ${player.lastName} (${player.saplId})`
				);
			});
		}
	} catch (error) {
		console.error("❌ Verification failed:", error);
		throw error;
	}
}

async function main() {
	try {
		await verifySAPLMapping();
	} catch (error) {
		console.error("Verification script failed:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// Run the script if called directly
if (require.main === module) {
	main();
}

module.exports = { verifySAPLMapping };
