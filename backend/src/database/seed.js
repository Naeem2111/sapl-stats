const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

/**
 * Clean Database Seed File for LeagueRepublic Integration
 *
 * This seed file creates:
 * 1. Basic seasons (28, 27, 26)
 * 2. League structure based on LeagueRepublic
 * 3. Admin user for testing
 * 4. Clean database structure
 */

async function main() {
	console.log("🌱 Starting clean database seeding...");

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
		await prisma.league.deleteMany();
		await prisma.season.deleteMany();
		console.log("✅ Existing data cleaned up");

		// Create seasons
		console.log("📅 Creating seasons...");
		const season28 = await prisma.season.create({
			data: {
				name: "Season 28",
				startDate: new Date("2024-01-01"),
				endDate: new Date("2024-12-31"),
				isActive: true,
			},
		});

		const season27 = await prisma.season.create({
			data: {
				name: "Season 27",
				startDate: new Date("2023-01-01"),
				endDate: new Date("2023-12-31"),
				isActive: false,
			},
		});

		const season26 = await prisma.season.create({
			data: {
				name: "Season 26",
				startDate: new Date("2022-01-01"),
				endDate: new Date("2022-12-31"),
				isActive: false,
			},
		});

		console.log("✅ Seasons created");

		// Create leagues based on LeagueRepublic structure
		console.log("🏆 Creating leagues...");
		const leagues = await Promise.all([
			prisma.league.create({
				data: {
					name: "SL Prem",
					description: "Super League Premiership",
					isActive: true,
					saplData: {
						source: "LeagueRepublic",
						fixtureGroupId: "864938965",
						level: "Premier",
						priority: 1,
					},
				},
			}),
			prisma.league.create({
				data: {
					name: "SL Champs",
					description: "Super League Championship",
					isActive: true,
					saplData: {
						source: "LeagueRepublic",
						fixtureGroupId: "826927856",
						level: "Championship",
						priority: 2,
					},
				},
			}),
			prisma.league.create({
				data: {
					name: "Super League 1 West",
					description: "Super League 1 West Division",
					isActive: true,
					saplData: {
						source: "LeagueRepublic",
						fixtureGroupId: "436052018",
						level: "Division 1",
						priority: 3,
					},
				},
			}),
			prisma.league.create({
				data: {
					name: "Super League 1 East",
					description: "Super League 1 East Division",
					isActive: true,
					saplData: {
						source: "LeagueRepublic",
						fixtureGroupId: "258156888",
						level: "Division 1",
						priority: 4,
					},
				},
			}),
			prisma.league.create({
				data: {
					name: "Super League Conference",
					description: "Super League Conference Division",
					isActive: true,
					saplData: {
						source: "LeagueRepublic",
						fixtureGroupId: "729386372",
						level: "Conference",
						priority: 5,
					},
				},
			}),
			prisma.league.create({
				data: {
					name: "Premiership",
					description: "Premiership Division",
					isActive: true,
					saplData: {
						source: "LeagueRepublic",
						fixtureGroupId: "966984927",
						level: "Premier",
						priority: 6,
					},
				},
			}),
			prisma.league.create({
				data: {
					name: "Championship",
					description: "Championship Division",
					isActive: true,
					saplData: {
						source: "LeagueRepublic",
						fixtureGroupId: "677552147",
						level: "Championship",
						priority: 7,
					},
				},
			}),
		]);

		console.log("✅ Leagues created");

		// Create admin user
		console.log("👤 Creating admin user...");
		const adminPassword = await bcrypt.hash("admin123", 12);
		const adminUser = await prisma.user.create({
			data: {
				username: "admin",
				email: "admin@proclubs.com",
				passwordHash: adminPassword,
				role: "COMPETITION_ADMIN",
			},
		});

		console.log("✅ Admin user created");

		// Create some basic teams for testing
		console.log("🏟️ Creating sample teams...");
		const sampleTeams = await Promise.all([
			prisma.team.create({
				data: {
					name: "Sample Team 1",
					logoUrl: null,
					leagueId: leagues[0].id, // SL Prem
				},
			}),
			prisma.team.create({
				data: {
					name: "Sample Team 2",
					logoUrl: null,
					leagueId: leagues[1].id, // SL Champs
				},
			}),
		]);

		console.log("✅ Sample teams created");

		console.log("\n🎉 Database seeding completed successfully!");
		console.log(`📊 Created ${leagues.length} leagues`);
		console.log(
			`👤 Created admin user: admin@proclubs.com (password: admin123)`
		);
		console.log(`🏟️ Created ${sampleTeams.length} sample teams`);
		console.log("\n🚀 Next steps:");
		console.log(
			"1. Run 'npm run db:import-users' to import test users from CSV files"
		);
		console.log("2. Run LeagueRepublic import to get real team data");
		console.log("3. Import player data from LeagueRepublic");
		console.log("4. Test the frontend with real data");
	} catch (error) {
		console.error("❌ Error during seeding:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

main()
	.then(() => {
		console.log("✅ Seeding completed");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Seeding failed:", error);
		process.exit(1);
	});
