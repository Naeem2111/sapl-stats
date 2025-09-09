const { PrismaClient } = require("@prisma/client");
const saplService = require("./src/services/saplService");

const prisma = new PrismaClient();

async function importSAPLSeason29Stepwise() {
	console.log("🚀 Starting SAPL Season 29 stepwise import...");

	const season29Id = "699164189"; // Season 29 ID from the API

	try {
		console.log(`📅 Importing Season 29 (ID: ${season29Id})...`);

		// Step 1: Get season details and create/update season
		console.log("\n1️⃣ Creating/updating season...");
		const seasonDetails = await saplService.getSeasonDetails(season29Id);

		const seasonData = {
			name: seasonDetails.name || `SAPL Season 29`,
			startDate: seasonDetails.startDate || new Date("2025-06-04"),
			endDate: seasonDetails.endDate || new Date("2025-12-18"),
		};

		const existingSeason = await prisma.season.findFirst({
			where: { name: seasonData.name },
		});

		let season;
		if (existingSeason) {
			season = await prisma.season.update({
				where: { id: existingSeason.id },
				data: seasonData,
			});
			console.log("✅ Season updated:", season.name);
		} else {
			season = await prisma.season.create({
				data: seasonData,
			});
			console.log("✅ Season created:", season.name);
		}

		// Step 2: Import teams first
		console.log("\n2️⃣ Importing teams...");
		const teamResults = await saplService.syncTeamsToDatabase(prisma);
		console.log(
			`✅ Teams: ${teamResults.created} created, ${teamResults.updated} updated, ${teamResults.errors} errors`
		);

		// Step 3: Import fixtures (teams should now exist)
		console.log("\n3️⃣ Importing fixtures...");
		const fixtureResults = await saplService.syncFixturesForSeason(
			prisma,
			season.id,
			season29Id
		);
		console.log(
			`✅ Fixtures: ${fixtureResults.created} created, ${fixtureResults.updated} updated, ${fixtureResults.errors} errors`
		);

		// Summary
		console.log("\n📊 SAPL Season 29 Import Results:");
		console.log("==================================");
		console.log(`🏆 Season: ${existingSeason ? "Updated" : "Created"}`);
		console.log(
			`👥 Teams: ${teamResults.created} created, ${teamResults.updated} updated, ${teamResults.errors} errors`
		);
		console.log(
			`⚽ Fixtures: ${fixtureResults.created} created, ${fixtureResults.updated} updated, ${fixtureResults.errors} errors`
		);
		console.log(
			`📈 Total: ${
				teamResults.created +
				teamResults.updated +
				fixtureResults.created +
				fixtureResults.updated
			} records processed`
		);

		console.log("\n✅ SAPL Season 29 stepwise import completed successfully!");
	} catch (error) {
		console.error("❌ Error importing SAPL Season 29:", error.message);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

importSAPLSeason29Stepwise()
	.then(() => {
		console.log("✅ SAPL Season 29 stepwise import completed");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ SAPL Season 29 stepwise import failed:", error);
		process.exit(1);
	});
