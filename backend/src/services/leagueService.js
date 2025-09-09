/**
 * League Management Service
 * Handles creation and management of leagues (round robin competitions)
 */

const { prisma } = require("../database/prisma");
const { CompetitionType, MatchStatus } = require("@prisma/client");

/**
 * Create a new league with round robin fixtures
 * @param {Object} leagueData - League creation data
 * @returns {Object} Created league with fixtures
 */
async function createLeague(leagueData) {
	const {
		name,
		description,
		seasonId,
		teamIds,
		startDate,
		endDate,
		leagueId,
		matchDuration = 90, // minutes
		pointsForWin = 3,
		pointsForDraw = 1,
		pointsForLoss = 0,
	} = leagueData;

	// Validate required fields
	if (!name || !seasonId || !teamIds || teamIds.length < 2) {
		throw new Error(
			"League name, season ID, and at least 2 teams are required"
		);
	}

	// Check if season exists
	const season = await prisma.season.findUnique({
		where: { id: seasonId },
	});

	if (!season) {
		throw new Error("Season not found");
	}

	// Validate teams exist
	const teams = await prisma.team.findMany({
		where: { id: { in: teamIds } },
	});

	if (teams.length !== teamIds.length) {
		throw new Error("One or more teams not found");
	}

	// Create league record
	const league = await prisma.league.create({
		data: {
			name,
			description,
			saplId: leagueId,
			isActive: true,
		},
	});

	// Generate round robin fixtures
	const fixtures = generateRoundRobinFixtures(
		teamIds,
		startDate,
		endDate,
		matchDuration
	);

	// Create matches
	const createdMatches = [];
	for (const fixture of fixtures) {
		const match = await prisma.match.create({
			data: {
				seasonId,
				leagueId: league.id,
				homeTeamId: fixture.homeTeamId,
				awayTeamId: fixture.awayTeamId,
				date: fixture.date,
				competitionType: CompetitionType.LEAGUE,
				status: MatchStatus.SCHEDULED,
			},
		});
		createdMatches.push(match);
	}

	// Create team season aggregates for tracking
	const teamAggregates = [];
	for (const teamId of teamIds) {
		const aggregate = await prisma.teamSeasonAggregate.create({
			data: {
				seasonId,
				teamId,
				leagueId: league.id,
				matchesPlayed: 0,
				matchesWon: 0,
				matchesDrawn: 0,
				matchesLost: 0,
				goalsFor: 0,
				goalsAgainst: 0,
				goalDifference: 0,
				points: 0,
				position: 0,
				cleanSheets: 0,
				goalsConceded: 0,
				shotsOnTarget: 0,
				shotsOffTarget: 0,
				possession: 0,
				yellowCards: 0,
				redCards: 0,
				formPoints: 0,
				formString: "",
			},
		});
		teamAggregates.push(aggregate);
	}

	return {
		league,
		fixtures: createdMatches,
		teamAggregates,
		season,
	};
}

/**
 * Generate round robin fixtures for teams
 * @param {Array} teamIds - Array of team IDs
 * @param {Date} startDate - Start date for fixtures
 * @param {Date} endDate - End date for fixtures
 * @param {number} matchDuration - Duration of each match in minutes
 * @returns {Array} Array of fixture objects
 */
function generateRoundRobinFixtures(
	teamIds,
	startDate,
	endDate,
	matchDuration = 90
) {
	const fixtures = [];
	const numTeams = teamIds.length;

	if (numTeams < 2) {
		throw new Error("At least 2 teams required for league");
	}

	// Calculate total number of matches needed
	const totalMatches = (numTeams * (numTeams - 1)) / 2;

	// Calculate time between matches (in milliseconds)
	const totalTime = endDate.getTime() - startDate.getTime();
	const timeBetweenMatches = totalTime / totalMatches;

	let currentDate = new Date(startDate);
	let matchIndex = 0;

	// Generate fixtures using round robin algorithm
	for (let round = 0; round < numTeams - 1; round++) {
		for (let match = 0; match < numTeams / 2; match++) {
			const homeIndex = (round + match) % (numTeams - 1);
			const awayIndex = (numTeams - 1 - match + round) % (numTeams - 1);

			// Last team stays in place, others rotate
			const homeTeamId = teamIds[homeIndex];
			const awayTeamId = teamIds[awayIndex];

			// Skip if it's the same team or if we've already played this fixture
			if (
				homeTeamId !== awayTeamId &&
				!fixtures.some(
					(f) =>
						(f.homeTeamId === homeTeamId && f.awayTeamId === awayTeamId) ||
						(f.homeTeamId === awayTeamId && f.awayTeamId === homeTeamId)
				)
			) {
				fixtures.push({
					homeTeamId,
					awayTeamId,
					date: new Date(currentDate),
					round: round + 1,
				});

				// Move to next match time
				currentDate = new Date(currentDate.getTime() + timeBetweenMatches);
				matchIndex++;
			}
		}
	}

	// Generate return fixtures (home and away)
	const returnFixtures = [];
	for (const fixture of fixtures) {
		returnFixtures.push({
			homeTeamId: fixture.awayTeamId,
			awayTeamId: fixture.homeTeamId,
			date: new Date(fixture.date.getTime() + totalTime / 2), // Second half of season
			round: fixture.round + Math.ceil(totalMatches / 2),
		});
	}

	return [...fixtures, ...returnFixtures].sort((a, b) => a.date - b.date);
}

/**
 * Update league standings after match results
 * @param {string} leagueId - League ID
 * @param {string} seasonId - Season ID
 * @returns {Object} Updated standings
 */
async function updateLeagueStandings(leagueId, seasonId) {
	// Get all completed matches for this league
	const matches = await prisma.match.findMany({
		where: {
			leagueId,
			seasonId,
			status: MatchStatus.COMPLETED,
		},
		include: {
			homeTeam: { select: { id: true, name: true } },
			awayTeam: { select: { id: true, name: true } },
		},
	});

	// Get all teams in the league
	const teams = await prisma.team.findMany({
		where: {
			teamSeasonAggregates: {
				some: {
					leagueId,
					seasonId,
				},
			},
		},
	});

	// Reset all team aggregates
	await prisma.teamSeasonAggregate.updateMany({
		where: {
			leagueId,
			seasonId,
		},
		data: {
			matchesPlayed: 0,
			matchesWon: 0,
			matchesDrawn: 0,
			matchesLost: 0,
			goalsFor: 0,
			goalsAgainst: 0,
			goalDifference: 0,
			points: 0,
			cleanSheets: 0,
			goalsConceded: 0,
			shotsOnTarget: 0,
			shotsOffTarget: 0,
			possession: 0,
			yellowCards: 0,
			redCards: 0,
			formPoints: 0,
			formString: "",
		},
	});

	// Calculate standings from matches
	const teamStats = {};

	for (const team of teams) {
		teamStats[team.id] = {
			teamId: team.id,
			teamName: team.name,
			matchesPlayed: 0,
			matchesWon: 0,
			matchesDrawn: 0,
			matchesLost: 0,
			goalsFor: 0,
			goalsAgainst: 0,
			goalDifference: 0,
			points: 0,
			cleanSheets: 0,
			goalsConceded: 0,
			shotsOnTarget: 0,
			shotsOffTarget: 0,
			possession: 0,
			yellowCards: 0,
			redCards: 0,
			formPoints: 0,
			formString: "",
			recentResults: [],
		};
	}

	// Process each match
	for (const match of matches) {
		const homeTeamId = match.homeTeamId;
		const awayTeamId = match.awayTeamId;
		const homeScore = match.homeScore;
		const awayScore = match.awayScore;

		// Update home team stats
		teamStats[homeTeamId].matchesPlayed++;
		teamStats[homeTeamId].goalsFor += homeScore;
		teamStats[homeTeamId].goalsAgainst += awayScore;
		teamStats[homeTeamId].goalsConceded += awayScore;

		// Update away team stats
		teamStats[awayTeamId].matchesPlayed++;
		teamStats[awayTeamId].goalsFor += awayScore;
		teamStats[awayTeamId].goalsAgainst += homeScore;
		teamStats[awayTeamId].goalsConceded += homeScore;

		// Determine result
		if (homeScore > awayScore) {
			// Home team wins
			teamStats[homeTeamId].matchesWon++;
			teamStats[homeTeamId].points += 3;
			teamStats[homeTeamId].formPoints += 3;
			teamStats[homeTeamId].recentResults.push("W");

			teamStats[awayTeamId].matchesLost++;
			teamStats[awayTeamId].recentResults.push("L");
		} else if (homeScore === awayScore) {
			// Draw
			teamStats[homeTeamId].matchesDrawn++;
			teamStats[homeTeamId].points += 1;
			teamStats[homeTeamId].formPoints += 1;
			teamStats[homeTeamId].recentResults.push("D");

			teamStats[awayTeamId].matchesDrawn++;
			teamStats[awayTeamId].points += 1;
			teamStats[awayTeamId].formPoints += 1;
			teamStats[awayTeamId].recentResults.push("D");
		} else {
			// Away team wins
			teamStats[awayTeamId].matchesWon++;
			teamStats[awayTeamId].points += 3;
			teamStats[awayTeamId].formPoints += 3;
			teamStats[awayTeamId].recentResults.push("W");

			teamStats[homeTeamId].matchesLost++;
			teamStats[homeTeamId].recentResults.push("L");
		}

		// Check for clean sheets
		if (awayScore === 0) {
			teamStats[homeTeamId].cleanSheets++;
		}
		if (homeScore === 0) {
			teamStats[awayTeamId].cleanSheets++;
		}
	}

	// Calculate goal differences and form strings
	for (const teamId in teamStats) {
		const stats = teamStats[teamId];
		stats.goalDifference = stats.goalsFor - stats.goalsAgainst;

		// Keep only last 5 results for form
		stats.recentResults = stats.recentResults.slice(-5);
		stats.formString = stats.recentResults.join("");

		// Calculate form points from last 5 matches
		stats.formPoints = stats.recentResults.reduce((points, result) => {
			if (result === "W") return points + 3;
			if (result === "D") return points + 1;
			return points;
		}, 0);
	}

	// Sort teams by points, goal difference, goals for
	const sortedTeams = Object.values(teamStats).sort((a, b) => {
		if (b.points !== a.points) return b.points - a.points;
		if (b.goalDifference !== a.goalDifference)
			return b.goalDifference - a.goalDifference;
		return b.goalsFor - a.goalsFor;
	});

	// Update database with new standings
	for (let i = 0; i < sortedTeams.length; i++) {
		const team = sortedTeams[i];
		await prisma.teamSeasonAggregate.updateMany({
			where: {
				leagueId,
				seasonId,
				teamId: team.teamId,
			},
			data: {
				...team,
				position: i + 1,
			},
		});
	}

	return {
		standings: sortedTeams,
		leagueId,
		seasonId,
	};
}

/**
 * Get league standings
 * @param {string} leagueId - League ID
 * @param {string} seasonId - Season ID
 * @returns {Object} League standings
 */
async function getLeagueStandings(leagueId, seasonId) {
	const standings = await prisma.teamSeasonAggregate.findMany({
		where: {
			leagueId,
			seasonId,
		},
		include: {
			team: {
				select: {
					id: true,
					name: true,
					logoUrl: true,
				},
			},
		},
		orderBy: {
			position: "asc",
		},
	});

	return standings;
}

/**
 * Get league fixtures
 * @param {string} leagueId - League ID
 * @param {string} seasonId - Season ID
 * @returns {Array} League fixtures
 */
async function getLeagueFixtures(leagueId, seasonId) {
	const fixtures = await prisma.match.findMany({
		where: {
			leagueId,
			seasonId,
		},
		include: {
			homeTeam: {
				select: {
					id: true,
					name: true,
					logoUrl: true,
				},
			},
			awayTeam: {
				select: {
					id: true,
					name: true,
					logoUrl: true,
				},
			},
		},
		orderBy: {
			date: "asc",
		},
	});

	return fixtures;
}

module.exports = {
	createLeague,
	generateRoundRobinFixtures,
	updateLeagueStandings,
	getLeagueStandings,
	getLeagueFixtures,
};

