const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const prisma = new PrismaClient();

/**
 * Map Players to Teams from CSV Data
 *
 * This script reads the PERSON_1166.csv file and maps players to their teams
 * using the Person ID and team names from the CSV data.
 */

async function mapPlayersToTeams() {
	console.log("🔄 Starting player-to-team mapping process...");

	try {
		// Read CSV data
		const csvData = await readCSVData();
		console.log(`📊 Loaded ${csvData.length} records from CSV`);

		// Extract unique team names
		const teamNames = extractUniqueTeamNames(csvData);
		console.log(`🏟️ Found ${teamNames.length} unique teams`);

		// Create or update teams in database
		const teamMapping = await createOrUpdateTeams(teamNames);
		console.log(`✅ Created/updated ${Object.keys(teamMapping).length} teams`);

		// Map players to teams
		const mappingResults = await mapPlayersToTeamsFromCSV(csvData, teamMapping);

		console.log("🎉 Player-to-team mapping completed!");
		console.log(`📈 Results:`);
		console.log(`   - Players mapped: ${mappingResults.mapped}`);
		console.log(`   - Players skipped: ${mappingResults.skipped}`);
		console.log(`   - Errors: ${mappingResults.errors}`);

		return mappingResults;
	} catch (error) {
		console.error("❌ Error in player-to-team mapping:", error);
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
						role: data.Role, // Include the role from CSV
						teams: data.Teams,
						activeFrom: data["Active From"],
						activeTo: data["Active To"],
						status: data.Status,
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
						source: "CSV_Import",
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

async function mapPlayersToTeamsFromCSV(csvData, teamMapping) {
	let mapped = 0;
	let skipped = 0;
	let errors = 0;

	for (const record of csvData) {
		try {
			// Find player by saplId (Person ID)
			const player = await prisma.player.findFirst({
				where: {
					saplId: record.personId,
				},
				include: {
					user: true,
				},
			});

			if (!player) {
				console.log(
					`   ⚠️  Player with Person ID ${record.personId} not found in database`
				);
				skipped++;
				continue;
			}

			// Get the primary team (first team if multiple)
			const primaryTeamName = record.teams.split(",")[0].trim();
			const teamId = teamMapping[primaryTeamName];

			if (!teamId) {
				console.log(
					`   ⚠️  Team "${primaryTeamName}" not found in mapping for player ${record.personId}`
				);
				skipped++;
				continue;
			}

			// Update player with team assignment
			await prisma.player.update({
				where: { id: player.id },
				data: {
					teamId: teamId,
					// Update the teams field with the full team information
					teams: record.teams,
				},
			});

			console.log(
				`   ✅ Mapped player ${record.firstName} ${record.lastName} (${record.personId}) to team "${primaryTeamName}"`
			);
			mapped++;
		} catch (error) {
			console.error(
				`   ❌ Error mapping player ${record.personId}:`,
				error.message
			);
			errors++;
		}
	}

	return { mapped, skipped, errors };
}

async function main() {
	try {
		await mapPlayersToTeams();
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

module.exports = { mapPlayersToTeams };
