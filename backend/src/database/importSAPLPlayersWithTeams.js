const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

/**
 * Complete SAPL Player Import with Team Mapping
 *
 * This script imports players from PERSON_1166.csv and properly maps them to teams.
 * It handles:
 * 1. Creating users from CSV data
 * 2. Creating player records
 * 3. Creating teams from team names
 * 4. Mapping players to their teams
 */

/**
 * Map CSV role to system UserRole
 */
function mapRoleToUserRole(csvRole) {
	switch (csvRole) {
		case "Player":
			return "PLAYER";
		case "Team Admin":
		case "Team Administrator":
			return "TEAM_ADMIN";
		case "League Admin":
		case "League Administrator":
			return "LEAGUE_ADMIN";
		case "Competition Admin":
		case "Competition Administrator":
			return "COMPETITION_ADMIN";
		default:
			return "PLAYER"; // Default to PLAYER for unknown roles
	}
}

async function importSAPLPlayersWithTeams() {
	console.log("🚀 Starting complete SAPL player import with team mapping...");

	try {
		// Read CSV data
		const csvData = await readCSVData();
		console.log(`📊 Loaded ${csvData.length} player records from CSV`);

		// Extract unique team names and create teams
		const teamNames = extractUniqueTeamNames(csvData);
		console.log(`🏟️ Found ${teamNames.length} unique teams`);

		const teamMapping = await createOrUpdateTeams(teamNames);
		console.log(`✅ Created/updated ${Object.keys(teamMapping).length} teams`);

		// Import players
		const importResults = await importPlayersFromCSV(csvData, teamMapping);

		console.log("🎉 SAPL player import completed!");
		console.log(`📈 Results:`);
		console.log(`   - Users created: ${importResults.usersCreated}`);
		console.log(`   - Players created: ${importResults.playersCreated}`);
		console.log(`   - Players mapped to teams: ${importResults.playersMapped}`);
		console.log(`   - Skipped: ${importResults.skipped}`);
		console.log(`   - Errors: ${importResults.errors}`);

		return importResults;
	} catch (error) {
		console.error("❌ Error in SAPL player import:", error);
		throw error;
	}
}

async function readCSVData() {
	return new Promise((resolve, reject) => {
		const csvPath = path.join(__dirname, "../../../PERSON_1166.csv");
		const results = [];

		fs.createReadStream(csvPath)
			.pipe(csv())
			.on("data", (data) => {
				// Process all records with Person ID and Teams (including admins who also play)
				if (data["Person ID"] && data.Teams) {
					results.push({
						personId: data["Person ID"],
						firstName: data["First Name"],
						lastName: data["Last Name"],
						userName: data["User Name"],
						email: data["Email Addr"],
						role: data.Role, // Include the role from CSV
						teams: data.Teams,
						activeFrom: data["Active From"],
						activeTo: data["Active To"],
						status: data.Status,
						phone:
							data["Mobile Phone"] || data["Work Phone"] || data["Home Phone"],
						internalRef1: data["Internal Ref 1"],
						internalRef2: data["Internal Ref 2"],
					});
				}
			})
			.on("end", () => {
				resolve(results);
			})
			.on("error", (error) => {
				reject(error);
			});
	});
}

function extractUniqueTeamNames(csvData) {
	const teamNames = new Set();

	csvData.forEach((record) => {
		if (record.teams) {
			// Handle multiple teams separated by commas
			const teams = record.teams
				.split(",")
				.map((team) => team.trim())
				.filter((team) => team);
			teams.forEach((team) => teamNames.add(team));
		}
	});

	return Array.from(teamNames).sort();
}

async function createOrUpdateTeams(teamNames) {
	const teamMapping = {};

	for (const teamName of teamNames) {
		try {
			// Check if team already exists
			let team = await prisma.team.findFirst({
				where: {
					OR: [
						{ name: teamName },
						{ name: { contains: teamName, mode: "insensitive" } },
					],
				},
			});

			if (!team) {
				// Create new team
				team = await prisma.team.create({
					data: {
						name: teamName,
					},
				});
				console.log(`   ✅ Created team: ${teamName}`);
			} else {
				console.log(`   📋 Found existing team: ${teamName}`);
			}

			teamMapping[teamName] = team.id;
		} catch (error) {
			console.error(`   ❌ Error processing team ${teamName}:`, error.message);
		}
	}

	return teamMapping;
}

async function importPlayersFromCSV(csvData, teamMapping) {
	let usersCreated = 0;
	let playersCreated = 0;
	let playersMapped = 0;
	let skipped = 0;
	let errors = 0;

	// Generate a default password for all imported users
	const defaultPassword = "SAPL2024!";
	const passwordHash = await bcrypt.hash(defaultPassword, 10);

	for (const record of csvData) {
		try {
			// Check if user already exists by saplId
			const existingUser = await prisma.user.findFirst({
				where: { saplId: record.personId },
			});

			if (existingUser) {
				console.log(
					`   ⚠️  User with Person ID ${record.personId} already exists, skipping...`
				);
				skipped++;
				continue;
			}

			// Generate username and email
			const username =
				record.userName ||
				`${record.firstName}_${record.lastName}`
					.toLowerCase()
					.replace(/\s+/g, "_");
			const email =
				record.email ||
				`${username}_${Math.random().toString(36).substr(2, 6)}@proclubs.local`;

			// Create user
			const user = await prisma.user.create({
				data: {
					username: username,
					email: email,
					passwordHash: passwordHash,
					role: mapRoleToUserRole(record.role),
					saplId: record.personId,
				},
			});

			usersCreated++;

			// Get the primary team (first team if multiple)
			const primaryTeamName = record.teams.split(",")[0].trim();
			const teamId = teamMapping[primaryTeamName];

			// Parse date strings to DateTime objects
			const parseDate = (dateStr) => {
				if (!dateStr || dateStr === "" || dateStr === "Invalid Date")
					return null;
				try {
					const date = new Date(dateStr);
					if (isNaN(date.getTime())) {
						return null;
					}
					return date;
				} catch (error) {
					return null;
				}
			};

			// Create player record
			const player = await prisma.player.create({
				data: {
					gamertag: username,
					realName: `${record.firstName} ${record.lastName}`.trim(),
					firstName: record.firstName,
					lastName: record.lastName,
					position: "UNKNOWN",
					userId: user.id,
					saplId: record.personId,
					teamId: teamId || null, // Map to team if found
					teams: record.teams,
					activeFrom: parseDate(record.activeFrom),
					activeTo: parseDate(record.activeTo),
					phone: record.phone,
					status: record.status,
					internalRef1: record.internalRef1,
					internalRef2: record.internalRef2,
				},
			});

			playersCreated++;
			if (teamId) {
				playersMapped++;
			}

			// Log every 50 imports
			if (usersCreated % 50 === 0) {
				console.log(
					`   📊 Imported ${usersCreated} users and ${playersCreated} players...`
				);
			}
		} catch (error) {
			console.error(
				`   ❌ Error importing player ${record.personId}:`,
				error.message
			);
			errors++;
		}
	}

	return { usersCreated, playersCreated, playersMapped, skipped, errors };
}

async function main() {
	try {
		await importSAPLPlayersWithTeams();
	} catch (error) {
		console.error("Script failed:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// Run the script if called directly
if (require.main === module) {
	main();
}

module.exports = { importSAPLPlayersWithTeams };
