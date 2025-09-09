const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Export Test Account Credentials
 *
 * This script exports a selection of test account credentials
 * that can be used in the frontend for testing purposes.
 */

async function exportTestCredentials() {
	console.log("🔑 Exporting test account credentials...");

	try {
		// Get a sample of users from each role
		const users = await prisma.user.findMany({
			select: {
				id: true,
				username: true,
				email: true,
				role: true,
				saplData: true,
			},
			take: 20, // Get 20 users for testing
			orderBy: {
				createdAt: "asc",
			},
		});

		// Group users by role
		const usersByRole = {
			COMPETITION_ADMIN: [],
			LEAGUE_ADMIN: [],
			TEAM_ADMIN: [],
			PLAYER: [],
		};

		users.forEach((user) => {
			if (usersByRole[user.role]) {
				usersByRole[user.role].push(user);
			}
		});

		// Create test credentials object
		const testCredentials = {
			admin: {
				email: "admin@proclubs.com",
				password: "admin123",
				role: "COMPETITION_ADMIN",
				description: "Main admin account (from seed)",
			},
			leagueAdmins: usersByRole.LEAGUE_ADMIN.slice(0, 3).map((user, index) => ({
				email: user.email,
				password: "Generated password - check database",
				role: "LEAGUE_ADMIN",
				description: `League Admin ${index + 1} - ${
					user.saplData?.firstName || user.username
				} ${user.saplData?.lastName || ""}`,
				phone: user.saplData?.phone || "N/A",
			})),
			teamAdmins: usersByRole.TEAM_ADMIN.slice(0, 3).map((user, index) => ({
				email: user.email,
				password: "Generated password - check database",
				role: "TEAM_ADMIN",
				description: `Team Admin ${index + 1} - ${
					user.saplData?.firstName || user.username
				} ${user.saplData?.lastName || ""}`,
				phone: user.saplData?.phone || "N/A",
			})),
			players: usersByRole.PLAYER.slice(0, 5).map((user, index) => ({
				email: user.email,
				password: "Generated password - check database",
				role: "PLAYER",
				description: `Player ${index + 1} - ${
					user.saplData?.firstName || user.username
				} ${user.saplData?.lastName || ""}`,
				phone: user.saplData?.phone || "N/A",
				gamertag: user.saplData?.gamertag || user.username,
			})),
		};

		// Export to JSON file
		const fs = require("fs");
		const path = require("path");

		const outputPath = path.join(
			__dirname,
			"..",
			"..",
			"test-credentials.json"
		);
		fs.writeFileSync(outputPath, JSON.stringify(testCredentials, null, 2));

		console.log("✅ Test credentials exported to:", outputPath);
		console.log("\n📊 Credentials Summary:");
		console.log(`👑 Admin: 1 account`);
		console.log(
			`👨‍💼 League Admins: ${testCredentials.leagueAdmins.length} accounts`
		);
		console.log(
			`👨‍💼 Team Admins: ${testCredentials.teamAdmins.length} accounts`
		);
		console.log(`👥 Players: ${testCredentials.players.length} accounts`);

		// Also create a simple text file for easy copying
		const textOutput = [];
		textOutput.push("=== PRO CLUBS STATS HUB - TEST CREDENTIALS ===\n");

		textOutput.push("🔑 ADMIN ACCOUNT:");
		textOutput.push(`Email: ${testCredentials.admin.email}`);
		textOutput.push(`Password: ${testCredentials.admin.password}`);
		textOutput.push(`Role: ${testCredentials.admin.role}\n`);

		textOutput.push("👨‍💼 LEAGUE ADMIN ACCOUNTS:");
		testCredentials.leagueAdmins.forEach((admin, index) => {
			textOutput.push(`${index + 1}. ${admin.description}`);
			textOutput.push(`   Email: ${admin.email}`);
			textOutput.push(`   Phone: ${admin.phone}`);
			textOutput.push(`   Role: ${admin.role}\n`);
		});

		textOutput.push("👨‍💼 TEAM ADMIN ACCOUNTS:");
		testCredentials.teamAdmins.forEach((admin, index) => {
			textOutput.push(`${index + 1}. ${admin.description}`);
			textOutput.push(`   Email: ${admin.email}`);
			textOutput.push(`   Phone: ${admin.phone}`);
			textOutput.push(`   Role: ${admin.role}\n`);
		});

		textOutput.push("👥 PLAYER ACCOUNTS:");
		testCredentials.players.forEach((player, index) => {
			textOutput.push(`${index + 1}. ${player.description}`);
			textOutput.push(`   Email: ${player.email}`);
			textOutput.push(`   Phone: ${player.phone}`);
			textOutput.push(`   Gamertag: ${player.gamertag}`);
			textOutput.push(`   Role: ${player.role}\n`);
		});

		textOutput.push(
			"⚠️  NOTE: Passwords were randomly generated during import."
		);
		textOutput.push("   You may need to implement a password reset feature or");
		textOutput.push(
			"   manually update passwords in the database for testing."
		);

		const textOutputPath = path.join(
			__dirname,
			"..",
			"..",
			"test-credentials.txt"
		);
		fs.writeFileSync(textOutputPath, textOutput.join("\n"));

		console.log("📝 Text file created:", textOutputPath);
		console.log("\n💡 Next steps:");
		console.log("1. Copy the credentials to the frontend");
		console.log("2. Implement password reset functionality");
		console.log("3. Or manually update passwords in the database");

		return testCredentials;
	} catch (error) {
		console.error("❌ Error exporting credentials:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

exportTestCredentials()
	.then(() => {
		console.log("✅ Credential export completed");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Credential export failed:", error);
		process.exit(1);
	});
