/**
 * TOTW (Team of the Week) Rating Calculation Service
 * Calculates position-specific ratings based on player performance
 */

const { PlayerPosition } = require("@prisma/client");

/**
 * Calculate TOTW rating based on player position and performance stats
 * @param {Object} stats - Player match statistics
 * @param {string} position - Player position
 * @returns {number} TOTW rating (0-10)
 */
function calculateTotwRating(stats, position) {
	const baseRating = stats.rating || 0;

	// Position-specific multipliers and weights
	const positionConfig = getPositionConfig(position);

	let totwRating = baseRating;

	// Apply position-specific bonuses
	for (const [statName, value] of Object.entries(stats)) {
		if (positionConfig.weights[statName]) {
			const weight = positionConfig.weights[statName];
			const normalizedValue = normalizeStatValue(statName, value);
			totwRating += normalizedValue * weight;
		}
	}

	// Apply position-specific multipliers
	totwRating *= positionConfig.multiplier;

	// Ensure rating is between 0 and 10
	return Math.max(0, Math.min(10, totwRating));
}

/**
 * Get position-specific configuration for TOTW calculation
 * @param {string} position - Player position
 * @returns {Object} Position configuration
 */
function getPositionConfig(position) {
	const configs = {
		// Goalkeepers
		[PlayerPosition.GK]: {
			multiplier: 1.0,
			weights: {
				saves: 0.3,
				cleanSheet: 0.4,
				goals: 0.1, // Penalty saves count as goals prevented
				passes: 0.1,
				passAccuracy: 0.1,
				yellowCards: -0.05,
				redCards: -0.2,
			},
		},

		// Defenders
		[PlayerPosition.CB]: {
			multiplier: 1.0,
			weights: {
				tackles: 0.25,
				interceptions: 0.25,
				cleanSheet: 0.3,
				passes: 0.1,
				passAccuracy: 0.1,
				goals: 0.15, // Set piece goals
				assists: 0.1,
				yellowCards: -0.05,
				redCards: -0.2,
			},
		},
		[PlayerPosition.LB]: {
			multiplier: 1.0,
			weights: {
				tackles: 0.2,
				interceptions: 0.2,
				cleanSheet: 0.25,
				passes: 0.15,
				passAccuracy: 0.15,
				goals: 0.1,
				assists: 0.15,
				yellowCards: -0.05,
				redCards: -0.2,
			},
		},
		[PlayerPosition.RB]: {
			multiplier: 1.0,
			weights: {
				tackles: 0.2,
				interceptions: 0.2,
				cleanSheet: 0.25,
				passes: 0.15,
				passAccuracy: 0.15,
				goals: 0.1,
				assists: 0.15,
				yellowCards: -0.05,
				redCards: -0.2,
			},
		},

		// Midfielders
		[PlayerPosition.CDM]: {
			multiplier: 1.0,
			weights: {
				tackles: 0.2,
				interceptions: 0.2,
				passes: 0.2,
				passAccuracy: 0.2,
				goals: 0.1,
				assists: 0.15,
				yellowCards: -0.05,
				redCards: -0.2,
			},
		},
		[PlayerPosition.CM]: {
			multiplier: 1.0,
			weights: {
				passes: 0.25,
				passAccuracy: 0.25,
				goals: 0.15,
				assists: 0.2,
				tackles: 0.1,
				interceptions: 0.1,
				yellowCards: -0.05,
				redCards: -0.2,
			},
		},
		[PlayerPosition.CAM]: {
			multiplier: 1.0,
			weights: {
				goals: 0.25,
				assists: 0.3,
				passes: 0.15,
				passAccuracy: 0.15,
				tackles: 0.05,
				interceptions: 0.05,
				yellowCards: -0.05,
				redCards: -0.2,
			},
		},
		[PlayerPosition.LM]: {
			multiplier: 1.0,
			weights: {
				goals: 0.2,
				assists: 0.25,
				passes: 0.15,
				passAccuracy: 0.15,
				tackles: 0.1,
				interceptions: 0.1,
				yellowCards: -0.05,
				redCards: -0.2,
			},
		},
		[PlayerPosition.RM]: {
			multiplier: 1.0,
			weights: {
				goals: 0.2,
				assists: 0.25,
				passes: 0.15,
				passAccuracy: 0.15,
				tackles: 0.1,
				interceptions: 0.1,
				yellowCards: -0.05,
				redCards: -0.2,
			},
		},

		// Attackers
		[PlayerPosition.LW]: {
			multiplier: 1.0,
			weights: {
				goals: 0.3,
				assists: 0.25,
				passes: 0.1,
				passAccuracy: 0.1,
				tackles: 0.05,
				interceptions: 0.05,
				yellowCards: -0.05,
				redCards: -0.2,
			},
		},
		[PlayerPosition.RW]: {
			multiplier: 1.0,
			weights: {
				goals: 0.3,
				assists: 0.25,
				passes: 0.1,
				passAccuracy: 0.1,
				tackles: 0.05,
				interceptions: 0.05,
				yellowCards: -0.05,
				redCards: -0.2,
			},
		},
		[PlayerPosition.ST]: {
			multiplier: 1.0,
			weights: {
				goals: 0.4,
				assists: 0.2,
				passes: 0.05,
				passAccuracy: 0.05,
				tackles: 0.05,
				interceptions: 0.05,
				yellowCards: -0.05,
				redCards: -0.2,
			},
		},
		[PlayerPosition.CF]: {
			multiplier: 1.0,
			weights: {
				goals: 0.35,
				assists: 0.25,
				passes: 0.1,
				passAccuracy: 0.1,
				tackles: 0.05,
				interceptions: 0.05,
				yellowCards: -0.05,
				redCards: -0.2,
			},
		},
	};

	return configs[position] || configs[PlayerPosition.CM]; // Default to CM if position not found
}

/**
 * Normalize stat values to a 0-1 scale for consistent weighting
 * @param {string} statName - Name of the statistic
 * @param {*} value - Value of the statistic
 * @returns {number} Normalized value (0-1)
 */
function normalizeStatValue(statName, value) {
	if (typeof value !== "number") return 0;

	const normalizationRanges = {
		goals: { max: 5, min: 0 },
		assists: { max: 5, min: 0 },
		passes: { max: 100, min: 0 },
		passAccuracy: { max: 100, min: 0 },
		tackles: { max: 20, min: 0 },
		interceptions: { max: 20, min: 0 },
		saves: { max: 15, min: 0 },
		yellowCards: { max: 2, min: 0 },
		redCards: { max: 1, min: 0 },
	};

	const range = normalizationRanges[statName];
	if (!range) return 0;

	// For boolean values like cleanSheet
	if (typeof value === "boolean") {
		return value ? 1 : 0;
	}

	// Normalize to 0-1 range
	const normalized = (value - range.min) / (range.max - range.min);
	return Math.max(0, Math.min(1, normalized));
}

/**
 * Calculate average TOTW rating for a season
 * @param {Array} matchStats - Array of match statistics
 * @returns {number} Average TOTW rating
 */
function calculateAverageTotwRating(matchStats) {
	if (!matchStats || matchStats.length === 0) return 0;

	const totalRating = matchStats.reduce(
		(sum, stat) => sum + (stat.totwRating || 0),
		0
	);
	return totalRating / matchStats.length;
}

/**
 * Get TOTW team for a specific week/match
 * @param {Array} matchStats - Array of match statistics for the week
 * @returns {Object} TOTW team with best players by position
 */
function getTotwTeam(matchStats) {
	const positionGroups = {};

	// Group players by position
	matchStats.forEach((stat) => {
		if (!positionGroups[stat.player.position]) {
			positionGroups[stat.player.position] = [];
		}
		positionGroups[stat.player.position].push(stat);
	});

	// Select best player for each position
	const totwTeam = {};
	Object.entries(positionGroups).forEach(([position, players]) => {
		const bestPlayer = players.reduce((best, current) =>
			current.totwRating > best.totwRating ? current : best
		);
		totwTeam[position] = bestPlayer;
	});

	return totwTeam;
}

module.exports = {
	calculateTotwRating,
	calculateAverageTotwRating,
	getTotwTeam,
	getPositionConfig,
	normalizeStatValue,
};

