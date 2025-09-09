const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Migrate Player Data from saplData to Structured Fields
 *
 * This script migrates data from the saplData JSON field to the new
 * structured fields in the Player table.
 */

async function migratePlayerData() {
	console.log("🔄 Migrating player data from saplData to structured fields...");

	try {
		// Get all players with saplData
		const players = await prisma.player.findMany({
			where: {
				saplData: {
					not: null,
				},
			},
		});

		console.log(`📊 Found ${players.length} players with saplData to migrate`);

		let migrated = 0;
		let errors = 0;

		for (const player of players) {
			try {
				const saplData = player.saplData;

				// Parse date strings to DateTime objects
				const parseDate = (dateStr) => {
					if (!dateStr || dateStr === "" || dateStr === "Invalid Date")
						return null;
					try {
						const date = new Date(dateStr);
						// Check if the date is valid
						if (isNaN(date.getTime())) {
							console.log(`⚠️  Could not parse date: ${dateStr}`);
							return null;
						}
						return date;
					} catch (error) {
						console.log(`⚠️  Could not parse date: ${dateStr}`);
						return null;
					}
				};

				// Update player with structured data
				await prisma.player.update({
					where: { id: player.id },
					data: {
						firstName: saplData.firstName || null,
						lastName: saplData.lastName || null,
						teams: saplData.teams || null,
						activeFrom: parseDate(saplData.activeFrom),
						activeTo: parseDate(saplData.activeTo),
						phone: saplData.phone || null,
						status: saplData.status || null,
						internalRef1: saplData.internalRef1 || null,
						internalRef2: saplData.internalRef2 || null,
						source: saplData.source || "CSV_Import",
						// Remove saplData field
						saplData: null,
					},
				});

				migrated++;

				if (migrated % 100 === 0) {
					console.log(`✅ Migrated ${migrated} players...`);
				}
			} catch (error) {
				console.error(`❌ Error migrating player ${player.id}:`, error.message);
				errors++;
			}
		}

		// Also migrate User saplData to remove it
		const users = await prisma.user.findMany({
			where: {
				saplData: {
					not: null,
				},
			},
		});

		console.log(`📊 Found ${users.length} users with saplData to clean up`);

		for (const user of users) {
			try {
				await prisma.user.update({
					where: { id: user.id },
					data: {
						saplData: null,
					},
				});
			} catch (error) {
				console.error(`❌ Error cleaning up user ${user.id}:`, error.message);
				errors++;
			}
		}

		console.log(`\n🎉 Migration completed!`);
		console.log(`✅ Players migrated: ${migrated}`);
		console.log(`✅ Users cleaned up: ${users.length}`);
		console.log(`❌ Errors: ${errors}`);

		// Show sample of migrated data
		const samplePlayers = await prisma.player.findMany({
			take: 5,
			select: {
				id: true,
				gamertag: true,
				firstName: true,
				lastName: true,
				phone: true,
				teams: true,
				status: true,
				source: true,
			},
		});

		console.log(`\n📋 Sample migrated players:`);
		samplePlayers.forEach((player, index) => {
			console.log(
				`${index + 1}. ${player.firstName} ${player.lastName} (${
					player.gamertag
				})`
			);
			console.log(`   Phone: ${player.phone || "N/A"}`);
			console.log(`   Teams: ${player.teams || "N/A"}`);
			console.log(`   Status: ${player.status || "N/A"}`);
			console.log(`   Source: ${player.source || "N/A"}`);
		});
	} catch (error) {
		console.error("❌ Error during migration:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

migratePlayerData()
	.then(() => {
		console.log("✅ Data migration completed");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Data migration failed:", error);
		process.exit(1);
	});
