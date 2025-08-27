import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../utils/api";

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

	// Configure axios defaults
	useEffect(() => {
		if (token) {
			axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
			fetchUserProfile();
		} else {
			setLoading(false);
		}
	}, [token]);

	const fetchUserProfile = async () => {
		try {
			const response = await axios.get(API_ENDPOINTS.AUTH.PROFILE);
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
			const response = await axios.post(API_ENDPOINTS.AUTH.LOGIN, {
				email,
				password,
			});

			const { token: newToken, user: userData } = response.data.data;

			localStorage.setItem("token", newToken);
			setToken(newToken);
			setUser(userData);

			axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

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
		delete axios.defaults.headers.common["Authorization"];
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
