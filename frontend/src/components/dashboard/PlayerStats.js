import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
	BarChart3,
	TrendingUp,
	Target,
	Award,
	Filter,
	Calendar,
	Users,
	Trophy,
	Star,
	Clock,
} from "lucide-react";
import api from "../../utils/api";

const PlayerStats = () => {
	const { user, isTeamAdmin, isLeagueAdmin } = useAuth();

	// State for data
	const [players, setPlayers] = useState([]);
	const [teams, setTeams] = useState([]);
	const [leagues, setLeagues] = useState([]);
	const [topPerformers, setTopPerformers] = useState([]);

	// State for filters
	const [selectedLeague, setSelectedLeague] = useState("all");
	const [selectedTeam, setSelectedTeam] = useState("all");
	const [selectedPosition, setSelectedPosition] = useState("All Positions");
	const [statsType, setStatsType] = useState("goals");

	// State for date filtering
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [useDateFilter, setUseDateFilter] = useState(false);

	// Loading states
	const [loading, setLoading] = useState(true);
	const [loadingStats, setLoadingStats] = useState(false);

	// Summary statistics
	const [summaryStats, setSummaryStats] = useState({
		totalPlayers: 0,
		topPerformer: "N/A",
		averageRating: 0.0,
		activePlayers: 0,
	});

	useEffect(() => {
		fetchInitialData();
	}, []);

	useEffect(() => {
		if (useDateFilter && startDate && endDate) {
			fetchPlayerStats();
		} else if (!useDateFilter) {
			fetchPlayerStats();
		}
	}, [
		selectedLeague,
		selectedTeam,
		selectedPosition,
		statsType,
		useDateFilter,
		startDate,
		endDate,
	]);

	const fetchInitialData = async () => {
		setLoading(true);
		try {
			// Fetch leagues, teams, and players in parallel
			const [leaguesRes, teamsRes, playersRes, summaryRes] = await Promise.all([
				api.get("/stats/leagues"),
				api.get("/stats/teams"),
				api.get("/stats/players"),
				api.get("/stats/summary"),
			]);

			setLeagues(leaguesRes.data.data || []);
			setTeams(teamsRes.data.data || []);
			setPlayers(playersRes.data.data?.players || []);
			setSummaryStats(
				summaryRes.data.data || {
					totalPlayers: 0,
					topPerformer: "N/A",
					averageRating: 0.0,
					activePlayers: 0,
				}
			);
		} catch (error) {
			console.error("Error fetching initial data:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchPlayerStats = async () => {
		setLoadingStats(true);
		try {
			const params = new URLSearchParams({
				leagueId: selectedLeague,
				teamId: selectedTeam,
				position: selectedPosition,
				statType: statsType,
			});

			if (useDateFilter && startDate && endDate) {
				params.append("startDate", startDate);
				params.append("endDate", endDate);
			}

			const response = await api.get(`/stats/players?${params}`);
			setPlayers(response.data.data?.players || []);

			// Fetch top performers with the same filters
			const topPerformersRes = await api.get(`/stats/top-performers?${params}`);
			setTopPerformers(topPerformersRes.data.data?.topPerformers || []);

			// Update summary stats
			const summaryRes = await api.get(`/stats/summary?${params}`);
			setSummaryStats(
				summaryRes.data.data || {
					totalPlayers: 0,
					topPerformer: "N/A",
					averageRating: 0.0,
					activePlayers: 0,
				}
			);
		} catch (error) {
			console.error("Error fetching player stats:", error);
		} finally {
			setLoadingStats(false);
		}
	};

	const getFilteredTeams = () => {
		if (selectedLeague === "all") return teams;
		return teams.filter((team) => team.leagueId === selectedLeague);
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

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString();
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
						Analyze individual player performance and statistics with
						league-based filtering
					</p>
				</div>
			</div>

			{/* Enhanced Filters */}
			<div className="card">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{/* League Filter */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							League
						</label>
						<select
							value={selectedLeague}
							onChange={(e) => setSelectedLeague(e.target.value)}
							className="input-field"
						>
							<option value="all">All Leagues</option>
							{leagues.map((league) => (
								<option key={league.id} value={league.id}>
									{league.name} ({league.teamCount || 0} teams)
								</option>
							))}
						</select>
					</div>

					{/* Team Filter */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Team
						</label>
						<select
							value={selectedTeam}
							onChange={(e) => setSelectedTeam(e.target.value)}
							className="input-field"
							disabled={getFilteredTeams().length === 0}
						>
							<option value="all">All Teams</option>
							{getFilteredTeams().map((team) => (
								<option key={team.id} value={team.id}>
									{team.name} ({team.playerCount || 0} players)
								</option>
							))}
						</select>
					</div>

					{/* Position Filter */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Position
						</label>
						<select
							value={selectedPosition}
							onChange={(e) => setSelectedPosition(e.target.value)}
							className="input-field"
						>
							<option value="All Positions">All Positions</option>
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

					{/* Stat Type Filter */}
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
							<option value="shots">Shots</option>
							<option value="passes">Passes</option>
							<option value="tackles">Tackles</option>
							<option value="saves">Saves</option>
							<option value="cleanSheets">Clean Sheets</option>
							<option value="possessionLost">Possession Lost</option>
							<option value="possessionWon">Possession Won</option>
							<option value="manOfTheMatch">Man of the Match</option>
							<option value="tackleSuccessRate">Tackle Success Rate</option>
							<option value="savesSuccessRate">Saves Success Rate</option>
							<option value="goalsConceded">Goals Conceded</option>
							<option value="xG">Expected Goals (xG)</option>
							<option value="duelSuccess">Duel Success Rate</option>
							<option value="playersBeatenByPass">
								Players Beaten by Pass
							</option>
							<option value="xA">Expected Assists (xA)</option>
							<option value="tacklesAttempted">Tackles Attempted</option>
						</select>
					</div>
				</div>

				{/* Date Range Inputs */}
				<div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Date Filter
						</label>
						<div className="flex items-center space-x-2">
							<input
								type="checkbox"
								checked={useDateFilter}
								onChange={(e) => setUseDateFilter(e.target.checked)}
								className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
							/>
							<span className="text-sm text-gray-600">
								Enable date filtering
							</span>
						</div>
					</div>

					{useDateFilter && (
						<>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Start Date
								</label>
								<input
									type="date"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
									className="input-field"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									End Date
								</label>
								<input
									type="date"
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
									className="input-field"
								/>
							</div>
						</>
					)}
				</div>
			</div>

			{/* Stats Overview */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<div className="card">
					<div className="flex items-center">
						<div className="flex-shrink-0">
							<Users className="h-8 w-8 text-primary-600" />
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-500">Total Players</p>
							<p className="text-2xl font-semibold text-gray-900">
								{summaryStats.totalPlayers}
							</p>
						</div>
					</div>
				</div>

				<div className="card">
					<div className="flex items-center">
						<div className="flex-shrink-0">
							<Star className="h-8 w-8 text-green-600" />
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-500">Top Performer</p>
							<p className="text-lg font-semibold text-gray-900">
								{typeof summaryStats.topPerformer === "object"
									? summaryStats.topPerformer.name
									: summaryStats.topPerformer}
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
								{summaryStats.averageRating}
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
								{summaryStats.activePlayers}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Top Performers */}
			<div className="card">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-medium text-gray-900">
						Top Performers -{" "}
						{statsType.charAt(0).toUpperCase() + statsType.slice(1)}
					</h3>
					{useDateFilter && startDate && endDate && (
						<div className="text-sm text-gray-500 flex items-center space-x-1">
							<Calendar className="h-4 w-4" />
							<span>
								{formatDate(startDate)} - {formatDate(endDate)}
							</span>
						</div>
					)}
				</div>

				{loadingStats ? (
					<div className="flex items-center justify-center h-32">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
					</div>
				) : (
					<div className="space-y-3">
						{topPerformers.length > 0 ? (
							topPerformers.map((player, index) => (
								<div
									key={player.player.id}
									className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
								>
									<div className="flex items-center space-x-3">
										<div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm font-medium text-primary-600">
											{index + 1}
										</div>
										<div>
											<p className="font-medium text-gray-900">
												{player.player.gamertag}
											</p>
											<p className="text-sm text-gray-500">
												{player.player.realName}
											</p>
											{player.player.team && (
												<p className="text-xs text-gray-400">
													{player.player.team.name}
													{player.player.team.league && (
														<span className="ml-1 text-primary-600">
															• {player.player.team.league.name}
														</span>
													)}
												</p>
											)}
										</div>
									</div>
									<div className="flex items-center space-x-3">
										<span
											className={`px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(
												player.player.position
											)}`}
										>
											{player.player.position}
										</span>
										<span className="text-lg font-semibold text-primary-600">
											{player.statValue}
										</span>
									</div>
								</div>
							))
						) : (
							<div className="text-center py-8 text-gray-500">
								<Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
								<p>No players found with the current filters</p>
								<p className="text-sm">Try adjusting your selection criteria</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default PlayerStats;
