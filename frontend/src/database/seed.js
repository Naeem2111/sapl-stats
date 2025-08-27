const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Starting database seeding...");

	try {
		// Create sample seasons
		console.log("📅 Creating seasons...");
		const season1 = await prisma.season.create({
			data: {
				name: "FC 26 Pro Clubs Season 1",
				startDate: new Date("2024-01-01"),
				endDate: new Date("2024-06-30"),
			},
		});

		const season2 = await prisma.season.create({
			data: {
				name: "FC 26 Pro Clubs Season 2",
				startDate: new Date("2024-07-01"),
				endDate: new Date("2024-12-31"),
			},
		});

		console.log("✅ Seasons created");

		// Create sample teams
		console.log("⚽ Creating teams...");
		const team1 = await prisma.team.create({
			data: {
				name: "Elite Warriors",
				logoUrl: "https://example.com/elite-warriors-logo.png",
			},
		});

		const team2 = await prisma.team.create({
			data: {
				name: "Champion Kings",
				logoUrl: "https://example.com/champion-kings-logo.png",
			},
		});

		const team3 = await prisma.team.create({
			data: {
				name: "Victory United",
				logoUrl: "https://example.com/victory-united-logo.png",
			},
		});

		console.log("✅ Teams created");

		// Create sample users and players
		console.log("👥 Creating users and players...");

		// Competition Admin user (highest level - can issue bans, create competitions, manual adjustments)
		const competitionAdminPassword = await bcrypt.hash("admin123", 12);
		const competitionAdminUser = await prisma.user.create({
			data: {
				username: "competition_admin",
				email: "competition.admin@proclubs.com",
				passwordHash: competitionAdminPassword,
				role: "COMPETITION_ADMIN",
			},
		});

		// League Admin user (can manage all teams + team admin powers)
		const leagueAdminPassword = await bcrypt.hash("admin123", 12);
		const leagueAdminUser = await prisma.user.create({
			data: {
				username: "league_admin",
				email: "league.admin@proclubs.com",
				passwordHash: leagueAdminPassword,
				role: "LEAGUE_ADMIN",
			},
		});

		// Team Admin user (captain/vice captain - can capture stats, request player changes)
		const teamAdminPassword = await bcrypt.hash("admin123", 12);
		const teamAdminUser = await prisma.user.create({
			data: {
				username: "team_admin",
				email: "team.admin@proclubs.com",
				passwordHash: teamAdminPassword,
				role: "TEAM_ADMIN",
			},
		});

		// Player users
		const player1Password = await bcrypt.hash("player123", 12);
		const player1User = await prisma.user.create({
			data: {
				username: "striker99",
				email: "striker@proclubs.com",
				passwordHash: player1Password,
				role: "PLAYER",
			},
		});

		const player2Password = await bcrypt.hash("player123", 12);
		const player2User = await prisma.user.create({
			data: {
				username: "midfield10",
				email: "midfield@proclubs.com",
				passwordHash: player2Password,
				role: "PLAYER",
			},
		});

		const player3Password = await bcrypt.hash("player123", 12);
		const player3User = await prisma.user.create({
			data: {
				username: "defender5",
				email: "defender@proclubs.com",
				passwordHash: player3Password,
				role: "PLAYER",
			},
		});

		const player4Password = await bcrypt.hash("player123", 12);
		const player4User = await prisma.user.create({
			data: {
				username: "goalkeeper1",
				email: "goalkeeper@proclubs.com",
				passwordHash: player4Password,
				role: "PLAYER",
			},
		});

		console.log("✅ Users created");

		// Create players
		const player1 = await prisma.player.create({
			data: {
				gamertag: "Striker99",
				realName: "Alex Johnson",
				position: "ST",
				userId: player1User.id,
				teamId: team1.id,
			},
		});

		const player2 = await prisma.player.create({
			data: {
				gamertag: "Midfield10",
				realName: "Sam Wilson",
				position: "CM",
				userId: player2User.id,
				teamId: team1.id,
			},
		});

		const player3 = await prisma.player.create({
			data: {
				gamertag: "Defender5",
				realName: "Mike Davis",
				position: "CB",
				userId: player3User.id,
				teamId: team2.id,
			},
		});

		const player4 = await prisma.player.create({
			data: {
				gamertag: "Goalkeeper1",
				realName: "Chris Lee",
				position: "GK",
				userId: player4User.id,
				teamId: team2.id,
			},
		});

		console.log("✅ Players created");

		// Create sample matches
		console.log("🏆 Creating matches...");
		const match1 = await prisma.match.create({
			data: {
				seasonId: season1.id,
				homeTeamId: team1.id,
				awayTeamId: team2.id,
				date: new Date("2024-01-15T20:00:00Z"),
				homeScore: 3,
				awayScore: 1,
				competitionType: "LEAGUE",
			},
		});

		const match2 = await prisma.match.create({
			data: {
				seasonId: season1.id,
				homeTeamId: team2.id,
				awayTeamId: team3.id,
				date: new Date("2024-01-22T20:00:00Z"),
				homeScore: 2,
				awayScore: 2,
				competitionType: "LEAGUE",
			},
		});

		const match3 = await prisma.match.create({
			data: {
				seasonId: season1.id,
				homeTeamId: team3.id,
				awayTeamId: team1.id,
				date: new Date("2024-01-29T20:00:00Z"),
				homeScore: 1,
				awayScore: 4,
				competitionType: "LEAGUE",
			},
		});

		console.log("✅ Matches created");

		// Create player match statistics
		console.log("📊 Creating player match statistics...");

		// Match 1 stats
		await prisma.playerMatchStat.create({
			data: {
				matchId: match1.id,
				playerId: player1.id,
				teamId: team1.id,
				goals: 2,
				assists: 1,
				shots: 5,
				passes: 45,
				passAccuracy: 88.9,
				tackles: 2,
				interceptions: 1,
				saves: 0,
				cleanSheet: false,
				rating: 8.5,
				minutesPlayed: 90,
			},
		});

		await prisma.playerMatchStat.create({
			data: {
				matchId: match1.id,
				playerId: player2.id,
				teamId: team1.id,
				goals: 1,
				assists: 2,
				shots: 3,
				passes: 52,
				passAccuracy: 92.3,
				tackles: 4,
				interceptions: 3,
				saves: 0,
				cleanSheet: false,
				rating: 8.0,
				minutesPlayed: 90,
			},
		});

		await prisma.playerMatchStat.create({
			data: {
				matchId: match1.id,
				playerId: player3.id,
				teamId: team2.id,
				goals: 0,
				assists: 0,
				shots: 1,
				passes: 38,
				passAccuracy: 85.7,
				tackles: 6,
				interceptions: 4,
				saves: 0,
				cleanSheet: false,
				rating: 6.5,
				minutesPlayed: 90,
			},
		});

		await prisma.playerMatchStat.create({
			data: {
				matchId: match1.id,
				playerId: player4.id,
				teamId: team2.id,
				goals: 0,
				assists: 0,
				shots: 0,
				passes: 12,
				passAccuracy: 75.0,
				tackles: 0,
				interceptions: 0,
				saves: 8,
				cleanSheet: false,
				rating: 7.0,
				minutesPlayed: 90,
			},
		});

		// Match 2 stats
		await prisma.playerMatchStat.create({
			data: {
				matchId: match2.id,
				playerId: player3.id,
				teamId: team2.id,
				goals: 1,
				assists: 0,
				shots: 2,
				passes: 42,
				passAccuracy: 87.5,
				tackles: 5,
				interceptions: 3,
				saves: 0,
				cleanSheet: false,
				rating: 7.5,
				minutesPlayed: 90,
			},
		});

		await prisma.playerMatchStat.create({
			data: {
				matchId: match2.id,
				playerId: player4.id,
				teamId: team2.id,
				goals: 0,
				assists: 0,
				shots: 0,
				passes: 15,
				passAccuracy: 80.0,
				tackles: 0,
				interceptions: 0,
				saves: 6,
				cleanSheet: false,
				rating: 7.5,
				minutesPlayed: 90,
			},
		});

		// Match 3 stats
		await prisma.playerMatchStat.create({
			data: {
				matchId: match3.id,
				playerId: player1.id,
				teamId: team1.id,
				goals: 3,
				assists: 1,
				shots: 7,
				passes: 48,
				passAccuracy: 91.7,
				tackles: 1,
				interceptions: 2,
				saves: 0,
				cleanSheet: false,
				rating: 9.0,
				minutesPlayed: 90,
			},
		});

		await prisma.playerMatchStat.create({
			data: {
				matchId: match3.id,
				playerId: player2.id,
				teamId: team1.id,
				goals: 1,
				assists: 3,
				shots: 2,
				passes: 55,
				passAccuracy: 94.5,
				tackles: 3,
				interceptions: 2,
				saves: 0,
				cleanSheet: false,
				rating: 8.5,
				minutesPlayed: 90,
			},
		});

		console.log("✅ Player match statistics created");

		// Create player season statistics
		console.log("📈 Creating player season statistics...");

		await prisma.playerSeasonStat.create({
			data: {
				seasonId: season1.id,
				playerId: player1.id,
				teamId: team1.id,
				totalGoals: 5,
				totalAssists: 2,
				totalShots: 12,
				totalPasses: 93,
				avgPassAccuracy: 90.3,
				totalTackles: 3,
				totalInterceptions: 3,
				totalSaves: 0,
				cleanSheets: 0,
				avgRating: 8.75,
				matchesPlayed: 2,
			},
		});

		await prisma.playerSeasonStat.create({
			data: {
				seasonId: season1.id,
				playerId: player2.id,
				teamId: team1.id,
				totalGoals: 2,
				totalAssists: 5,
				totalShots: 5,
				totalPasses: 107,
				avgPassAccuracy: 93.4,
				totalTackles: 7,
				totalInterceptions: 5,
				totalSaves: 0,
				cleanSheets: 0,
				avgRating: 8.25,
				matchesPlayed: 2,
			},
		});

		await prisma.playerSeasonStat.create({
			data: {
				seasonId: season1.id,
				playerId: player3.id,
				teamId: team2.id,
				totalGoals: 1,
				totalAssists: 0,
				totalShots: 3,
				totalPasses: 80,
				avgPassAccuracy: 86.6,
				totalTackles: 11,
				totalInterceptions: 7,
				totalSaves: 0,
				cleanSheets: 0,
				avgRating: 7.0,
				matchesPlayed: 2,
			},
		});

		await prisma.playerSeasonStat.create({
			data: {
				seasonId: season1.id,
				playerId: player4.id,
				teamId: team2.id,
				totalGoals: 0,
				totalAssists: 0,
				totalShots: 0,
				totalPasses: 27,
				avgPassAccuracy: 77.8,
				totalTackles: 0,
				totalInterceptions: 0,
				totalSaves: 14,
				cleanSheets: 0,
				avgRating: 7.25,
				matchesPlayed: 2,
			},
		});

		console.log("✅ Player season statistics created");

		console.log("🎉 Database seeding completed successfully!");
		console.log("\n📋 Sample Data Summary:");
		console.log(`- Seasons: ${season1.name}, ${season2.name}`);
		console.log(`- Teams: ${team1.name}, ${team2.name}, ${team3.name}`);
		console.log(
			`- Users: admin, manager, striker99, midfield10, defender5, goalkeeper1`
		);
		console.log(`- Matches: 3 league matches`);
		console.log(`- Statistics: Player performance data for all matches`);
		console.log("\n🔑 Default Login Credentials:");
		console.log("Admin: admin@proclubs.com / admin123");
		console.log("Manager: manager@proclubs.com / manager123");
		console.log("Players: player@proclubs.com / player123");
	} catch (error) {
		console.error("❌ Error during seeding:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((e) => {
	console.error("❌ Seeding failed:", e);
	process.exit(1);
});
