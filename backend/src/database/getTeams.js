const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function getTeams() {
	try {
		const teams = await prisma.team.findMany({
			select: {
				id: true,
				name: true,
				saplId: true,
				teamId: true,
			},
		});

		console.log("Teams in database:");
		console.log("==================");
		teams.forEach((team) => {
			console.log(`- ${team.name}`);
			console.log(`  SAPL ID: ${team.saplId || "Not set"}`);
			console.log(`  Team ID: ${team.teamId || "Not set"}`);
			console.log("");
		});

		console.log(`Total teams: ${teams.length}`);
	} catch (error) {
		console.error("Error fetching teams:", error);
	} finally {
		await prisma.$disconnect();
	}
}

getTeams();
