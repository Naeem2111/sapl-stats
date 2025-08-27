const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Starting database seeding...");

	try {
		// Clean up existing data first
		console.log("🧹 Cleaning up existing data...");
		await prisma.awardedBadge.deleteMany();
		await prisma.badge.deleteMany();
		await prisma.playerSeasonStat.deleteMany();
		await prisma.playerMatchStat.deleteMany();
		await prisma.match.deleteMany();
		await prisma.player.deleteMany();
		await prisma.user.deleteMany();
		await prisma.team.deleteMany();
		await prisma.season.deleteMany();
		console.log("✅ Existing data cleaned up");

		// Create seasons
		console.log("Creating seasons...");
		const season1 = await prisma.season.create({
			data: {
				name: "Season 1 - 2024",
				startDate: new Date("2024-01-01"),
				endDate: new Date("2024-12-31"),
			},
		});

		const season2 = await prisma.season.create({
			data: {
				name: "Season 2 - 2025",
				startDate: new Date("2025-01-01"),
				endDate: new Date("2025-12-31"),
			},
		});

		console.log("✅ Seasons created");

		// Create teams
		console.log("Creating teams...");
		const team1 = await prisma.team.create({
			data: {
				name: "Red Dragons",
				logoUrl: "https://example.com/red-dragons.png",
			},
		});

		const team2 = await prisma.team.create({
			data: {
				name: "Blue Lions",
				logoUrl: "https://example.com/blue-lions.png",
			},
		});

		const team3 = await prisma.team.create({
			data: {
				name: "Green Eagles",
				logoUrl: "https://example.com/green-eagles.png",
			},
		});

		console.log("✅ Teams created");

		// Create users with different roles
		console.log("Creating users...");

		// Competition Admin user (highest level - can issue bans, create competitions, manual adjustments)
		const competitionAdminPassword = await bcrypt.hash("admin123", 12);
		const competitionAdminUser = await prisma.user.create({
			data: {
				username: "competition_admin",
				email: "competition_admin@proclubs.com",
				passwordHash: competitionAdminPassword,
				role: "COMPETITION_ADMIN",
			},
		});

		// League Admin user (can manage all teams + team admin powers)
		const leagueAdminPassword = await bcrypt.hash("league123", 12);
		const leagueAdminUser = await prisma.user.create({
			data: {
				username: "league_admin",
				email: "league_admin@proclubs.com",
				passwordHash: leagueAdminPassword,
				role: "LEAGUE_ADMIN",
			},
		});

		// Team Admin users (Captain/vice captain - can capture stats, request player changes)
		const teamAdmin1Password = await bcrypt.hash("team123", 12);
		const teamAdmin1User = await prisma.user.create({
			data: {
				username: "team_admin_1",
				email: "team_admin_1@proclubs.com",
				passwordHash: teamAdmin1Password,
				role: "TEAM_ADMIN",
			},
		});

		const teamAdmin2Password = await bcrypt.hash("team123", 12);
		const teamAdmin2User = await prisma.user.create({
			data: {
				username: "team_admin_2",
				email: "team_admin_2@proclubs.com",
				passwordHash: teamAdmin2Password,
				role: "TEAM_ADMIN",
			},
		});

		// Player users (basic users - can view stats, limited operations)
		const player1Password = await bcrypt.hash("player123", 12);
		const player1User = await prisma.user.create({
			data: {
				username: "player_1",
				email: "player_1@proclubs.com",
				passwordHash: player1Password,
				role: "PLAYER",
			},
		});

		const player2Password = await bcrypt.hash("player123", 12);
		const player2User = await prisma.user.create({
			data: {
				username: "player_2",
				email: "player_2@proclubs.com",
				passwordHash: player2Password,
				role: "PLAYER",
			},
		});

		console.log("✅ Users created");

		// Create players and associate with users
		console.log("Creating players...");
		const player1 = await prisma.player.create({
			data: {
				gamertag: "DragonSlayer",
				realName: "John Smith",
				position: "ST",
				userId: player1User.id,
				teamId: team1.id,
			},
		});

		const player2 = await prisma.player.create({
			data: {
				gamertag: "LionHeart",
				realName: "Mike Johnson",
				position: "CM",
				userId: player2User.id,
				teamId: team2.id,
			},
		});

		const player3 = await prisma.player.create({
			data: {
				gamertag: "EagleEye",
				realName: "David Wilson",
				position: "GK",
				userId: teamAdmin1User.id,
				teamId: team1.id,
			},
		});

		const player4 = await prisma.player.create({
			data: {
				gamertag: "SwiftStriker",
				realName: "Alex Brown",
				position: "LW",
				userId: teamAdmin2User.id,
				teamId: team2.id,
			},
		});

		// Add more players for realistic team rosters (without user accounts)
		const player5 = await prisma.player.create({
			data: {
				gamertag: "MidfieldMaestro",
				realName: "Chris Davis",
				position: "CAM",
				userId: null, // No user account yet
				teamId: team1.id,
			},
		});

		const player6 = await prisma.player.create({
			data: {
				gamertag: "DefensiveRock",
				realName: "Tom Wilson",
				position: "CB",
				userId: null, // No user account yet
				teamId: team2.id,
			},
		});

		const player7 = await prisma.player.create({
			data: {
				gamertag: "SpeedDemon",
				realName: "Ryan Garcia",
				position: "RW",
				userId: null, // No user account yet
				teamId: team3.id,
			},
		});

		const player8 = await prisma.player.create({
			data: {
				gamertag: "GoalMachine",
				realName: "Sam Rodriguez",
				position: "ST",
				userId: null, // No user account yet
				teamId: team3.id,
			},
		});

		// Add some players without teams (free agents)
		const player9 = await prisma.player.create({
			data: {
				gamertag: "FreeAgent1",
				realName: "Jake Miller",
				position: "CDM",
				userId: null,
				teamId: null, // No team assigned
			},
		});

		const player10 = await prisma.player.create({
			data: {
				gamertag: "FreeAgent2",
				realName: "Luke Thompson",
				position: "LB",
				userId: null,
				teamId: null, // No team assigned
			},
		});

		console.log("✅ Players created");
		console.log(
			"📝 Note: Some players have no user accounts or team assignments - simulating real league scenarios"
		);

		// Create matches
		console.log("Creating matches...");

		// Completed matches with full stats
		const match1 = await prisma.match.create({
			data: {
				date: new Date("2024-02-15T20:00:00Z"),
				homeTeamId: team1.id,
				awayTeamId: team2.id,
				homeScore: 3,
				awayScore: 1,
				seasonId: season1.id,
				competitionType: "LEAGUE",
				status: "COMPLETED",
			},
		});

		const match2 = await prisma.match.create({
			data: {
				date: new Date("2024-02-22T20:00:00Z"),
				homeTeamId: team2.id,
				awayTeamId: team3.id,
				homeScore: 2,
				awayScore: 2,
				seasonId: season1.id,
				competitionType: "LEAGUE",
				status: "COMPLETED",
			},
		});

		// Completed match with scores but NO player stats (needs stats entry)
		const match3 = await prisma.match.create({
			data: {
				date: new Date("2024-03-01T20:00:00Z"),
				homeTeamId: team1.id,
				awayTeamId: team3.id,
				homeScore: 2,
				awayScore: 0,
				seasonId: season1.id,
				competitionType: "LEAGUE",
				status: "COMPLETED",
			},
		});

		// More completed matches with different competition types
		const match4 = await prisma.match.create({
			data: {
				date: new Date("2024-03-08T20:00:00Z"),
				homeTeamId: team3.id,
				awayTeamId: team1.id,
				homeScore: 1,
				awayScore: 4,
				seasonId: season1.id,
				competitionType: "CUP",
				status: "COMPLETED",
			},
		});

		const match5 = await prisma.match.create({
			data: {
				date: new Date("2024-03-15T20:00:00Z"),
				homeTeamId: team2.id,
				awayTeamId: team1.id,
				homeScore: 0,
				awayScore: 2,
				seasonId: season1.id,
				competitionType: "LEAGUE",
				status: "COMPLETED",
			},
		});

		// Upcoming fixtures (scheduled matches)
		const match6 = await prisma.match.create({
			data: {
				date: new Date("2024-04-01T20:00:00Z"),
				homeTeamId: team1.id,
				awayTeamId: team2.id,
				seasonId: season1.id,
				competitionType: "LEAGUE",
				status: "SCHEDULED",
			},
		});

		const match7 = await prisma.match.create({
			data: {
				date: new Date("2024-04-08T20:00:00Z"),
				homeTeamId: team3.id,
				awayTeamId: team2.id,
				seasonId: season1.id,
				competitionType: "FRIENDLY",
				status: "SCHEDULED",
			},
		});

		const match8 = await prisma.match.create({
			data: {
				date: new Date("2024-04-15T20:00:00Z"),
				homeTeamId: team2.id,
				awayTeamId: team1.id,
				seasonId: season1.id,
				competitionType: "LEAGUE",
				status: "SCHEDULED",
			},
		});

		// Season 2 matches
		const match9 = await prisma.match.create({
			data: {
				date: new Date("2025-01-15T20:00:00Z"),
				homeTeamId: team1.id,
				awayTeamId: team3.id,
				homeScore: 3,
				awayScore: 1,
				seasonId: season2.id,
				competitionType: "LEAGUE",
				status: "COMPLETED",
			},
		});

		const match10 = await prisma.match.create({
			data: {
				date: new Date("2025-01-22T20:00:00Z"),
				homeTeamId: team2.id,
				awayTeamId: team1.id,
				homeScore: 1,
				awayScore: 1,
				seasonId: season2.id,
				competitionType: "LEAGUE",
				status: "COMPLETED",
			},
		});

		console.log("✅ Matches created");

		// Create player match statistics
		console.log("Creating player match statistics...");

		// Match 1: Full stats for both teams
		await prisma.playerMatchStat.create({
			data: {
				playerId: player1.id,
				matchId: match1.id,
				teamId: team1.id,
				goals: 2,
				assists: 1,
				rating: 8.5,
				minutesPlayed: 90,
				shots: 5,
				passes: 45,
				passAccuracy: 0.89,
				tackles: 2,
				interceptions: 1,
				saves: 0,
				cleanSheet: false,
			},
		});

		await prisma.playerMatchStat.create({
			data: {
				playerId: player2.id,
				matchId: match1.id,
				teamId: team2.id,
				goals: 1,
				assists: 0,
				rating: 7.0,
				minutesPlayed: 90,
				shots: 3,
				passes: 52,
				passAccuracy: 0.85,
				tackles: 4,
				interceptions: 2,
				saves: 0,
				cleanSheet: false,
			},
		});

		// Match 2: Full stats for one team, partial for other
		await prisma.playerMatchStat.create({
			data: {
				playerId: player2.id,
				matchId: match2.id,
				teamId: team2.id,
				goals: 1,
				assists: 1,
				rating: 8.0,
				minutesPlayed: 90,
				shots: 4,
				passes: 48,
				passAccuracy: 0.88,
				tackles: 3,
				interceptions: 1,
				saves: 0,
				cleanSheet: false,
			},
		});

		// Match 3: NO PLAYER STATS - This simulates a completed match where stats still need to be entered
		// This is the key scenario you mentioned - result recorded but player stats pending

		// Match 4: Cup match with full stats
		await prisma.playerMatchStat.create({
			data: {
				playerId: player1.id,
				matchId: match4.id,
				teamId: team1.id,
				goals: 3,
				assists: 1,
				rating: 9.0,
				minutesPlayed: 90,
				shots: 7,
				passes: 52,
				passAccuracy: 0.92,
				tackles: 1,
				interceptions: 0,
				saves: 0,
				cleanSheet: false,
			},
		});

		await prisma.playerMatchStat.create({
			data: {
				playerId: player3.id,
				matchId: match4.id,
				teamId: team3.id,
				goals: 1,
				assists: 0,
				rating: 6.5,
				minutesPlayed: 90,
				shots: 2,
				passes: 38,
				passAccuracy: 0.79,
				tackles: 3,
				interceptions: 2,
				saves: 0,
				cleanSheet: false,
			},
		});

		// Match 5: Partial stats - some players recorded, others pending
		await prisma.playerMatchStat.create({
			data: {
				playerId: player1.id,
				matchId: match5.id,
				teamId: team1.id,
				goals: 1,
				assists: 1,
				rating: 7.5,
				minutesPlayed: 90,
				shots: 4,
				passes: 41,
				passAccuracy: 0.85,
				tackles: 2,
				interceptions: 1,
				saves: 0,
				cleanSheet: true,
			},
		});

		// Match 9: Season 2 match with full stats
		await prisma.playerMatchStat.create({
			data: {
				playerId: player1.id,
				matchId: match9.id,
				teamId: team1.id,
				goals: 2,
				assists: 1,
				rating: 8.0,
				minutesPlayed: 90,
				shots: 6,
				passes: 48,
				passAccuracy: 0.87,
				tackles: 3,
				interceptions: 1,
				saves: 0,
				cleanSheet: false,
			},
		});

		await prisma.playerMatchStat.create({
			data: {
				playerId: player3.id,
				matchId: match9.id,
				teamId: team3.id,
				goals: 1,
				assists: 0,
				rating: 6.0,
				minutesPlayed: 90,
				shots: 3,
				passes: 35,
				passAccuracy: 0.77,
				tackles: 4,
				interceptions: 2,
				saves: 0,
				cleanSheet: false,
			},
		});

		console.log("✅ Player match statistics created");
		console.log(
			"📝 Note: Match 3 (Red Dragons vs Green Eagles) has results but NO player stats - simulating pending stats entry"
		);

		// Create player season statistics
		console.log("Creating player season statistics...");
		await prisma.playerSeasonStat.create({
			data: {
				playerId: player1.id,
				seasonId: season1.id,
				teamId: team1.id,
				matchesPlayed: 1,
				totalGoals: 2,
				totalAssists: 1,
				avgRating: 8.5,
				totalShots: 5,
				totalPasses: 45,
				avgPassAccuracy: 0.89,
				totalTackles: 2,
				totalInterceptions: 1,
				totalSaves: 0,
				cleanSheets: 0,
			},
		});

		await prisma.playerSeasonStat.create({
			data: {
				playerId: player2.id,
				seasonId: season1.id,
				teamId: team2.id,
				matchesPlayed: 2,
				totalGoals: 2,
				totalAssists: 1,
				avgRating: 7.5,
				totalShots: 7,
				totalPasses: 100,
				avgPassAccuracy: 0.87,
				totalTackles: 7,
				totalInterceptions: 3,
				totalSaves: 0,
				cleanSheets: 0,
			},
		});

		console.log("✅ Player season statistics created");

		// Create badges
		console.log("Creating badges...");
		const badges = await Promise.all([
			// Performance badges
			prisma.badge.create({
				data: {
					name: "Hat-trick Hero",
					description: "Score 3 or more goals in a single match",
					iconUrl: "https://example.com/badges/hattrick.png",
					category: "PERFORMANCE",
					criteria: "HATTRICK",
					isRepeatable: true,
				},
			}),
			prisma.badge.create({
				data: {
					name: "Brace Master",
					description: "Score 2 goals in a single match",
					iconUrl: "https://example.com/badges/brace.png",
					category: "PERFORMANCE",
					criteria: "BRACE",
					isRepeatable: true,
				},
			}),
			prisma.badge.create({
				data: {
					name: "Playmaker",
					description: "Provide 3 or more assists in a single match",
					iconUrl: "https://example.com/badges/playmaker.png",
					category: "PERFORMANCE",
					criteria: "ASSISTS",
					isRepeatable: true,
				},
			}),
			prisma.badge.create({
				data: {
					name: "Clean Sheet Defender",
					description: "Keep a clean sheet as a defender",
					iconUrl: "https://example.com/badges/clean-sheet-def.png",
					category: "PERFORMANCE",
					criteria: "CLEAN_SHEETS",
					isRepeatable: true,
				},
			}),
			prisma.badge.create({
				data: {
					name: "Wall Keeper",
					description: "Keep a clean sheet as a goalkeeper",
					iconUrl: "https://example.com/badges/wall-keeper.png",
					category: "PERFORMANCE",
					criteria: "GOALKEEPER",
					isRepeatable: true,
				},
			}),
			// Achievement badges
			prisma.badge.create({
				data: {
					name: "Team of the Week",
					description: "Selected in the weekly best XI",
					iconUrl: "https://example.com/badges/team-of-week.png",
					category: "ACHIEVEMENT",
					criteria: "TEAM_OF_WEEK",
					isRepeatable: true,
				},
			}),
			prisma.badge.create({
				data: {
					name: "Goal Machine",
					description: "Score 10+ goals in a season",
					iconUrl: "https://example.com/badges/goal-machine.png",
					category: "ACHIEVEMENT",
					criteria: "GOALS",
					isRepeatable: false,
				},
			}),
			prisma.badge.create({
				data: {
					name: "Assist King",
					description: "Provide 10+ assists in a season",
					iconUrl: "https://example.com/badges/assist-king.png",
					category: "ACHIEVEMENT",
					criteria: "ASSISTS",
					isRepeatable: false,
				},
			}),
			prisma.badge.create({
				data: {
					name: "Iron Man",
					description: "Play 90 minutes in 10 consecutive matches",
					iconUrl: "https://example.com/badges/iron-man.png",
					category: "ACHIEVEMENT",
					criteria: "PERFECT_GAME",
					isRepeatable: false,
				},
			}),
			prisma.badge.create({
				data: {
					name: "Match Winner",
					description: "Score the winning goal in a match",
					iconUrl: "https://example.com/badges/match-winner.png",
					category: "ACHIEVEMENT",
					criteria: "MATCH_WINNER",
					isRepeatable: true,
				},
			}),
		]);

		console.log("✅ Badges created");

		// Award some badges to players based on their stats
		console.log("Awarding badges to players...");
		await Promise.all([
			// Player 1 gets hat-trick hero for scoring 2 goals (close to hat-trick)
			prisma.awardedBadge.create({
				data: {
					badgeId: badges[0].id, // Hat-trick Hero
					playerId: player1.id,
					seasonId: season1.id,
					matchId: match1.id,
					metadata: {
						goals: 2,
						match: "Red Dragons vs Blue Lions",
						date: match1.date,
					},
				},
			}),
			// Player 2 gets playmaker for 1 assist
			prisma.awardedBadge.create({
				data: {
					badgeId: badges[2].id, // Playmaker
					playerId: player2.id,
					seasonId: season1.id,
					matchId: match1.id,
					metadata: {
						assists: 1,
						match: "Red Dragons vs Blue Lions",
						date: match1.date,
					},
				},
			}),
			// Player 3 gets clean sheet defender
			prisma.awardedBadge.create({
				data: {
					badgeId: badges[3].id, // Clean Sheet Defender
					playerId: player3.id,
					seasonId: season1.id,
					matchId: match2.id,
					metadata: {
						cleanSheet: true,
						match: "Blue Lions vs Green Eagles",
						date: match2.date,
					},
				},
			}),
		]);

		console.log("✅ Badges awarded to players");

		console.log("🎉 Database seeding completed successfully!");
		console.log("\n📊 Data Summary:");
		console.log("• 2 Seasons (2024 & 2025)");
		console.log("• 3 Teams (Red Dragons, Blue Lions, Green Eagles)");
		console.log("• 6 Users with different roles");
		console.log("• 10 Players (including free agents)");
		console.log(
			"• 10 Matches (5 completed, 3 scheduled, 2 with pending stats)"
		);
		console.log("• Mixed competition types (League, Cup, Friendly)");
		console.log("• 10 Badges (Performance & Achievement categories)");
		console.log("• 3 Badges awarded to players (sample achievements)");
		console.log("\n📋 Test Credentials:");
		console.log("Team Admin: team_admin_1@proclubs.com / team123");
		console.log("League Admin: league_admin@proclubs.com / league123");
		console.log("Competition Admin: competition_admin@proclubs.com / admin123");
		console.log("Player: player_1@proclubs.com / player123");
		console.log("\n🔍 Key Scenarios Created:");
		console.log(
			"• Match 3: Completed with scores but NO player stats (needs stats entry)"
		);
		console.log(
			"• Match 5: Partial stats (some players recorded, others pending)"
		);
		console.log("• Upcoming fixtures for testing scheduling");
		console.log("• Free agents for testing team management");
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
