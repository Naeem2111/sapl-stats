const saplService = require("./src/services/saplService");

async function testSAPLConnection() {
	console.log("🔍 Testing SAPL connection and getting available seasons...");

	try {
		// Test connection
		console.log("\n1️⃣ Testing SAPL API connection...");
		const connectionTest = await saplService.testConnection();
		console.log("Connection result:", JSON.stringify(connectionTest, null, 2));

		if (connectionTest.connected) {
			// Get available seasons
			console.log("\n2️⃣ Getting available seasons...");
			const seasons = await saplService.getSeasonsForLeague();
			console.log("Available seasons:", JSON.stringify(seasons, null, 2));

			// Look for Season 29
			const season29 = seasons.find(
				(s) =>
					(s.name && s.name.toLowerCase().includes("season 29")) ||
					(s.description &&
						s.description.toLowerCase().includes("season 29")) ||
					(s.id && s.id.toString().includes("29"))
			);

			if (season29) {
				console.log("\n✅ Found Season 29:", JSON.stringify(season29, null, 2));
			} else {
				console.log("\n❌ Season 29 not found in available seasons");
				console.log(
					"Available season names:",
					seasons.map((s) => s.name || s.description || s.id)
				);
			}
		}
	} catch (error) {
		console.error("❌ Error testing SAPL connection:", error.message);
	}
}

testSAPLConnection()
	.then(() => {
		console.log("\n✅ SAPL connection test completed");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ SAPL connection test failed:", error);
		process.exit(1);
	});
