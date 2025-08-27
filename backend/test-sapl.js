const axios = require("axios");

async function testSaplIntegration() {
	console.log("🧪 Testing SAPL Integration...\n");

	try {
		// Test 1: Health check
		console.log("1️⃣ Testing server health...");
		const healthResponse = await axios.get("http://localhost:3000/health");
		console.log("✅ Server is healthy:", healthResponse.data.status);

		// Test 2: SAPL connection test
		console.log("\n2️⃣ Testing SAPL API connection...");
		const saplResponse = await axios.get(
			"http://localhost:3000/api/sapl/test-connection"
		);
		console.log("✅ SAPL connection:", saplResponse.data.data.message);

		console.log("\n🎉 SAPL Integration is working!");
		console.log("\n📋 Next steps:");
		console.log("   1. Use the frontend to test the full integration");
		console.log("   2. Try importing Season 28 data");
		console.log("   3. Check the database for imported data");
	} catch (error) {
		console.error("❌ Test failed:", error.message);
		if (error.response) {
			console.error("   Status:", error.response.status);
			console.error("   Data:", error.response.data);
		}
	}
}

// Run the test
testSaplIntegration().catch(console.error);
