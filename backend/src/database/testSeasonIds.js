const axios = require("axios");

/**
 * Test different season IDs to find the correct one for Season 29
 */
async function testSeasonIds() {
	const teamId = 699164189; // We know this team has data
	const possibleSeasonIds = [
		935117852, // Current season ID we're using
		935117851, // Previous season
		935117853, // Next season
		935117850, // Earlier season
		935117854, // Later season
		2024, // Year-based
		2023, // Previous year
		29, // Season number
		28, // Previous season number
		30, // Next season number
	];

	console.log(`🔍 Testing season IDs for team ${teamId}...\n`);

	for (const seasonId of possibleSeasonIds) {
		try {
			const url = `https://api.leaguerepublic.com/json/getStatisticSummaryForTeam/${teamId}/${seasonId}.json`;
			console.log(`📡 Testing Season ID: ${seasonId}`);

			const response = await axios.get(url, {
				timeout: 10000,
				headers: {
					"User-Agent": "ProClubs Stats Hub/1.0",
				},
			});

			if (response.data && response.data.listCumulativePersonStatSummary) {
				const playerCount =
					response.data.listCumulativePersonStatSummary.length;
				console.log(`   ✅ Found ${playerCount} player statistics`);

				// Show first few players as sample
				const samplePlayers =
					response.data.listCumulativePersonStatSummary.slice(0, 3);
				samplePlayers.forEach((player) => {
					console.log(
						`   📊 ${player.firstName} ${player.lastName} (${player.personID})`
					);
				});
			} else {
				console.log(`   ⚠️  No player statistics found`);
			}
		} catch (error) {
			console.log(`   ❌ Error: ${error.message}`);
		}

		console.log(""); // Empty line for readability

		// Add delay to avoid rate limiting
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}
}

testSeasonIds().catch(console.error);
