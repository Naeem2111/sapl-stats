const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

/**
 * Create Admin Accounts
 *
 * This script creates the missing admin accounts for testing:
 * - Competition Admin (if not exists)
 * - League Admin
 * - Team Admin
 */

async function createAdminAccounts() {
	console.log("👑 Creating admin accounts for testing...");

	try {
		// Check if admin account exists
		const existingAdmin = await prisma.user.findUnique({
			where: { email: "admin@proclubs.com" },
		});

		if (!existingAdmin) {
			// Create competition admin
			const adminPasswordHash = await bcrypt.hash("admin123", 12);
			await prisma.user.create({
				data: {
					username: "admin",
					email: "admin@proclubs.com",
					passwordHash: adminPasswordHash,
					role: "COMPETITION_ADMIN",
				},
			});
			console.log(
				"✅ Created Competition Admin: admin@proclubs.com / admin123"
			);
		} else {
			console.log("ℹ️  Competition Admin already exists: admin@proclubs.com");
		}

		// Create League Admin
		const leagueAdminPasswordHash = await bcrypt.hash("league123", 12);
		await prisma.user.create({
			data: {
				username: "league_admin",
				email: "league_admin@proclubs.com",
				passwordHash: leagueAdminPasswordHash,
				role: "LEAGUE_ADMIN",
			},
		});
		console.log(
			"✅ Created League Admin: league_admin@proclubs.com / league123"
		);

		// Create Team Admin
		const teamAdminPasswordHash = await bcrypt.hash("team123", 12);
		await prisma.user.create({
			data: {
				username: "team_admin",
				email: "team_admin@proclubs.com",
				passwordHash: teamAdminPasswordHash,
				role: "TEAM_ADMIN",
			},
		});
		console.log("✅ Created Team Admin: team_admin@proclubs.com / team123");

		console.log("\n🎉 All admin accounts created successfully!");
		console.log("\n📋 Admin Account Summary:");
		console.log("👑 Competition Admin: admin@proclubs.com / admin123");
		console.log("👨‍💼 League Admin: league_admin@proclubs.com / league123");
		console.log("👨‍💼 Team Admin: team_admin@proclubs.com / team123");
	} catch (error) {
		console.error("❌ Error creating admin accounts:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

createAdminAccounts()
	.then(() => {
		console.log("✅ Admin account creation completed");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Admin account creation failed:", error);
		process.exit(1);
	});
