const { PrismaClient } = require("@prisma/client");
const axios = require("axios");

const prisma = new PrismaClient();

/**
 * Import Team Statistics from League Republic API
 *
 * This script fetches team statistics from League Republic API and maps them to players
 * in our database. It handles comprehensive stat tracking for Season 29.
 */

/**
 * Map League Republic stat types to our database fields
 */
function mapStatType(leagueStatTypeName) {
	const statMap = {
		"Pass Accuracy": "avgPassAccuracy",
		"Possesion Lost": "totalPossessionLost", // Note: API has typo "Possesion"
		"Possession Lost": "totalPossessionLost",
		"Possession Won": "totalPossessionWon",
		"Man Of The Match": "manOfTheMatchCount",
		Goals: "totalGoals",
		"Clean Sheet": "cleanSheets",
		Assists: "totalAssists",
		"Yellow Cards": "yellowCards",
		"Red Cards": "redCards",
		Tackles: "totalTackles",
		Interceptions: "totalInterceptions",
		Shots: "totalShots",
		"Shots on Target": "shotsOnTarget",
		Saves: "totalSaves",
		Fouls: "fouls",
		Offsides: "offsides",
		"Minutes Played": "minutesPlayed",
		Appearances: "matchesPlayed",
		"Tackle Success Rate": "avgTackleSuccessRate",
		"Saves Success Rate": "avgSavesSuccessRate",
		"Goals Conceded": "totalGoalsConceded",
		"Player Rating": "avgRating",
		// Advanced statistics
		xG: "totalXG",
		"Expected Goals": "totalXG",
		"Total Duel Success": "avgDuelSuccess",
		"Duel Success": "avgDuelSuccess",
		"Players beaten by pass": "totalPlayersBeatenByPass",
		"Players Beaten by Pass": "totalPlayersBeatenByPass",
		xA: "totalXA",
		"Expected Assists": "totalXA",
		"Tackles Attempted": "totalTacklesAttempted",
	};

	return statMap[leagueStatTypeName] || null;
}

/**
 * Fetch team statistics from League Republic API
 */
async function fetchTeamStats(teamId, seasonId) {
	try {
		const url = `https://api.leaguerepublic.com/json/getStatisticSummaryForTeam/${seasonId}/${teamId}.json`;
		console.log(
			`📡 Fetching team stats for Team ID: ${teamId}, Season ID: ${seasonId}`
		);

		const response = await axios.get(url, {
			timeout: 15000,
			headers: {
				"User-Agent": "ProClubs Stats Hub/1.0",
			},
		});

		return response.data;
	} catch (error) {
		console.error(`❌ Error fetching team stats for ${teamId}:`, error.message);
		return null;
	}
}

/**
 * Process and import player statistics
 */
async function importPlayerStats(teamStatsData, teamId, seasonId) {
	if (!teamStatsData || !teamStatsData.listCumulativePersonStatSummary) {
		console.log("   ⚠️  No player statistics found in API response");
		return { processed: 0, errors: 0 };
	}

	let processed = 0;
	let errors = 0;

	// Group stats by player
	const playerStatsMap = new Map();

	for (const stat of teamStatsData.listCumulativePersonStatSummary) {
		const personId = stat.personID.toString();

		if (!playerStatsMap.has(personId)) {
			playerStatsMap.set(personId, {
				personId: personId,
				firstName: stat.firstName,
				lastName: stat.lastName,
				stats: {},
			});
		}

		const statField = mapStatType(stat.leagueStatTypeName);
		if (statField) {
			playerStatsMap.get(personId).stats[statField] = {
				value: parseFloat(stat.statTypeValue) || 0,
				numberEntered: parseInt(stat.numberEntered) || 0,
				statTypeId: stat.leagueStatTypeID,
				statTypeName: stat.leagueStatTypeName,
			};
		}
	}

	console.log(`   📊 Found statistics for ${playerStatsMap.size} players`);

	// Find team by SAPL ID (which is the same as teamId in League Republic)
	let team = await prisma.team.findFirst({
		where: { saplId: teamId.toString() },
	});

	if (!team) {
		// Create team with League Republic team ID
		team = await prisma.team.create({
			data: {
				name: `Team ${teamId}`, // You might want to get actual team name from API
				teamId: teamId.toString(),
				saplId: teamId.toString(), // SAPL ID is the same as League Republic team ID
				saplData: { leagueRepublicTeamId: teamId },
			},
		});
		console.log(`   ✅ Created team with League Republic ID: ${teamId}`);
	} else {
		// Update existing team with teamId if not set
		if (!team.teamId) {
			team = await prisma.team.update({
				where: { id: team.id },
				data: { teamId: teamId.toString() },
			});
			console.log(
				`   ✅ Updated team ${team.name} with League Republic ID: ${teamId}`
			);
		}
	}

	// Process each player's stats
	for (const [personId, playerData] of playerStatsMap) {
		try {
			// Find player in our database
			const player = await prisma.player.findFirst({
				where: { saplId: personId },
				include: {
					user: true,
					team: true,
				},
			});

			if (!player) {
				console.log(
					`   ⚠️  Player with Person ID ${personId} not found in database`
				);
				continue;
			}

			// Find or create season
			let season = await prisma.season.findFirst({
				where: {
					OR: [{ name: "Season 29" }, { saplId: "699164189" }],
				},
			});

			if (!season) {
				season = await prisma.season.create({
					data: {
						name: "Season 29",
						startDate: new Date("2024-01-01"),
						endDate: new Date("2024-12-31"),
						saplId: "699164189",
						description: "SAPL Season 29",
					},
				});
				console.log(`   ✅ Created Season 29`);
			}

			// Find or create player season stats record
			let playerSeasonStats = await prisma.playerSeasonStat.findFirst({
				where: {
					playerId: player.id,
					seasonId: season.id,
				},
			});

			if (!playerSeasonStats) {
				playerSeasonStats = await prisma.playerSeasonStat.create({
					data: {
						playerId: player.id,
						seasonId: season.id,
						teamId: team.id, // Use the team we found/created
						// Initialize with zeros using correct field names
						totalGoals: 0,
						totalAssists: 0,
						matchesPlayed: 0,
						yellowCards: 0,
						redCards: 0,
						totalTackles: 0,
						totalInterceptions: 0,
						totalShots: 0,
						totalSaves: 0,
						cleanSheets: 0,
						avgPassAccuracy: 0,
						avgRating: 0,
						totalPasses: 0,
						// New statistics for all positions
						totalPossessionLost: 0,
						totalPossessionWon: 0,
						manOfTheMatchCount: 0,
						avgTackleSuccessRate: 0,
						avgSavesSuccessRate: 0,
						totalGoalsConceded: 0,
						// Advanced statistics
						totalXG: 0,
						avgDuelSuccess: 0,
						totalPlayersBeatenByPass: 0,
						totalXA: 0,
						totalTacklesAttempted: 0,
					},
				});
			}

			// Update player season stats with API data
			const updateData = {};

			// Map each stat field
			for (const [statField, statData] of Object.entries(playerData.stats)) {
				if (statField in playerSeasonStats) {
					updateData[statField] = statData.value;
				}
			}

			if (Object.keys(updateData).length > 0) {
				await prisma.playerSeasonStat.update({
					where: { id: playerSeasonStats.id },
					data: updateData,
				});

				console.log(
					`   ✅ Updated ${player.firstName} ${player.lastName} (${personId}) stats:`,
					Object.keys(updateData).join(", ")
				);
				processed++;
			}
		} catch (error) {
			console.error(
				`   ❌ Error processing player ${personId}:`,
				error.message
			);
			errors++;
		}
	}

	return { processed, errors };
}

/**
 * Process multiple teams for Season 29
 */
async function processSeason29TeamStats() {
	console.log("🏆 Starting Season 29 team statistics import...");

	// All SAPL team IDs for Season 29
	const season29Teams = [
		{ teamId: 338997492, seasonId: 699164189 }, // Hogwors FC
		{ teamId: 149170449, seasonId: 699164189 }, // Izanami FC
		{ teamId: 372707907, seasonId: 699164189 }, // Ke Nyovi FC
		{ teamId: 331804394, seasonId: 699164189 }, // Loco Life Gaming
		{ teamId: 703580060, seasonId: 699164189 }, // No Chance CF
		{ teamId: 875727317, seasonId: 699164189 }, // RB Redz
		{ teamId: 492513781, seasonId: 699164189 }, // Red Knights
		{ teamId: 276704033, seasonId: 699164189 }, // SCL ESports
		{ teamId: 202458870, seasonId: 699164189 }, // Southpros FC
		{ teamId: 821545474, seasonId: 699164189 }, // TMT FC
		{ teamId: 890809899, seasonId: 699164189 }, // Trillmatic X
		{ teamId: 117169757, seasonId: 699164189 }, // Uganda Cranes
		{ teamId: 758953010, seasonId: 699164189 }, // Unleashed FC
		{ teamId: 930906289, seasonId: 699164189 }, // Zamalek FCC
		{ teamId: 426244402, seasonId: 699164189 }, // 265 Flames
		{ teamId: 41848088, seasonId: 699164189 }, // CLAAT FC
		{ teamId: 437566869, seasonId: 699164189 }, // Crusaders FC
		{ teamId: 737194923, seasonId: 699164189 }, // Evolution Lords
		{ teamId: 611789750, seasonId: 699164189 }, // Jabronies FC
		{ teamId: 520726765, seasonId: 699164189 }, // Kampala Esports
		{ teamId: 396634828, seasonId: 699164189 }, // Legendz Dynasty
		{ teamId: 477233544, seasonId: 699164189 }, // MetaZero FC
		{ teamId: 762476314, seasonId: 699164189 }, // No Chill Boysh
		{ teamId: 747954437, seasonId: 699164189 }, // Peacemakers FC
		{ teamId: 762942717, seasonId: 699164189 }, // Phoenix United
		{ teamId: 882974096, seasonId: 699164189 }, // Resiliencia FC
		{ teamId: 593538240, seasonId: 699164189 }, // Retired CF
		{ teamId: 239601830, seasonId: 699164189 }, // Santos Esports
		{ teamId: 358505468, seasonId: 699164189 }, // SEV7EN Stars
		{ teamId: 378393639, seasonId: 699164189 }, // Sintonia
		{ teamId: 766387969, seasonId: 699164189 }, // Tanzania 11
		{ teamId: 382831533, seasonId: 699164189 }, // The Saudis Clan
		{ teamId: 40803524, seasonId: 699164189 }, // X Football Club
		{ teamId: 48182361, seasonId: 699164189 }, // 2Goals1Cup FC
		{ teamId: 798983385, seasonId: 699164189 }, // Arkiteks CF
		{ teamId: 922556273, seasonId: 699164189 }, // Dont Press FC
		{ teamId: 196625556, seasonId: 699164189 }, // Edge Lords
		{ teamId: 625605525, seasonId: 699164189 }, // FC Synergy
		{ teamId: 281726142, seasonId: 699164189 }, // FC Unstoppable
		{ teamId: 253899174, seasonId: 699164189 }, // Gumanji Heights
		{ teamId: 325125328, seasonId: 699164189 }, // Iscathulo Sika Madam
		{ teamId: 63446572, seasonId: 699164189 }, // Laaste Honne FC
		{ teamId: 866879352, seasonId: 699164189 }, // Mkhonto
		{ teamId: 170238604, seasonId: 699164189 }, // Ballerz FC
		{ teamId: 698260312, seasonId: 699164189 }, // Bateleur FA
		{ teamId: 41771149, seasonId: 699164189 }, // Cyber
		{ teamId: 312245654, seasonId: 699164189 }, // Elite CPT
		{ teamId: 868812723, seasonId: 699164189 }, // Executive FC
		{ teamId: 518076506, seasonId: 699164189 }, // Team Revival FC
		{ teamId: 504354520, seasonId: 699164189 }, // The Herbalists
		{ teamId: 498051148, seasonId: 699164189 }, // Wakanda FC
		{ teamId: 405783149, seasonId: 699164189 }, // Zebras
		{ teamId: 935117852, seasonId: 699164189 }, // 11 Gents FC
		{ teamId: 677636088, seasonId: 699164189 }, // 258 FC
		{ teamId: 633409736, seasonId: 699164189 }, // Animals FC
		{ teamId: 542052791, seasonId: 699164189 }, // Apex XI
		{ teamId: 944679723, seasonId: 699164189 }, // Azzurri Esports
		{ teamId: 755770133, seasonId: 699164189 }, // Cape2Jozi FC
		{ teamId: 960193292, seasonId: 699164189 }, // Chicken Dinner eFC
		{ teamId: 475875472, seasonId: 699164189 }, // Festive AS
		{ teamId: 290047246, seasonId: 699164189 }, // Maftown FC
		{ teamId: 371709850, seasonId: 699164189 }, // No Focus Army
		{ teamId: 975596138, seasonId: 699164189 }, // Possibility RFC
		{ teamId: 553137151, seasonId: 699164189 }, // Sanguine Rebels
		{ teamId: 878719667, seasonId: 699164189 }, // SAPL Spinalcord
		{ teamId: 376236761, seasonId: 699164189 }, // STK FC
		{ teamId: 342994734, seasonId: 699164189 }, // Supreme Gaming
		{ teamId: 182437780, seasonId: 699164189 }, // Treacherous CF
		{ teamId: 68304387, seasonId: 699164189 }, // Ultimate 11
		{ teamId: 32418299, seasonId: 699164189 }, // Unwanted
		{ teamId: 973830890, seasonId: 699164189 }, // WulffGang FC
		{ teamId: 95169903, seasonId: 699164189 }, // AmaRoto FC
		{ teamId: 550749035, seasonId: 699164189 }, // Favela All-Stars
		{ teamId: 543748546, seasonId: 699164189 }, // Jotunheim FC
		{ teamId: 823849835, seasonId: 699164189 }, // Missanga Na Cintura Fc
		{ teamId: 593627104, seasonId: 699164189 }, // No Hart Feeling
		{ teamId: 923826019, seasonId: 699164189 }, // No Sele
		{ teamId: 929406211, seasonId: 699164189 }, // Reaper FC
		{ teamId: 572531735, seasonId: 699164189 }, // SAPL Legends
		{ teamId: 666883281, seasonId: 699164189 }, // The Ladz
		{ teamId: 46201207, seasonId: 699164189 }, // YExWEST
		{ teamId: 585960730, seasonId: 699164189 }, // 051 Siwelele
		{ teamId: 164012199, seasonId: 699164189 }, // 24 Hours
		{ teamId: 203178755, seasonId: 699164189 }, // Betway FC
		{ teamId: 718990531, seasonId: 699164189 }, // Brotherhood FC
		{ teamId: 730638205, seasonId: 699164189 }, // Bruno GimmeRice
		{ teamId: 12089175, seasonId: 699164189 }, // Chillie Peppers
		{ teamId: 54847498, seasonId: 699164189 }, // DOGSO FC
		{ teamId: 761316605, seasonId: 699164189 }, // Draco FC
		{ teamId: 57893545, seasonId: 699164189 }, // El Fuego 647
		{ teamId: 742488648, seasonId: 699164189 }, // Elite 11 FC
		{ teamId: 631939458, seasonId: 699164189 }, // Netboys 4 Life
		{ teamId: 913803382, seasonId: 699164189 }, // Outkasted
		{ teamId: 531743507, seasonId: 699164189 }, // Ploeberg Ballerz
		{ teamId: 684425074, seasonId: 699164189 }, // REVIVE FC
		{ teamId: 737849657, seasonId: 699164189 }, // Sotra CF
		{ teamId: 771135918, seasonId: 699164189 }, // SIRENS AFC
		{ teamId: 402714481, seasonId: 699164189 }, // Street XI
		{ teamId: 860336993, seasonId: 699164189 }, // Symbiote Legend
		{ teamId: 25010211, seasonId: 699164189 }, // The Sparta FC
		{ teamId: 285728491, seasonId: 699164189 }, // V3D Utd
		{ teamId: 932757816, seasonId: 699164189 }, // AI Knights FC
		{ teamId: 642752203, seasonId: 699164189 }, // BHASOBHA FC
		{ teamId: 227290914, seasonId: 699164189 }, // FC ONE LOVE
		{ teamId: 191083101, seasonId: 699164189 }, // Gimbo Stars
		{ teamId: 79722865, seasonId: 699164189 }, // Gta Allstars
		{ teamId: 31000387, seasonId: 699164189 }, // IZINJA ZEGAME
		{ teamId: 628525181, seasonId: 699164189 }, // KZN Boys
		{ teamId: 894976586, seasonId: 699164189 }, // Mash and Gravy
		{ teamId: 736943624, seasonId: 699164189 }, // Perfection CF
		{ teamId: 861315877, seasonId: 699164189 }, // Universals FC
		{ teamId: 251565325, seasonId: 699164189 }, // Baby Shark CF
		{ teamId: 567924680, seasonId: 699164189 }, // Storm Trooperz
		{ teamId: 393372459, seasonId: 699164189 }, // Mythe Et Caviar
		{ teamId: 67105674, seasonId: 699164189 }, // Press With Caution
		{ teamId: 820279441, seasonId: 699164189 }, // Gugulethu FC
		{ teamId: 137435247, seasonId: 699164189 }, // Marist Cartel FC
		{ teamId: 2365741, seasonId: 699164189 }, // One Punch XI
		{ teamId: 202539514, seasonId: 699164189 }, // PICK N PLAY FC
		{ teamId: 69031586, seasonId: 699164189 }, // Scottsville FC
		{ teamId: 699164189, seasonId: 699164189 }, // Team 699164189 (already processed)
	];

	let totalProcessed = 0;
	let totalErrors = 0;

	for (const team of season29Teams) {
		try {
			console.log(`\n📊 Processing team: ${team.teamId}`);

			// Fetch team statistics
			const teamStatsData = await fetchTeamStats(team.teamId, team.seasonId);
			if (!teamStatsData) {
				console.log(`   ⚠️  No data available for team ${team.teamId}`);
				continue;
			}

			// Import player statistics
			const results = await importPlayerStats(
				teamStatsData,
				team.teamId,
				team.seasonId
			);
			totalProcessed += results.processed;
			totalErrors += results.errors;

			// Add delay to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 2000));
		} catch (error) {
			console.error(`❌ Error processing team ${team.teamId}:`, error.message);
			totalErrors++;
		}
	}

	console.log(`\n🎉 Season 29 statistics import completed!`);
	console.log(`📈 Results:`);
	console.log(`   - Players processed: ${totalProcessed}`);
	console.log(`   - Errors: ${totalErrors}`);

	return { totalProcessed, totalErrors };
}

/**
 * Get team statistics for a specific player
 */
async function getPlayerSeasonStats(playerId, seasonName = "Season 29") {
	try {
		const player = await prisma.player.findUnique({
			where: { id: playerId },
			include: {
				user: true,
				team: true,
			},
		});

		if (!player) {
			throw new Error("Player not found");
		}

		const season = await prisma.season.findFirst({
			where: { name: seasonName },
		});

		if (!season) {
			throw new Error("Season not found");
		}

		const playerSeasonStats = await prisma.playerSeasonStat.findFirst({
			where: {
				playerId: player.id,
				seasonId: season.id,
			},
		});

		return {
			player: {
				id: player.id,
				name: `${player.firstName} ${player.lastName}`,
				team: player.team?.name,
				position: player.position,
			},
			season: season.name,
			stats: playerSeasonStats || {},
		};
	} catch (error) {
		console.error("Error fetching player season stats:", error);
		throw error;
	}
}

async function main() {
	try {
		await processSeason29TeamStats();
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

module.exports = {
	processSeason29TeamStats,
	fetchTeamStats,
	importPlayerStats,
	getPlayerSeasonStats,
};
