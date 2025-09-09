const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testAdminLogin() {
	console.log("🔐 Testing admin login functionality...");

	try {
		// Test Competition Admin
		const admin = await prisma.user.findUnique({
			where: { email: "admin@proclubs.com" },
		});

		if (admin) {
			const isValidPassword = await bcrypt.compare(
				"admin123",
				admin.passwordHash
			);
			console.log(
				`✅ Competition Admin (${admin.email}): ${
					isValidPassword ? "PASSWORD VALID" : "PASSWORD INVALID"
				}`
			);
			console.log(`   Role: ${admin.role}`);
			console.log(`   Username: ${admin.username}`);
		} else {
			console.log("❌ Competition Admin not found");
		}

		// Test League Admin
		const leagueAdmin = await prisma.user.findUnique({
			where: { email: "league_admin@proclubs.com" },
		});

		if (leagueAdmin) {
			const isValidPassword = await bcrypt.compare(
				"league123",
				leagueAdmin.passwordHash
			);
			console.log(
				`✅ League Admin (${leagueAdmin.email}): ${
					isValidPassword ? "PASSWORD VALID" : "PASSWORD INVALID"
				}`
			);
			console.log(`   Role: ${leagueAdmin.role}`);
			console.log(`   Username: ${leagueAdmin.username}`);
		} else {
			console.log("❌ League Admin not found");
		}

		// Test Team Admin
		const teamAdmin = await prisma.user.findUnique({
			where: { email: "team_admin@proclubs.com" },
		});

		if (teamAdmin) {
			const isValidPassword = await bcrypt.compare(
				"team123",
				teamAdmin.passwordHash
			);
			console.log(
				`✅ Team Admin (${teamAdmin.email}): ${
					isValidPassword ? "PASSWORD VALID" : "PASSWORD INVALID"
				}`
			);
			console.log(`   Role: ${teamAdmin.role}`);
			console.log(`   Username: ${teamAdmin.username}`);
		} else {
			console.log("❌ Team Admin not found");
		}

		// Test Player Account
		const player = await prisma.user.findUnique({
			where: { email: "i_abdoola@hotmail.com" },
		});

		if (player) {
			const isValidPassword = await bcrypt.compare(
				"player123",
				player.passwordHash
			);
			console.log(
				`✅ Player (${player.email}): ${
					isValidPassword ? "PASSWORD VALID" : "PASSWORD INVALID"
				}`
			);
			console.log(`   Role: ${player.role}`);
			console.log(`   Username: ${player.username}`);
		} else {
			console.log("❌ Player not found");
		}

		console.log("\n🎉 Admin login test completed!");
	} catch (error) {
		console.error("❌ Error testing admin login:", error);
	} finally {
		await prisma.$disconnect();
	}
}

testAdminLogin()
	.then(() => {
		console.log("✅ Test completed");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Test failed:", error);
		process.exit(1);
	});
