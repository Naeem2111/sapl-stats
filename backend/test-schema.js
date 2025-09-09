const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testSchema() {
	console.log("🔍 Testing current database schema...");

	try {
		// Check if Player table has the new fields
		const player = await prisma.player.findFirst({
			select: {
				id: true,
				gamertag: true,
				firstName: true,
				lastName: true,
				phone: true,
				teams: true,
				status: true,
				source: true,
				activeFrom: true,
				activeTo: true,
				internalRef1: true,
				internalRef2: true,
			},
		});

		console.log("📋 Player table structure:");
		console.log(JSON.stringify(player, null, 2));

		// Check if User table has saplData field
		const user = await prisma.user.findFirst({
			select: {
				id: true,
				username: true,
				email: true,
				saplId: true,
			},
		});

		console.log("\n📋 User table structure:");
		console.log(JSON.stringify(user, null, 2));
	} catch (error) {
		console.error("❌ Error testing schema:", error);
	} finally {
		await prisma.$disconnect();
	}
}

testSchema()
	.then(() => {
		console.log("✅ Schema test completed");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Schema test failed:", error);
		process.exit(1);
	});
