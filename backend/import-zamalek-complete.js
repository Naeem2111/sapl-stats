const { PrismaClient } = require("@prisma/client");
const XLSX = require("xlsx");
const path = require("path");

const prisma = new PrismaClient();

/**
 * Complete Zamalek matches and player stats import from Excel file
 * Processes all player stats for all matches from STATS REF sheet
 */
async function importZamalekComplete() {
	console.log("🚀 Starting complete Zamalek import from Excel...");

	try {
		// Read the Excel file
		const excelPath = path.join(__dirname, "..", "sapl.xlsx");
		console.log(`📁 Reading Excel file: ${excelPath}`);

		const workbook = XLSX.readFile(excelPath);
		console.log(
			`📊 Found ${workbook.SheetNames.length} sheets:`,
			workbook.SheetNames
		);

		// Create or get the season
		const season = await createOrGetSeason();
		console.log(`📅 Using season: ${season.name}`);

		// Create or get the league
		const league = await createOrGetLeague();
		console.log(`🏆 Using league: ${league.name}`);

		// Create or get Zamalek team
		const zamalekTeam = await createOrGetTeam("Zamalek FCC");
		console.log(`⚽ Using team: ${zamalekTeam.name}`);

		// Process RESULTS sheet to create matches
		console.log("\n📋 Processing RESULTS sheet...");
		const resultsData = XLSX.utils.sheet_to_json(workbook.Sheets["RESULTS"], {
			header: 1,
		});
		const matches = await processResultsSheet(
			resultsData,
			season,
			league,
			zamalekTeam
		);
		console.log(`✅ Created ${matches.length} matches`);

		// Process STATS REF sheet to create ALL player match stats
		console.log("\n📋 Processing STATS REF sheet for all player stats...");
		const statsData = XLSX.utils.sheet_to_json(workbook.Sheets["STATS REF"], {
			header: 1,
		});
		const playerStats = await processAllPlayerStats(
			statsData,
			matches,
			zamalekTeam
		);
		console.log(`✅ Created ${playerStats.length} player match stats`);

		console.log("\n🎉 Complete Zamalek import completed successfully!");

		// Summary
		console.log("\n📊 Import Summary:");
		console.log(`   - Matches: ${matches.length}`);
		console.log(`   - Player Match Stats: ${playerStats.length}`);
		console.log(
			`   - Unique Players: ${new Set(playerStats.map((p) => p.playerId)).size}`
		);
	} catch (error) {
		console.error("❌ Error importing Zamalek data:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

/**
 * Create or get the season
 */
async function createOrGetSeason() {
	const seasonName = "SAPL Season 29";

	let season = await prisma.season.findFirst({
		where: { name: seasonName },
	});

	if (!season) {
		season = await prisma.season.create({
			data: {
				name: seasonName,
				startDate: new Date("2024-01-01"),
				endDate: new Date("2024-12-31"),
				isActive: true,
			},
		});
		console.log(`✅ Created season: ${season.name}`);
	} else {
		console.log(`✅ Found existing season: ${season.name}`);
	}

	return season;
}

/**
 * Create or get the league
 */
async function createOrGetLeague() {
	const leagueName = "Super League Premiership";

	let league = await prisma.league.findFirst({
		where: { name: leagueName },
	});

	if (!league) {
		league = await prisma.league.create({
			data: {
				name: leagueName,
				description: "SAPL Super League Premiership",
				isActive: true,
			},
		});
		console.log(`✅ Created league: ${league.name}`);
	} else {
		console.log(`✅ Found existing league: ${league.name}`);
	}

	return league;
}

/**
 * Create or get the team
 */
async function createOrGetTeam(teamName) {
	let team = await prisma.team.findFirst({
		where: { name: teamName },
	});

	if (!team) {
		team = await prisma.team.create({
			data: {
				name: teamName,
				saplId: teamName.replace(/\s+/g, "_").toLowerCase(),
			},
		});
		console.log(`✅ Created team: ${team.name}`);
	} else {
		console.log(`✅ Found existing team: ${team.name}`);
	}

	return team;
}

/**
 * Process RESULTS sheet to create matches
 */
async function processResultsSheet(data, season, league, zamalekTeam) {
	const matches = [];
	const matchMap = new Map(); // To avoid duplicates

	// Skip header row
	for (let i = 1; i < data.length; i++) {
		const row = data[i];
		if (!row || row.length < 5) continue;

		const [md, opponent, zamalekGoals, opponentGoals, result] = row;

		if (
			!md ||
			!opponent ||
			zamalekGoals === undefined ||
			opponentGoals === undefined
		) {
			continue;
		}

		// Create unique key for match
		const matchKey = `${md}-${opponent}`;
		if (matchMap.has(matchKey)) {
			continue; // Skip duplicate
		}
		matchMap.set(matchKey, true);

		// Create or get opponent team
		const opponentTeam = await createOrGetTeam(opponent);

		// Check if match already exists
		const existingMatch = await prisma.match.findFirst({
			where: {
				seasonId: season.id,
				leagueId: league.id,
				homeTeamId: zamalekTeam.id,
				awayTeamId: opponentTeam.id,
				date: new Date(`2024-01-${String(md).padStart(2, "0")}T20:00:00Z`),
			},
		});

		if (existingMatch) {
			matches.push(existingMatch);
			console.log(
				`✅ Found existing match: ${zamalekTeam.name} ${zamalekGoals}-${opponentGoals} ${opponent}`
			);
			continue;
		}

		// Create match
		const match = await prisma.match.create({
			data: {
				seasonId: season.id,
				leagueId: league.id,
				homeTeamId: zamalekTeam.id,
				awayTeamId: opponentTeam.id,
				date: new Date(`2024-01-${String(md).padStart(2, "0")}T20:00:00Z`),
				homeScore: parseInt(zamalekGoals) || 0,
				awayScore: parseInt(opponentGoals) || 0,
				competitionType: "LEAGUE",
				status: "COMPLETED",
			},
		});

		matches.push(match);
		console.log(
			`✅ Created match: ${zamalekTeam.name} ${zamalekGoals}-${opponentGoals} ${opponent}`
		);
	}

	return matches;
}

/**
 * Process ALL player stats from STATS REF sheet
 * This processes every player for every match
 */
async function processAllPlayerStats(data, matches, zamalekTeam) {
	const playerStats = [];
	const processedStats = new Set(); // To avoid duplicates

	// Create a map of matches by matchday for quick lookup
	const matchMap = new Map();
	matches.forEach((match) => {
		// Extract matchday from date (assuming it's in the format 2024-01-XX)
		const matchday = parseInt(
			match.date.toISOString().split("T")[0].split("-")[2]
		);
		matchMap.set(matchday, match);
	});

	console.log(`📊 Processing ${data.length} rows from STATS REF sheet...`);

	// Process all rows sequentially - the first 11 rows contain all match data
	// Skip header row (row 1), so start from row 2
	for (let i = 1; i < data.length; i++) {
		const row = data[i];
		if (!row || row.length < 10) continue;

		// Extract all columns from the row (match column is empty but still present)
		const [
			md,
			home,
			away,
			homeGoals,
			awayGoals,
			emptyMatch, // Empty match column
			position,
			name,
			league,
			club,
			gamesPlayed,
			avgRating,
			passPct,
			playersBeatenByPass,
			savePct,
			tacklesAttempted,
			tacklePct,
			totalDuelSuccess,
			possessionLost,
			possessionWon,
			goals,
			nonPenaltyGoals,
			xG,
			assists,
			xA,
			cleanSheet,
			savesGK,
			saveSuccessPct,
			goalsConceded,
		] = row;

		// Skip invalid rows
		if (!md || !name || !position || md === "MD" || typeof md !== "number") {
			continue;
		}

		// Create unique key for player match stat
		const statKey = `${md}-${name}-${position}`;
		if (processedStats.has(statKey)) {
			continue; // Skip duplicate
		}
		processedStats.add(statKey);

		// Find the match for this MD
		const matchForMD = matchMap.get(md);
		if (!matchForMD) {
			console.log(`⚠️ No match found for MD ${md}, skipping player ${name}`);
			continue;
		}

		// Create or get player
		const player = await createOrGetPlayer(name, position, zamalekTeam);

		// Check if player match stats already exist
		const existingStats = await prisma.playerMatchStat.findFirst({
			where: {
				matchId: matchForMD.id,
				playerId: player.id,
			},
		});

		if (existingStats) {
			console.log(
				`✅ Found existing stats for ${name} (${position}) in match ${md}`
			);
			continue;
		}

		// Create player match stats
		const playerMatchStat = await prisma.playerMatchStat.create({
			data: {
				matchId: matchForMD.id,
				playerId: player.id,
				teamId: zamalekTeam.id,
				goals: parseInt(goals) || 0,
				assists: parseInt(assists) || 0,
				shots: 0, // Not available in this data
				passes: 0, // Not available in this data
				passAccuracy: parseFloat(passPct) || 0,
				tackles: parseInt(tacklesAttempted) || 0,
				interceptions: 0, // Not available in this data
				saves: parseInt(savesGK) || 0,
				cleanSheet: cleanSheet === 1 || cleanSheet === true,
				rating: parseFloat(avgRating) || 0,
				minutesPlayed: 90, // Assume full match
				yellowCards: 0, // Not available in this data
				redCards: 0, // Not available in this data
				possessionLost: parseInt(possessionLost) || 0,
				possessionWon: parseInt(possessionWon) || 0,
				tackleSuccessRate: parseFloat(tacklePct) || 0,
				savesSuccessRate: parseFloat(saveSuccessPct) || 0,
				goalsConceded: parseInt(goalsConceded) || 0,
				xG: parseFloat(xG) || 0,
				totalDuelSuccess: parseFloat(totalDuelSuccess) || 0,
				playersBeatenByPass: parseInt(playersBeatenByPass) || 0,
				xA: parseFloat(xA) || 0,
				tacklesAttempted: parseInt(tacklesAttempted) || 0,
			},
		});

		playerStats.push(playerMatchStat);
		console.log(`✅ Created stats for ${name} (${position}) in match ${md}`);
	}

	return playerStats;
}

/**
 * Create or get player
 */
async function createOrGetPlayer(name, position, team) {
	// Map position to enum
	const positionMap = {
		GK: "GK",
		CB: "CB",
		LB: "LB",
		RB: "RB",
		CDM: "CDM",
		CM: "CM",
		CAM: "CAM",
		LM: "LM",
		RM: "RM",
		LW: "LW",
		RW: "RW",
		ST: "ST",
		CF: "CF",
	};

	const mappedPosition = positionMap[position] || "UNKNOWN";

	let player = await prisma.player.findFirst({
		where: {
			gamertag: name,
			teamId: team.id,
		},
	});

	if (!player) {
		// Check if user already exists
		let user = await prisma.user.findFirst({
			where: {
				username: name.toLowerCase().replace(/\s+/g, "_"),
			},
		});

		if (!user) {
			// Create user first
			user = await prisma.user.create({
				data: {
					username: name.toLowerCase().replace(/\s+/g, "_"),
					email: `${name.toLowerCase().replace(/\s+/g, "_")}@zamalek.local`,
					passwordHash: require("bcryptjs").hashSync("Zamalek2024!", 10),
					role: "PLAYER",
				},
			});
			console.log(`✅ Created user: ${user.username}`);
		} else {
			console.log(`✅ Found existing user: ${user.username}`);
		}

		player = await prisma.player.create({
			data: {
				gamertag: name,
				realName: name,
				firstName: name.split(" ")[0],
				lastName: name.split(" ").slice(1).join(" "),
				position: mappedPosition,
				userId: user.id,
				teamId: team.id,
			},
		});
		console.log(`✅ Created player: ${name} (${mappedPosition})`);
	} else {
		console.log(`✅ Found existing player: ${name}`);
	}

	return player;
}

// Run the import
importZamalekComplete()
	.then(() => {
		console.log("✅ Complete Zamalek import completed");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Complete Zamalek import failed:", error);
		process.exit(1);
	});
