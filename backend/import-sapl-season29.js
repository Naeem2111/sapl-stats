const { PrismaClient } = require("@prisma/client");
const saplService = require("./src/services/saplService");

const prisma = new PrismaClient();

async function importSAPLSeason29() {
	console.log("🚀 Starting SAPL Season 29 import...");

	const season29Id = "699164189"; // Season 29 ID from the API

	try {
		console.log(`📅 Importing Season 29 (ID: ${season29Id})...`);

		// Import the season data
		const results = await saplService.importSeasonData(prisma, season29Id);

		console.log("\n📊 SAPL Season 29 Import Results:");
		console.log("==================================");
		console.log(
			`🏆 Season: ${results.seasons.created > 0 ? "Created" : "Updated"}`
		);
		console.log(
			`👥 Teams: ${results.teams.created} created, ${results.teams.updated} updated, ${results.teams.errors} errors`
		);
		console.log(
			`⚽ Fixtures: ${results.fixtures.created} created, ${results.fixtures.updated} updated, ${results.fixtures.errors} errors`
		);
		console.log(
			`📈 Total: ${results.total.created} created, ${results.total.updated} updated, ${results.total.errors} errors`
		);

		if (results.demo) {
			console.log("\n⚠️  Note: This was run in DEMO MODE with mock data");
		}

		console.log("\n✅ SAPL Season 29 import completed successfully!");
	} catch (error) {
		console.error("❌ Error importing SAPL Season 29:", error.message);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

importSAPLSeason29()
	.then(() => {
		console.log("✅ SAPL Season 29 import completed");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ SAPL Season 29 import failed:", error);
		process.exit(1);
	});
