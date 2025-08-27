const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
	log:
		process.env.NODE_ENV === "development"
			? ["query", "error", "warn"]
			: ["error"],
});

// Graceful shutdown
process.on("beforeExit", async () => {
	await prisma.$disconnect();
});

process.on("SIGINT", async () => {
	await prisma.$disconnect();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	await prisma.$disconnect();
	process.exit(0);
});

// Test database connection
async function testConnection() {
	try {
		await prisma.$connect();
		console.log("✅ Database connection successful");
		return true;
	} catch (error) {
		console.error("❌ Database connection failed:", error);
		return false;
	}
}

module.exports = { prisma, testConnection };
