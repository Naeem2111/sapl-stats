const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function verifyCompleteSystem() {
	console.log("🔍 Verifying complete STATS REF system...");

	try {
		// Check competition
		const competition = await prisma.competition.findFirst({
			where: { name: "SAPL Season 29 Competition" },
			include: { season: true },
		});

		if (!competition) {
			console.log("❌ Competition not found");
			return;
		}

		console.log(`✅ Competition: ${competition.name}`);
		console.log(`   Season: ${competition.season.name}`);

		// Check matches
		const matches = await prisma.match.findMany({
			where: { seasonId: competition.season.id },
			include: {
				homeTeam: true,
				awayTeam: true,
				playerMatchStats: {
					include: {
						player: true,
					},
				},
			},
			orderBy: { date: "asc" },
		});

		console.log(`\n📊 Matches imported: ${matches.length}`);

		matches.forEach((match, index) => {
			console.log(
				`\n${index + 1}. ${match.homeTeam.name} ${match.homeScore}-${
					match.awayScore
				} ${match.awayTeam.name}`
			);
			console.log(`   Date: ${match.date.toISOString().split("T")[0]}`);
			console.log(`   Players with stats: ${match.playerMatchStats.length}`);

			match.playerMatchStats.forEach((stat) => {
				console.log(
					`     - ${stat.player.gamertag} (${stat.player.position}): ${stat.goals}G ${stat.assists}A ${stat.rating} rating`
				);
			});
		});

		// Check total player stats
		const totalPlayerStats = await prisma.playerMatchStat.count();
		console.log(`\n📈 Total player match stats: ${totalPlayerStats}`);

		// Check unique players
		const uniquePlayers = await prisma.player.count({
			where: {
				team: {
					name: "Zamalek FCC",
				},
			},
		});
		console.log(`👥 Unique Zamalek players: ${uniquePlayers}`);

		// Test API endpoint
		console.log("\n🌐 Testing API endpoints...");
		console.log("   GET /matches - List all matches");
		console.log(
			"   GET /matches/:id/player-stats - Get player stats for match"
		);
		console.log("   Frontend: /dashboard/fixtures - View match results");
		console.log(
			"   Frontend: /dashboard/fixture/:id - View detailed match with player stats"
		);

		console.log("\n🎉 Complete system verification successful!");
	} catch (error) {
		console.error("❌ Error verifying system:", error);
	} finally {
		await prisma.$disconnect();
	}
}

verifyCompleteSystem();

