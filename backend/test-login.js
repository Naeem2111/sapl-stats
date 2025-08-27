const axios = require("axios");

async function testLogin() {
	try {
		console.log("Testing login endpoint...");

		const response = await axios.post("http://localhost:3000/api/auth/login", {
			email: "team_admin_1@proclubs.com",
			password: "team123",
		});

		console.log("✅ Login successful!");
		console.log("Response:", response.data);
		console.log("Token:", response.data.data.token);
	} catch (error) {
		console.error("❌ Login failed:");
		if (error.response) {
			console.error("Status:", error.response.status);
			console.error("Data:", error.response.data);
		} else {
			console.error("Error:", error.message);
		}
	}
}

testLogin();
