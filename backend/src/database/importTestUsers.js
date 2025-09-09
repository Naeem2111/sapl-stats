const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

/**
 * Import Test Users from CSV Files
 *
 * This script imports users from three CSV files:
 * 1. PERSON_1166.csv - Players (1800+ records)
 * 2. PERSON_90339.csv - League Administrators (18 records)
 * 3. PERSON_91599.csv - Team Administrators (210 records)
 */

function parseCSV(csvContent) {
	const lines = csvContent.split("\n");
	const headers = lines[0].split(",").map((h) => h.trim());
	const data = [];

	for (let i = 1; i < lines.length; i++) {
		if (lines[i].trim() === "") continue;

		// Handle commas within quoted fields
		const values = [];
		let current = "";
		let inQuotes = false;

		for (let j = 0; j < lines[i].length; j++) {
			const char = lines[i][j];

			if (char === '"') {
				inQuotes = !inQuotes;
			} else if (char === "," && !inQuotes) {
				values.push(current.trim());
				current = "";
			} else {
				current += char;
			}
		}
		values.push(current.trim()); // Add the last value

		const row = {};
		headers.forEach((header, index) => {
			row[header] = values[index] || "";
		});

		data.push(row);
	}

	return data;
}

function mapRoleToUserRole(role) {
	switch (role) {
		case "League Administrator":
			return "LEAGUE_ADMIN";
		case "Team Administrator":
			return "TEAM_ADMIN";
		case "Player":
		default:
			return "PLAYER";
	}
}

async function generateUsername(
	prisma,
	email,
	firstName,
	lastName,
	gamertag,
	phoneNumber
) {
	let baseUsername = "";

	// Try to use gamertag first, then email username, then first+last name, then phone number
	if (gamertag && gamertag.trim() !== "") {
		baseUsername = gamertag.trim().replace(/\s+/g, "_");
	} else if (email && email.includes("@")) {
		baseUsername = email.split("@")[0];
	} else if (firstName && lastName) {
		baseUsername =
			`${firstName.toLowerCase()}${lastName.toLowerCase()}`.replace(/\s+/g, "");
	} else if (phoneNumber && phoneNumber.trim() !== "") {
		// Use last 4 digits of phone number
		const cleanPhone = phoneNumber.replace(/\D/g, "");
		baseUsername = `user_${cleanPhone.slice(-4)}`;
	} else {
		baseUsername = `user_${Math.random().toString(36).substr(2, 8)}`;
	}

	// Check if username exists and add suffix if needed
	let username = baseUsername;
	let counter = 1;

	while (true) {
		const existingUser = await prisma.user.findUnique({
			where: { username: username },
		});

		if (!existingUser) {
			break;
		}

		username = `${baseUsername}_${counter}`;
		counter++;

		// Prevent infinite loop
		if (counter > 100) {
			username = `user_${Math.random().toString(36).substr(2, 8)}`;
			break;
		}
	}

	return username;
}

function generatePassword() {
	return Math.random().toString(36).substr(2, 12);
}

async function importUsersFromCSV(csvPath, role) {
	console.log(`📁 Reading ${role} data from ${path.basename(csvPath)}...`);

	if (!fs.existsSync(csvPath)) {
		console.log(`⚠️  File not found: ${csvPath}`);
		return { imported: 0, skipped: 0, errors: 0 };
	}

	const csvContent = fs.readFileSync(csvPath, "utf8");
	const data = parseCSV(csvContent);

	console.log(`📊 Found ${data.length} ${role} records`);

	let imported = 0;
	let skipped = 0;
	let errors = 0;

	for (const row of data) {
		try {
			// Get phone number (prefer mobile, fallback to home phone)
			const phoneNumber = (
				row["Mobile Phone"] ||
				row["Home Phone"] ||
				""
			).trim();

			// Skip if no phone number or invalid data
			if (!phoneNumber || phoneNumber === "" || row["Status"] !== "Active") {
				skipped++;
				continue;
			}

			const email = row["Email Addr"] ? row["Email Addr"].trim() : "";
			const firstName = row["First Name"] || "";
			const lastName = row["Last Name"] || "";
			const gamertag = row["User Name"] || "";
			const saplId = row["Person ID"] || "";

			// Check if user already exists by phone number in player data
			const existingPlayer = await prisma.player.findFirst({
				where: {
					phone: phoneNumber,
				},
			});

			if (existingPlayer) {
				skipped++;
				continue;
			}

			// Generate username and password
			const username = await generateUsername(
				prisma,
				email,
				firstName,
				lastName,
				gamertag,
				phoneNumber
			);
			const password = generatePassword();
			const passwordHash = await bcrypt.hash(password, 12);

			// Generate email if not provided (required by schema)
			const userEmail =
				email && email.trim() !== ""
					? email
					: `${username}_${Math.random()
							.toString(36)
							.substr(2, 6)}@proclubs.local`;

			// Create user
			const user = await prisma.user.create({
				data: {
					username: username,
					email: userEmail,
					passwordHash: passwordHash,
					role: mapRoleToUserRole(role),
					saplId: saplId,
				},
			});

			// Create player record if it's a player
			if (role === "Player" && user.id) {
				// Parse date strings to DateTime objects
				const parseDate = (dateStr) => {
					if (!dateStr || dateStr === "" || dateStr === "Invalid Date")
						return null;
					try {
						const date = new Date(dateStr);
						// Check if the date is valid
						if (isNaN(date.getTime())) {
							return null;
						}
						return date;
					} catch (error) {
						return null;
					}
				};

				await prisma.player.create({
					data: {
						gamertag: gamertag || username,
						realName: `${firstName} ${lastName}`.trim(),
						firstName: firstName,
						lastName: lastName,
						position: "UNKNOWN",
						userId: user.id,
						saplId: saplId,
						teams: row["Teams"] || null,
						activeFrom: parseDate(row["Active From"]),
						activeTo: parseDate(row["Active To"]),
						phone: phoneNumber,
						status: row["Status"] || null,
						internalRef1: row["Internal Ref 1"] || null,
						internalRef2: row["Internal Ref 2"] || null,
					},
				});
			}

			imported++;

			// Log every 100 imports
			if (imported % 100 === 0) {
				console.log(`✅ Imported ${imported} ${role}s...`);
			}
		} catch (error) {
			console.error(`❌ Error importing ${role}:`, error.message);
			errors++;
		}
	}

	return { imported, skipped, errors };
}

async function main() {
	console.log("🚀 Starting test user import from CSV files...");

	try {
		// Define CSV file paths
		const csvDir = path.join(__dirname, "..", "services");
		const playersCSV = path.join(csvDir, "PERSON_1166.csv");
		const leagueAdminsCSV = path.join(
			__dirname,
			"..",
			"..",
			"..",
			"PERSON_90339.csv"
		);
		const teamAdminsCSV = path.join(
			__dirname,
			"..",
			"..",
			"..",
			"PERSON_91599.csv"
		);

		// Import players
		console.log("\n👥 Importing Players...");
		const playersResult = await importUsersFromCSV(playersCSV, "Player");

		// Import league administrators
		console.log("\n👨‍💼 Importing League Administrators...");
		const leagueAdminsResult = await importUsersFromCSV(
			leagueAdminsCSV,
			"League Administrator"
		);

		// Import team administrators
		console.log("\n👨‍💼 Importing Team Administrators...");
		const teamAdminsResult = await importUsersFromCSV(
			teamAdminsCSV,
			"Team Administrator"
		);

		// Summary
		console.log("\n📊 Import Summary:");
		console.log(
			`✅ Players: ${playersResult.imported} imported, ${playersResult.skipped} skipped, ${playersResult.errors} errors`
		);
		console.log(
			`✅ League Admins: ${leagueAdminsResult.imported} imported, ${leagueAdminsResult.skipped} skipped, ${leagueAdminsResult.errors} errors`
		);
		console.log(
			`✅ Team Admins: ${teamAdminsResult.imported} imported, ${teamAdminsResult.skipped} skipped, ${teamAdminsResult.errors} errors`
		);

		const totalImported =
			playersResult.imported +
			leagueAdminsResult.imported +
			teamAdminsResult.imported;
		const totalSkipped =
			playersResult.skipped +
			leagueAdminsResult.skipped +
			teamAdminsResult.skipped;
		const totalErrors =
			playersResult.errors +
			leagueAdminsResult.errors +
			teamAdminsResult.errors;

		console.log(
			`\n🎉 Total: ${totalImported} users imported, ${totalSkipped} skipped, ${totalErrors} errors`
		);

		if (totalImported > 0) {
			console.log(
				"\n🔑 Default passwords were generated for all imported users."
			);
			console.log(
				"📱 Users are identified by their phone numbers as the primary identifier."
			);
			console.log(
				"📧 Email addresses are optional and may not be available for all users."
			);
			console.log("💡 Consider implementing a password reset functionality.");
		}
	} catch (error) {
		console.error("❌ Error during import:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

main()
	.then(() => {
		console.log("✅ Test user import completed");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Test user import failed:", error);
		process.exit(1);
	});
