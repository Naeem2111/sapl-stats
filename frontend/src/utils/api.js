// API configuration utility
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

// Helper function to build API endpoints
export const buildApiUrl = (endpoint) => {
	return `${API_BASE_URL}${endpoint}`;
};

// Common API endpoints
export const API_ENDPOINTS = {
	AUTH: {
		LOGIN: buildApiUrl("/auth/login"),
		PROFILE: buildApiUrl("/auth/profile"),
		REGISTER: buildApiUrl("/auth/register"),
	},
	TEAMS: buildApiUrl("/teams"),
	PLAYERS: buildApiUrl("/players"),
	MATCHES: buildApiUrl("/matches"),
	SEASONS: buildApiUrl("/seasons"),
	STATS: buildApiUrl("/stats"),
	USERS: buildApiUrl("/users"),
	BADGES: buildApiUrl("/badges"),
	COMPETITIONS: buildApiUrl("/competitions"),
	ADMIN: buildApiUrl("/admin"),
	SAPL: buildApiUrl("/sapl"),
	CUPS: buildApiUrl("/cups"),
};
