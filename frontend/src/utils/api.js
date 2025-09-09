import axios from "axios";

// API configuration utility
const API_BASE_URL =
	process.env.REACT_APP_API_URL || "http://localhost:3000/api";

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
	PLAYER_STATS: buildApiUrl("/player-stats"),
	USERS: buildApiUrl("/users"),
	BADGES: buildApiUrl("/badges"),
	COMPETITIONS: buildApiUrl("/competitions"),
	ADMIN: buildApiUrl("/admin"),
	SAPL: buildApiUrl("/sapl"),
	CUPS: buildApiUrl("/cups"),
	LEAGUES: buildApiUrl("/leagues"),
	STATS_FIELDS: buildApiUrl("/stats-fields"),
	OCR: {
		PROCESS_SCREENSHOT: buildApiUrl("/ocr/process-screenshot"),
		APPLY_STATS: buildApiUrl("/ocr/apply-stats"),
		TEST: buildApiUrl("/ocr/test"),
	},
};

// Create axios instance with default configuration
const api = axios.create({
	baseURL: API_BASE_URL,
	timeout: 30000, // 30 seconds timeout
	headers: {
		"Content-Type": "application/json",
	},
});

// Create public API instance (no auth token)
const publicApi = axios.create({
	baseURL: API_BASE_URL,
	timeout: 30000, // 30 seconds timeout
	headers: {
		"Content-Type": "application/json",
	},
});

// Request interceptor to add auth token
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Response interceptor to handle common errors
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			// Token expired or invalid
			localStorage.removeItem("token");
			localStorage.removeItem("user");
			window.location.href = "/login";
		}
		return Promise.reject(error);
	}
);

// Response interceptor for public API (no auth handling)
publicApi.interceptors.response.use(
	(response) => response,
	(error) => {
		return Promise.reject(error);
	}
);

export default api;
export { publicApi };
