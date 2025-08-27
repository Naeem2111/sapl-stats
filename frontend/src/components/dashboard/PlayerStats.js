import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { BarChart3, TrendingUp, Target, Award, Filter } from "lucide-react";
import axios from "axios";
import { API_ENDPOINTS } from "../../utils/api";

const PlayerStats = () => {
	const { user, isTeamAdmin, isLeagueAdmin } = useAuth();
	const [players, setPlayers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedPosition, setSelectedPosition] = useState("all");
	const [selectedTeam, setSelectedTeam] = useState("all");
	const [teams, setTeams] = useState([]);
	const [statsType, setStatsType] = useState("goals");

	useEffect(() => {
		fetchPlayers();
		fetchTeams();
	}, []);

	const fetchPlayers = async () => {
		try {
			const response = await axios.get(API_ENDPOINTS.PLAYERS);
			setPlayers(response.data.data || []);
		} catch (error) {
			console.error("Error fetching players:", error);
			setPlayers([]);
		} finally {
			setLoading(false);
		}
	};

	const fetchTeams = async () => {
		try {
			const response = await axios.get(API_ENDPOINTS.TEAMS);
			setTeams(response.data.data || []);
		} catch (error) {
			console.error("Error fetching teams:", error);
			setTeams([]);
		}
	};

	const getFilteredPlayers = () => {
		let filtered = players;

		if (selectedPosition !== "all") {
			filtered = filtered.filter(
				(player) => player.position === selectedPosition
			);
		}

		if (selectedTeam !== "all" && isLeagueAdmin()) {
			filtered = filtered.filter((player) => player.teamId === selectedTeam);
		}

		return filtered;
	};

	const getPositionColor = (position) => {
		const colors = {
			GK: "bg-red-100 text-red-800",
			CB: "bg-blue-100 text-blue-800",
			LB: "bg-green-100 text-green-800",
			RB: "bg-green-100 text-green-800",
			CDM: "bg-yellow-100 text-yellow-800",
			CM: "bg-purple-100 text-purple-800",
			CAM: "bg-indigo-100 text-indigo-800",
			LM: "bg-pink-100 text-pink-800",
			RM: "bg-pink-100 text-pink-800",
			LW: "bg-orange-100 text-orange-800",
			RW: "bg-orange-100 text-orange-800",
			ST: "bg-gray-100 text-gray-800",
			CF: "bg-gray-100 text-gray-800",
		};
		return colors[position] || "bg-gray-100 text-gray-800";
	};

	// Mock stats for demonstration - replace with real API data
	const getStatsValue = (player, type) => {
		const mockStats = {
			goals: Math.floor(Math.random() * 20) + 1,
			assists: Math.floor(Math.random() * 15) + 1,
			rating: (Math.random() * 3 + 7).toFixed(1),
			matches: Math.floor(Math.random() * 30) + 5,
		};
		return mockStats[type] || 0;
	};

	const getTopPerformers = () => {
		const filteredPlayers = getFilteredPlayers();
		return filteredPlayers
			.map((player) => ({
				...player,
				statsValue: getStatsValue(player, statsType),
			}))
			.sort((a, b) => b.statsValue - a.statsValue)
			.slice(0, 10);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">
						Player Statistics
					</h2>
					<p className="mt-1 text-sm text-gray-500">
						Analyze individual player performance and statistics
					</p>
				</div>
			</div>

			{/* Filters */}
			<div className="card">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Position
						</label>
						<select
							value={selectedPosition}
							onChange={(e) => setSelectedPosition(e.target.value)}
							className="input-field"
						>
							<option value="all">All Positions</option>
							<option value="GK">Goalkeeper</option>
							<option value="CB">Center Back</option>
							<option value="LB">Left Back</option>
							<option value="RB">Right Back</option>
							<option value="CDM">Defensive Midfielder</option>
							<option value="CM">Central Midfielder</option>
							<option value="CAM">Attacking Midfielder</option>
							<option value="LM">Left Midfielder</option>
							<option value="RM">Right Midfielder</option>
							<option value="LW">Left Winger</option>
							<option value="RW">Right Winger</option>
							<option value="ST">Striker</option>
							<option value="CF">Center Forward</option>
						</select>
					</div>

					{isLeagueAdmin() && (
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Team
							</label>
							<select
								value={selectedTeam}
								onChange={(e) => setSelectedTeam(e.target.value)}
								className="input-field"
							>
								<option value="all">All Teams</option>
								{teams.map((team) => (
									<option key={team.id} value={team.id}>
										{team.name}
									</option>
								))}
							</select>
						</div>
					)}

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Stat Type
						</label>
						<select
							value={statsType}
							onChange={(e) => setStatsType(e.target.value)}
							className="input-field"
						>
							<option value="goals">Goals</option>
							<option value="assists">Assists</option>
							<option value="rating">Rating</option>
							<option value="matches">Matches</option>
						</select>
					</div>
				</div>
			</div>

			{/* Stats Overview */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<div className="card">
					<div className="flex items-center">
						<div className="flex-shrink-0">
							<Target className="h-8 w-8 text-primary-600" />
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-500">Total Players</p>
							<p className="text-2xl font-semibold text-gray-900">
								{getFilteredPlayers().length}
							</p>
						</div>
					</div>
				</div>

				<div className="card">
					<div className="flex items-center">
						<div className="flex-shrink-0">
							<Award className="h-8 w-8 text-green-600" />
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-500">Top Performer</p>
							<p className="text-lg font-semibold text-gray-900">
								{getTopPerformers()[0]?.gamertag || "N/A"}
							</p>
						</div>
					</div>
				</div>

				<div className="card">
					<div className="flex items-center">
						<div className="flex-shrink-0">
							<BarChart3 className="h-8 w-8 text-blue-600" />
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-500">
								Average Rating
							</p>
							<p className="text-2xl font-semibold text-gray-900">
								{(
									getTopPerformers().reduce(
										(acc, player) => acc + parseFloat(player.statsValue),
										0
									) / getTopPerformers().length || 0
								).toFixed(1)}
							</p>
						</div>
					</div>
				</div>

				<div className="card">
					<div className="flex items-center">
						<div className="flex-shrink-0">
							<TrendingUp className="h-8 w-8 text-purple-600" />
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-500">
								Active Players
							</p>
							<p className="text-2xl font-semibold text-gray-900">
								{getFilteredPlayers().filter((p) => p.teamId).length}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Top Performers */}
			<div className="card">
				<h3 className="text-lg font-medium text-gray-900 mb-4">
					Top Performers
				</h3>
				<div className="space-y-3">
					{getTopPerformers().map((player, index) => (
						<div
							key={player.id}
							className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
						>
							<div className="flex items-center space-x-3">
								<div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm font-medium text-primary-600">
									{index + 1}
								</div>
								<div>
									<p className="font-medium text-gray-900">{player.gamertag}</p>
									<p className="text-sm text-gray-500">{player.realName}</p>
								</div>
							</div>
							<div className="flex items-center space-x-3">
								<span
									className={`px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(
										player.position
									)}`}
								>
									{player.position}
								</span>
								<span className="text-lg font-semibold text-primary-600">
									{player.statsValue}
								</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default PlayerStats;
