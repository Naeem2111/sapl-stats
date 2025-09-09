const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

/**
 * Set Test Passwords
 *
 * This script sets known passwords for test accounts
 * to make them usable for frontend testing.
 */

async function setTestPasswords() {
	console.log("🔑 Setting test passwords for imported users...");

	try {
		// Get the first few users from each role
		const users = await prisma.user.findMany({
			select: {
				id: true,
				username: true,
				email: true,
				role: true,
				saplData: true,
			},
			take: 20,
			orderBy: {
				createdAt: "asc",
			},
		});

		const testPasswords = {
			COMPETITION_ADMIN: "admin123",
			LEAGUE_ADMIN: "league123",
			TEAM_ADMIN: "team123",
			PLAYER: "player123",
		};

		let updated = 0;

		for (const user of users) {
			const password = testPasswords[user.role] || "test123";
			const passwordHash = await bcrypt.hash(password, 12);

			await prisma.user.update({
				where: { id: user.id },
				data: { passwordHash: passwordHash },
			});

			console.log(`✅ Updated ${user.role}: ${user.email} -> ${password}`);
			updated++;
		}

		console.log(`\n🎉 Updated ${updated} user passwords`);
		console.log("\n📋 Test Passwords:");
		console.log("👑 COMPETITION_ADMIN: admin123");
		console.log("👨‍💼 LEAGUE_ADMIN: league123");
		console.log("👨‍💼 TEAM_ADMIN: team123");
		console.log("👥 PLAYER: player123");

		// Export updated credentials
		const fs = require("fs");
		const path = require("path");

		const credentials = {
			admin: {
				email: "admin@proclubs.com",
				password: "admin123",
				role: "COMPETITION_ADMIN",
			},
			users: users.map((user, index) => ({
				id: index + 1,
				email: user.email,
				password: testPasswords[user.role] || "test123",
				role: user.role,
				name:
					`${user.saplData?.firstName || ""} ${
						user.saplData?.lastName || ""
					}`.trim() || user.username,
				phone: user.saplData?.phone || "N/A",
				gamertag: user.saplData?.gamertag || user.username,
			})),
		};

		const outputPath = path.join(
			__dirname,
			"..",
			"..",
			"test-credentials-with-passwords.json"
		);
		fs.writeFileSync(outputPath, JSON.stringify(credentials, null, 2));

		console.log("\n📁 Updated credentials exported to:", outputPath);

		return credentials;
	} catch (error) {
		console.error("❌ Error setting test passwords:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

setTestPasswords()
	.then(() => {
		console.log("✅ Password setup completed");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Password setup failed:", error);
		process.exit(1);
	});
