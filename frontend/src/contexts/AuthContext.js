import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext();

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [token, setToken] = useState(localStorage.getItem("token"));

	// Initialize user profile if token exists
	useEffect(() => {
		if (token) {
			fetchUserProfile();
		} else {
			setLoading(false);
		}
	}, [token]);

	const fetchUserProfile = async () => {
		try {
			const response = await api.get("/auth/profile");
			setUser(response.data.data);
		} catch (error) {
			console.error("Error fetching user profile:", error);
			logout();
		} finally {
			setLoading(false);
		}
	};

	const login = async (email, password) => {
		try {
			const response = await api.post("/auth/login", {
				email,
				password,
			});

			const { token: newToken, user: userData } = response.data.data;

			localStorage.setItem("token", newToken);
			setToken(newToken);
			setUser(userData);

			// Token is automatically handled by the API client

			return { success: true };
		} catch (error) {
			console.error("Login error:", error);
			return {
				success: false,
				error:
					error.response?.data?.error?.message ||
					error.response?.data?.message ||
					"Login failed",
			};
		}
	};

	const logout = () => {
		localStorage.removeItem("token");
		setToken(null);
		setUser(null);
		// Token removal is automatically handled by the API client
	};

	const isTeamAdmin = () => {
		return (
			user?.user?.role === "TEAM_ADMIN" ||
			user?.user?.role === "LEAGUE_ADMIN" ||
			user?.user?.role === "COMPETITION_ADMIN"
		);
	};

	const isLeagueAdmin = () => {
		return (
			user?.user?.role === "LEAGUE_ADMIN" ||
			user?.user?.role === "COMPETITION_ADMIN"
		);
	};

	const isCompetitionAdmin = () => {
		return user?.user?.role === "COMPETITION_ADMIN";
	};

	const value = {
		user,
		loading,
		login,
		logout,
		isTeamAdmin,
		isLeagueAdmin,
		isCompetitionAdmin,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
