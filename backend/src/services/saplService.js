const axios = require("axios");

class SAPLService {
	constructor() {
		// LeagueRepublic API configuration for SAPL
		this.baseUrl = "https://api.leaguerepublic.com/json";
		this.leagueId = "10727087"; // SAPL League ID
		this.season28Id = "825650177"; // Season 28 ID from the collection
		this.timeout = 15000; // 15 seconds

		// Demo mode flag - set to false to use real SAPL API data
		this.demoMode = false;

		// Rate limiting configuration
		this.rateLimitDelay = 1000; // 1 second between requests
		this.maxRetries = 3;
		this.retryDelay = 2000; // 2 seconds between retries
	}

	/**
	 * Test SAPL API connection by fetching seasons
	 * @returns {Promise<Object>} Connection status
	 */
	async testConnection() {
		// Demo mode - return mock data
		if (this.demoMode) {
			return {
				connected: true,
				message: "Connected to SAPL LeagueRepublic API (Demo Mode)",
				seasons: 3,
				leagueId: this.leagueId,
				demo: true,
			};
		}

		try {
			const response = await axios.get(
				`${this.baseUrl}/getSeasonsForLeague/${this.leagueId}.json`,
				{ timeout: this.timeout }
			);

			if (response.data && Array.isArray(response.data)) {
				return {
					connected: true,
					message: "Connected to SAPL LeagueRepublic API",
					seasons: response.data.length,
					leagueId: this.leagueId,
				};
			} else {
				return {
					connected: false,
					message: "Invalid response from SAPL API",
				};
			}
		} catch (error) {
			console.error("SAPL API connection test failed:", error.message);
			return {
				connected: false,
				message: `Connection failed: ${error.message}`,
			};
		}
	}

	/**
	 * Get all seasons for SAPL league
	 * @returns {Promise<Array>} Array of seasons
	 */
	async getSeasonsForLeague() {
		try {
			const response = await axios.get(
				`${this.baseUrl}/getSeasonsForLeague/${this.leagueId}.json`,
				{ timeout: this.timeout }
			);
			return response.data || [];
		} catch (error) {
			console.error("Error fetching SAPL seasons:", error.message);
			throw new Error(`Failed to fetch SAPL seasons: ${error.message}`);
		}
	}

	/**
	 * Get fixture groups for season 28
	 * @returns {Promise<Array>} Array of fixture groups
	 */
	async getFixtureGroupsForSeason28() {
		try {
			const response = await axios.get(
				`${this.baseUrl}/getFixtureGroupsForSeason/${this.season28Id}.json`,
				{ timeout: this.timeout }
			);
			return response.data || [];
		} catch (error) {
			console.error(
				"Error fetching SAPL fixture groups for season 28:",
				error.message
			);
			throw new Error(`Failed to fetch SAPL fixture groups: ${error.message}`);
		}
	}

	/**
	 * Get teams for a specific fixture group
	 * @param {string} fixtureGroupId - Fixture group identifier
	 * @param {number} fixtureTypeId - Fixture type (1 for division, 2 for competition)
	 * @returns {Promise<Array>} Array of teams
	 */
	async getTeamsForFixtureGroup(fixtureGroupId, fixtureTypeId = 1) {
		try {
			const response = await axios.get(
				`${this.baseUrl}/getTeamsForFixtureGroup/${fixtureTypeId}/${fixtureGroupId}.json`,
				{ timeout: this.timeout }
			);
			return response.data || [];
		} catch (error) {
			console.error(
				`Error fetching SAPL teams for fixture group ${fixtureGroupId}:`,
				error.message
			);
			throw new Error(
				`Failed to fetch SAPL teams for fixture group: ${error.message}`
			);
		}
	}

	/**
	 * Get all teams from SAPL by fetching from all fixture groups
	 * @returns {Promise<Array>} Array of all SAPL teams
	 */
	async getAllTeams() {
		// Demo mode - return mock data
		if (this.demoMode) {
			return [
				{
					id: "team_001",
					name: "Manchester United",
					logo: "https://via.placeholder.com/50x50/red/white?text=MU",
					division: "Premier Division",
					fixtureGroupId: "div_001",
					saplData: {
						teamID: "team_001",
						teamName: "Manchester United",
						teamLogo: "https://via.placeholder.com/50x50/red/white?text=MU",
					},
				},
				{
					id: "team_002",
					name: "Liverpool FC",
					logo: "https://via.placeholder.com/50x50/red/white?text=LFC",
					division: "Premier Division",
					fixtureGroupId: "div_001",
					saplData: {
						teamID: "team_002",
						teamName: "Liverpool FC",
						teamLogo: "https://via.placeholder.com/50x50/red/white?text=LFC",
					},
				},
				{
					id: "team_003",
					name: "Arsenal",
					logo: "https://via.placeholder.com/50x50/red/white?text=ARS",
					division: "Premier Division",
					fixtureGroupId: "div_001",
					saplData: {
						teamID: "team_003",
						teamName: "Arsenal",
						teamLogo: "https://via.placeholder.com/50x50/red/white?text=ARS",
					},
				},
				{
					id: "team_004",
					name: "Chelsea",
					logo: "https://via.placeholder.com/50x50/blue/white?text=CHE",
					division: "Championship Division",
					fixtureGroupId: "div_002",
					saplData: {
						teamID: "team_004",
						teamName: "Chelsea",
						teamLogo: "https://via.placeholder.com/50x50/blue/white?text=CHE",
					},
				},
				{
					id: "team_005",
					name: "Tottenham Hotspur",
					logo: "https://via.placeholder.com/50x50/white/blue?text=TOT",
					division: "Championship Division",
					fixtureGroupId: "div_002",
					saplData: {
						teamID: "team_005",
						teamName: "Tottenham Hotspur",
						teamLogo: "https://via.placeholder.com/50x50/white/blue?text=TOT",
					},
				},
				{
					id: "team_006",
					name: "Manchester City",
					logo: "https://via.placeholder.com/50x50/blue/white?text=MCI",
					division: "Premier Division",
					fixtureGroupId: "div_001",
					saplData: {
						teamID: "team_006",
						teamName: "Manchester City",
						teamLogo: "https://via.placeholder.com/50x50/blue/white?text=MCI",
					},
				},
			];
		}

		try {
			const fixtureGroups = await this.getFixtureGroupsForSeason28();
			const allTeams = [];
			const seenTeamIds = new Set();

			for (const fixtureGroup of fixtureGroups) {
				try {
					// Get teams for each fixture group (assuming type 1 for divisions)
					const teams = await this.getTeamsForFixtureGroup(
						fixtureGroup.fixtureGroupIdentifier || fixtureGroup.id,
						1
					);

					for (const team of teams) {
						if (!seenTeamIds.has(team.teamID)) {
							seenTeamIds.add(team.teamID);
							allTeams.push({
								id: team.teamID,
								name: team.teamName,
								logo: team.teamLogo || null,
								division: fixtureGroup.fixtureGroupName || "Unknown",
								fixtureGroupId:
									fixtureGroup.fixtureGroupIdentifier || fixtureGroup.id,
								saplData: team,
							});
						}
					}
				} catch (groupError) {
					console.warn(
						`Failed to fetch teams for fixture group ${fixtureGroup.fixtureGroupIdentifier}:`,
						groupError.message
					);
				}
			}

			return allTeams;
		} catch (error) {
			console.error("Error fetching all SAPL teams:", error.message);
			throw new Error(`Failed to fetch all SAPL teams: ${error.message}`);
		}
	}

	/**
	 * Make a rate-limited API call with retry logic
	 * @param {string} url - API URL to call
	 * @param {Object} options - Axios options
	 * @returns {Promise<Object>} API response
	 */
	async makeRateLimitedCall(url, options = {}) {
		let lastError;

		for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
			try {
				// Add delay between requests to respect rate limits
				if (attempt > 1) {
					await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
				}

				const response = await axios.get(url, {
					timeout: this.timeout,
					...options,
				});

				// Add delay after successful request to respect rate limits
				await new Promise((resolve) =>
					setTimeout(resolve, this.rateLimitDelay)
				);

				return response;
			} catch (error) {
				lastError = error;

				// If it's a rate limit error, wait longer before retrying
				if (error.response?.status === 429) {
					const waitTime = this.retryDelay * attempt;
					console.log(
						`Rate limited, waiting ${waitTime}ms before retry ${attempt}/${this.maxRetries}`
					);
					await new Promise((resolve) => setTimeout(resolve, waitTime));
				} else if (error.response?.status >= 500) {
					// Server error, wait before retry
					await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
				} else {
					// Client error (4xx), don't retry
					break;
				}
			}
		}

		throw lastError;
	}

	/**
	 * Get season details from SAPL API
	 * @param {string} seasonId - Season ID to fetch details for
	 * @returns {Promise<Object>} Season details
	 */
	async getSeasonDetails(seasonId) {
		try {
			const response = await this.makeRateLimitedCall(
				`${this.baseUrl}/getSeasonDetails/${seasonId}.json`
			);
			return response.data || {};
		} catch (error) {
			console.error(
				`Error fetching SAPL season details for ${seasonId}:`,
				error.message
			);
			// Return default values if API call fails
			return {
				name: `SAPL Season ${seasonId}`,
				startDate: new Date("2024-01-01"),
				endDate: new Date("2024-12-31"),
			};
		}
	}

	/**
	 * Get fixtures for a specific season
	 * @param {string} seasonId - Season ID to fetch fixtures for
	 * @returns {Promise<Array>} Array of fixtures
	 */
	async getFixturesForSeason(seasonId) {
		try {
			const response = await this.makeRateLimitedCall(
				`${this.baseUrl}/getFixturesForSeason/${seasonId}.json`
			);
			return response.data || [];
		} catch (error) {
			console.error(
				`Error fetching SAPL fixtures for season ${seasonId}:`,
				error.message
			);
			throw new Error(
				`Failed to fetch SAPL fixtures for season ${seasonId}: ${error.message}`
			);
		}
	}

	/**
	 * Get full fixture details
	 * @param {string} fixtureId - Fixture ID
	 * @returns {Promise<Object>} Fixture details
	 */
	async getFullFixtureDetails(fixtureId) {
		try {
			const response = await this.makeRateLimitedCall(
				`${this.baseUrl}/getFullFixtureDetails/${fixtureId}.json`
			);
			return response.data || {};
		} catch (error) {
			console.error(
				`Error fetching SAPL fixture details for ${fixtureId}:`,
				error.message
			);
			throw new Error(`Failed to fetch SAPL fixture details: ${error.message}`);
		}
	}

	/**
	 * Get standings for a fixture group
	 * @param {string} fixtureGroupId - Fixture group identifier
	 * @param {number} fixtureTypeId - Fixture type (1 for division, 2 for competition)
	 * @returns {Promise<Array>} Array of standings
	 */
	async getStandingsForFixtureGroup(fixtureGroupId, fixtureTypeId = 1) {
		try {
			const response = await axios.get(
				`${this.baseUrl}/getStandingsForFixtureGroup/${fixtureTypeId}/${fixtureGroupId}.json`,
				{ timeout: this.timeout }
			);
			return response.data || [];
		} catch (error) {
			console.error(
				`Error fetching SAPL standings for fixture group ${fixtureGroupId}:`,
				error.message
			);
			throw new Error(`Failed to fetch SAPL standings: ${error.message}`);
		}
	}

	/**
	 * Get team statistics for a season
	 * @param {string} seasonId - Season ID
	 * @param {string} teamId - Team ID
	 * @returns {Promise<Object>} Team statistics
	 */
	async getStatisticSummaryForTeam(seasonId, teamId) {
		try {
			const response = await axios.get(
				`${this.baseUrl}/getStatisticSummaryForTeam/${seasonId}/${teamId}.json`,
				{ timeout: this.timeout }
			);
			return response.data || {};
		} catch (error) {
			console.error(
				`Error fetching SAPL team statistics for team ${teamId}:`,
				error.message
			);
			throw new Error(`Failed to fetch SAPL team statistics: ${error.message}`);
		}
	}

	/**
	 * Sync SAPL teams to local database
	 * @param {Object} prisma - Prisma client instance
	 * @returns {Promise<Object>} Sync results
	 */
	async syncTeamsToDatabase(prisma) {
		// Demo mode - return mock results
		if (this.demoMode) {
			console.log("Running SAPL team sync in DEMO MODE");
			return {
				created: 6,
				updated: 0,
				errors: 0,
				teams: [],
				demo: true,
			};
		}

		try {
			const saplTeams = await this.getAllTeams();
			const results = {
				created: 0,
				updated: 0,
				errors: 0,
				teams: [],
			};

			for (const saplTeam of saplTeams) {
				try {
					// Check if team already exists
					const existingTeam = await prisma.team.findFirst({
						where: {
							OR: [{ name: saplTeam.name }, { saplId: String(saplTeam.id) }],
						},
					});

					if (existingTeam) {
						// Update existing team
						const updatedTeam = await prisma.team.update({
							where: { id: existingTeam.id },
							data: {
								name: saplTeam.name,
								logoUrl: saplTeam.logo,
								saplId: String(saplTeam.id),
								saplData: saplTeam.saplData,
								updatedAt: new Date(),
							},
						});
						results.updated++;
						results.teams.push(updatedTeam);
					} else {
						// Create new team
						const newTeam = await prisma.team.create({
							data: {
								name: saplTeam.name,
								logoUrl: saplTeam.logo,
								saplId: String(saplTeam.id),
								saplData: saplTeam.saplData,
							},
						});
						results.created++;
						results.teams.push(newTeam);
					}
				} catch (teamError) {
					console.error(`Error syncing team ${saplTeam.name}:`, teamError);
					results.errors++;
				}
			}

			return results;
		} catch (error) {
			console.error("Error syncing teams from SAPL:", error);
			throw error;
		}
	}

	/**
	 * Import all SAPL data for a specific season
	 * @param {Object} prisma - Prisma client instance
	 * @param {string} seasonId - SAPL season ID to import (optional, defaults to Season 28)
	 * @returns {Promise<Object>} Import results
	 */
	async importSeasonData(prisma, seasonId = this.season28Id) {
		// Demo mode - return mock results
		if (this.demoMode) {
			console.log("Running SAPL import in DEMO MODE");
			return {
				teams: { created: 6, updated: 0, errors: 0 },
				fixtures: { created: 15, updated: 0, errors: 0 },
				seasons: { created: 1, updated: 0, errors: 0 },
				total: { created: 22, updated: 0, errors: 0 },
				demo: true,
			};
		}

		try {
			const results = {
				teams: { created: 0, updated: 0, errors: 0 },
				fixtures: { created: 0, updated: 0, errors: 0 },
				seasons: { created: 0, updated: 0, errors: 0 },
				total: { created: 0, updated: 0, errors: 0 },
			};

			// Get season details from SAPL API
			const seasonDetails = await this.getSeasonDetails(seasonId);

			// First, create or update the season
			try {
				const seasonData = {
					name: seasonDetails.name || `SAPL Season ${seasonId}`,
					startDate: seasonDetails.startDate || new Date("2024-01-01"),
					endDate: seasonDetails.endDate || new Date("2024-12-31"),
				};

				const existingSeason = await prisma.season.findFirst({
					where: { name: seasonData.name },
				});

				let season;
				if (existingSeason) {
					season = await prisma.season.update({
						where: { id: existingSeason.id },
						data: seasonData,
					});
					results.seasons.updated++;
				} else {
					season = await prisma.season.create({
						data: seasonData,
					});
					results.seasons.created++;
				}

				// Sync teams
				const teamResults = await this.syncTeamsToDatabase(prisma);
				results.teams = teamResults;
				results.total.created += teamResults.created;
				results.total.updated += teamResults.updated;
				results.total.errors += teamResults.errors;

				// Sync fixtures
				const fixtureResults = await this.syncFixturesForSeason(
					prisma,
					season.id,
					seasonId
				);
				results.fixtures = fixtureResults;
				results.total.created += fixtureResults.created;
				results.total.updated += fixtureResults.updated;
				results.total.errors += fixtureResults.errors;
			} catch (seasonError) {
				console.error("Error creating/updating season:", seasonError);
				results.seasons.errors++;
				results.total.errors++;
			}

			return results;
		} catch (error) {
			console.error("Error importing SAPL season 28 data:", error);
			throw error;
		}
	}

	/**
	 * Sync fixtures for a specific season
	 * @param {Object} prisma - Prisma client instance
	 * @param {string} seasonId - Local season ID
	 * @param {string} saplSeasonId - SAPL season ID
	 * @returns {Promise<Object>} Sync results
	 */
	async syncFixturesForSeason(prisma, seasonId, saplSeasonId) {
		try {
			const fixtures = await this.getFixturesForSeason(saplSeasonId);
			console.log(
				`Processing ${fixtures.length} fixtures for season ${saplSeasonId}...`
			);

			const results = {
				created: 0,
				updated: 0,
				errors: 0,
			};

			for (let i = 0; i < fixtures.length; i++) {
				const fixture = fixtures[i];
				if (i % 10 === 0) {
					console.log(
						`Processing fixture ${i + 1}/${fixtures.length} (${Math.round(
							((i + 1) / fixtures.length) * 100
						)}%)`
					);
				}
				try {
					// Get full fixture details
					const fullFixture = await this.getFullFixtureDetails(
						fixture.fixtureID
					);

					// Find or create home team
					let homeTeam = await prisma.team.findFirst({
						where: {
							saplId: String(fullFixture.homeTeamID || fixture.homeTeamID),
						},
					});

					if (!homeTeam) {
						console.log(
							`Creating missing home team with SAPL ID: ${
								fullFixture.homeTeamID || fixture.homeTeamID
							}`
						);
						// Create the missing team with basic data
						homeTeam = await prisma.team.create({
							data: {
								name:
									fullFixture.homeTeamName ||
									fixture.homeTeamName ||
									`Team ${fullFixture.homeTeamID || fixture.homeTeamID}`,
								saplId: String(fullFixture.homeTeamID || fixture.homeTeamID),
								saplData: { id: fullFixture.homeTeamID || fixture.homeTeamID },
							},
						});
						console.log(
							`Created home team: ${homeTeam.name} (ID: ${homeTeam.id})`
						);
					}

					// Find or create away team
					let awayTeam = await prisma.team.findFirst({
						where: {
							saplId: String(fullFixture.awayTeamID || fixture.awayTeamID),
						},
					});

					if (!awayTeam) {
						console.log(
							`Creating missing away team with SAPL ID: ${
								fullFixture.awayTeamID || fixture.awayTeamID
							}`
						);
						// Create the missing team with basic data
						awayTeam = await prisma.team.create({
							data: {
								name:
									fullFixture.awayTeamName ||
									fixture.awayTeamName ||
									`Team ${fullFixture.awayTeamID || fixture.awayTeamID}`,
								saplId: String(fullFixture.awayTeamID || fixture.awayTeamID),
								saplData: { id: fullFixture.awayTeamID || fixture.awayTeamID },
							},
						});
						console.log(
							`Created away team: ${awayTeam.name} (ID: ${awayTeam.id})`
						);
					}

					// Parse date safely
					const parseDate = (dateStr) => {
						if (!dateStr || dateStr === "" || dateStr === "Invalid Date")
							return null;

						try {
							// Handle SAPL date format: "20250630 22:00"
							if (
								typeof dateStr === "string" &&
								dateStr.match(/^\d{8}\s\d{2}:\d{2}$/)
							) {
								const year = dateStr.substring(0, 4);
								const month = dateStr.substring(4, 6);
								const day = dateStr.substring(6, 8);
								const time = dateStr.substring(9);
								const formattedDate = `${year}-${month}-${day}T${time}:00`;
								const date = new Date(formattedDate);

								if (!isNaN(date.getTime())) {
									return date;
								}
							}

							// Try standard date parsing
							const date = new Date(dateStr);
							if (!isNaN(date.getTime())) {
								return date;
							}

							console.log(`⚠️  Could not parse date: ${dateStr}`);
							return null;
						} catch (error) {
							console.log(`⚠️  Could not parse date: ${dateStr}`);
							return null;
						}
					};

					const fixtureDate = parseDate(fixture.fixtureDate || fixture.date);

					// Skip fixtures with invalid dates
					if (!fixtureDate) {
						console.log(
							`⚠️  Skipping fixture ${fixture.fixtureID} due to invalid date: ${
								fixture.fixtureDate || fixture.date
							}`
						);
						results.errors++;
						continue;
					}

					// Check if fixture already exists
					const existingFixture = await prisma.match.findFirst({
						where: {
							seasonId: seasonId,
							homeTeamId: homeTeam.id,
							awayTeamId: awayTeam.id,
							date: fixtureDate,
						},
					});

					// Parse scores safely (convert strings to integers)
					const parseScore = (score) => {
						if (score === null || score === undefined || score === "") return 0;
						const parsed = parseInt(score, 10);
						return isNaN(parsed) ? 0 : parsed;
					};

					const fixtureData = {
						seasonId: seasonId,
						homeTeamId: homeTeam.id,
						awayTeamId: awayTeam.id,
						date: fixtureDate,
						homeScore: parseScore(fullFixture.homeScore || fixture.homeScore),
						awayScore: parseScore(fullFixture.awayScore || fixture.awayScore),
						competitionType: "LEAGUE", // Default to league
						status: this.mapFixtureStatus(fullFixture.status || fixture.status),
					};

					if (existingFixture) {
						// Update existing fixture
						await prisma.match.update({
							where: { id: existingFixture.id },
							data: fixtureData,
						});
						results.updated++;
					} else {
						// Create new fixture
						await prisma.match.create({
							data: fixtureData,
						});
						results.created++;
					}
				} catch (fixtureError) {
					console.error(
						`Error syncing fixture ${fixture.fixtureID}:`,
						fixtureError
					);
					results.errors++;
				}
			}

			return results;
		} catch (error) {
			console.error("Error syncing fixtures for season:", error);
			throw error;
		}
	}

	/**
	 * Sync a specific fixture group
	 * @param {Object} prisma - Prisma client instance
	 * @param {string} fixtureGroupId - Fixture group identifier
	 * @returns {Promise<Object>} Sync results
	 */
	async syncFixtureGroup(prisma, fixtureGroupId) {
		try {
			const results = {
				teams: { created: 0, updated: 0, errors: 0 },
				fixtures: { created: 0, updated: 0, errors: 0 },
			};

			// Sync teams for this fixture group
			const teams = await this.getTeamsForFixtureGroup(fixtureGroupId);
			for (const team of teams) {
				try {
					const existingTeam = await prisma.team.findFirst({
						where: { saplId: String(team.teamID) },
					});

					if (existingTeam) {
						await prisma.team.update({
							where: { id: existingTeam.id },
							data: {
								name: team.teamName,
								logoUrl: team.teamLogo || null,
								saplData: team,
								updatedAt: new Date(),
							},
						});
						results.teams.updated++;
					} else {
						await prisma.team.create({
							data: {
								name: team.teamName,
								logoUrl: team.teamLogo || null,
								saplId: String(team.teamID),
								saplData: team,
							},
						});
						results.teams.created++;
					}
				} catch (teamError) {
					console.error(`Error syncing team ${team.teamName}:`, teamError);
					results.teams.errors++;
				}
			}

			return results;
		} catch (error) {
			console.error("Error syncing fixture group:", error);
			throw error;
		}
	}

	/**
	 * Map SAPL fixture status to local match status
	 * @param {string} saplStatus - SAPL fixture status
	 * @returns {string} Local match status
	 */
	mapFixtureStatus(saplStatus) {
		const statusMap = {
			Fixture: "SCHEDULED",
			Live: "IN_PROGRESS",
			"Full Time": "COMPLETED",
			Postponed: "POSTPONED",
			Cancelled: "CANCELLED",
		};

		return statusMap[saplStatus] || "SCHEDULED";
	}

	/**
	 * Get mock teams for development/testing (fallback)
	 * @returns {Array} Mock team data
	 */
	getMockTeams() {
		return [
			{
				id: "sapl_001",
				name: "Arsenal FC",
				logo: "https://example.com/arsenal.png",
				division: "Premier Division",
				fixtureGroupId: "1",
				saplData: {},
			},
			{
				id: "sapl_002",
				name: "Chelsea FC",
				logo: "https://example.com/chelsea.png",
				division: "Premier Division",
				fixtureGroupId: "1",
				saplData: {},
			},
		];
	}
}

module.exports = new SAPLService();
