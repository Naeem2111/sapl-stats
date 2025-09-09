import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
	User,
	Users,
	MapPin,
	Calendar,
	Eye,
	Search,
	Filter,
	BarChart3,
	Building,
} from "lucide-react";
import api from "../../utils/api";

const Players = () => {
	const { user, isTeamAdmin, isLeagueAdmin } = useAuth();
	const [players, setPlayers] = useState([]);
	const [teams, setTeams] = useState([]);
	const [leagues, setLeagues] = useState([]);
	const [seasons, setSeasons] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedLeague, setSelectedLeague] = useState("all");
	const [selectedTeam, setSelectedTeam] = useState("all");
	const [selectedSeason, setSelectedSeason] = useState("all");
	const [selectedPosition, setSelectedPosition] = useState("all");

	useEffect(() => {
		fetchData();
	}, []);

	useEffect(() => {
		// Reset team selection when league changes
		if (selectedLeague !== "all") {
			setSelectedTeam("all");
		}
	}, [selectedLeague]);

	const fetchData = async () => {
		try {
			setLoading(true);
			const [playersRes, teamsRes, leaguesRes, seasonsRes] = await Promise.all([
				api.get("/players"),
				api.get("/stats/teams"),
				api.get("/stats/leagues"),
				api.get("/seasons"),
			]);

			setPlayers(playersRes.data.data || []);
			setTeams(teamsRes.data.data || []);
			setLeagues(leaguesRes.data.data || []);
			setSeasons(seasonsRes.data.data || []);
		} catch (error) {
			console.error("Error fetching data:", error);
		} finally {
			setLoading(false);
		}
	};

	const getFilteredTeams = () => {
		if (selectedLeague === "all") return teams;
		return teams.filter((team) => team.leagueId === selectedLeague);
	};

	const filteredPlayers = players.filter((player) => {
		const matchesSearch =
			player.gamertag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			player.realName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			player.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			player.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			`${player.firstName || ""} ${player.lastName || ""}`
				.toLowerCase()
				.includes(searchTerm.toLowerCase());

		const matchesTeam =
			selectedTeam === "all" ||
			player.teamId === selectedTeam ||
			(selectedTeam === "unassigned" && !player.teamId);

		const matchesPosition =
			selectedPosition === "all" || player.position === selectedPosition;

		// Filter by league through team
		const matchesLeague =
			selectedLeague === "all" ||
			(player.team && player.team.leagueId === selectedLeague);

		return matchesSearch && matchesTeam && matchesPosition && matchesLeague;
	});

	const getPositionColor = (position) => {
		const colors = {
			GK: "bg-red-100 text-red-800",
			CB: "bg-blue-100 text-blue-800",
			LB: "bg-blue-100 text-blue-800",
			RB: "bg-blue-100 text-blue-800",
			CDM: "bg-green-100 text-green-800",
			CM: "bg-green-100 text-green-800",
			CAM: "bg-green-100 text-green-800",
			LM: "bg-yellow-100 text-yellow-800",
			RM: "bg-yellow-100 text-yellow-800",
			LW: "bg-yellow-100 text-yellow-800",
			RW: "bg-yellow-100 text-yellow-800",
			ST: "bg-purple-100 text-purple-800",
			CF: "bg-purple-100 text-purple-800",
		};
		return colors[position] || "bg-gray-100 text-gray-800";
	};

	const getLeagueColor = (leagueName) => {
		const colors = {
			"SL Prem": "bg-yellow-100 text-yellow-800",
			"SL Champs": "bg-blue-100 text-blue-800",
			"Super League 1 West": "bg-green-100 text-green-800",
			"Super League 1 East": "bg-green-100 text-green-800",
			"Super League Conference": "bg-purple-100 text-purple-800",
			Premiership: "bg-red-100 text-red-800",
			Championship: "bg-indigo-100 text-indigo-800",
		};
		return colors[leagueName] || "bg-gray-100 text-gray-800";
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
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
					<h2 className="text-2xl font-bold text-gray-900">Players</h2>
					<p className="mt-1 text-sm text-gray-500">
						View and manage all players across all leagues
					</p>
				</div>
				<div className="mt-4 sm:mt-0">
					<Link to="/dashboard/player-stats" className="btn btn-primary">
						<BarChart3 className="h-4 w-4 mr-2" />
						View Stats
					</Link>
				</div>
			</div>

			{/* Enhanced Filters */}
			<div className="card">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
					{/* Search */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
						<input
							type="text"
							placeholder="Search players..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="input-field pl-10"
						/>
					</div>

					{/* League Filter */}
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

					{/* Team Filter */}
					<select
						value={selectedTeam}
						onChange={(e) => setSelectedTeam(e.target.value)}
						className="input-field"
						disabled={getFilteredTeams().length === 0}
					>
						<option value="all">All Teams</option>
						<option value="unassigned">Unassigned Players</option>
						{getFilteredTeams().map((team) => (
							<option key={team.id} value={team.id}>
								{team.name} ({team.playerCount || 0} players)
							</option>
						))}
					</select>

					{/* Position Filter */}
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

					{/* Season Filter */}
					<select
						value={selectedSeason}
						onChange={(e) => setSelectedSeason(e.target.value)}
						className="input-field"
					>
						<option value="all">All Seasons</option>
						{seasons.map((season) => (
							<option key={season.id} value={season.id}>
								{season.name}
							</option>
						))}
					</select>
				</div>

				{/* Filter Summary */}
				<div className="mt-4 pt-4 border-t border-gray-200">
					<div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
						<span className="font-medium">Active Filters:</span>
						{selectedLeague !== "all" && (
							<span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
								<Building className="h-3 w-3 mr-1" />
								{leagues.find((l) => l.id === selectedLeague)?.name}
							</span>
						)}
						{selectedTeam !== "all" && (
							<span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
								<Building className="h-3 w-3 mr-1" />
								{teams.find((t) => t.id === selectedTeam)?.name}
							</span>
						)}
						{selectedPosition !== "all" && (
							<span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs">
								{selectedPosition}
							</span>
						)}
						{searchTerm && (
							<span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">
								<Search className="h-3 w-3 mr-1" />"{searchTerm}"
							</span>
						)}
					</div>
				</div>
			</div>

			{/* Players Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{filteredPlayers.map((player) => (
					<div
						key={player.id}
						className="card hover:shadow-lg transition-shadow"
					>
						<div className="text-center">
							{/* Player Avatar */}
							<div className="w-20 h-20 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
								<User className="w-10 h-10 text-gray-400" />
							</div>

							{/* Player Name */}
							<h3 className="text-lg font-semibold text-gray-900 mb-1">
								{player.gamertag}
							</h3>
							{player.realName && (
								<p className="text-sm text-gray-500 mb-2">{player.realName}</p>
							)}

							{/* Position Badge */}
							<div className="mb-3">
								<span
									className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPositionColor(
										player.position
									)}`}
								>
									{player.position}
								</span>
							</div>

							{/* Team Info */}
							{player.team ? (
								<div className="space-y-2 mb-3">
									<div className="flex items-center justify-center text-sm text-gray-600">
										<Users className="h-4 w-4 mr-2" />
										<span>{player.team.name}</span>
									</div>
									{/* League Badge */}
									{player.team.league && (
										<span
											className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLeagueColor(
												player.team.league.name
											)}`}
										>
											<Building className="h-3 w-3 mr-1" />
											{player.team.league.name}
										</span>
									)}
								</div>
							) : (
								<div className="text-sm text-gray-400 mb-3">Free Agent</div>
							)}

							{/* Join Date */}
							<div className="flex items-center justify-center text-xs text-gray-500 mb-4">
								<Calendar className="h-3 w-3 mr-1" />
								<span>Joined {formatDate(player.createdAt)}</span>
							</div>

							{/* View Profile Button */}
							<Link
								to={`/dashboard/player/${player.id}`}
								className="btn btn-outline btn-sm w-full"
							>
								<Eye className="h-4 w-4 mr-2" />
								View Profile
							</Link>
						</div>
					</div>
				))}
			</div>

			{/* No Results */}
			{filteredPlayers.length === 0 && (
				<div className="text-center py-12">
					<User className="mx-auto h-12 w-12 text-gray-400" />
					<h3 className="mt-2 text-sm font-medium text-gray-900">
						No players found
					</h3>
					<p className="mt-1 text-sm text-gray-500">
						Try adjusting your search criteria or filters.
					</p>
					{/* Show current filter state */}
					<div className="mt-4 text-xs text-gray-400">
						{selectedLeague !== "all" && (
							<p>
								League: {leagues.find((l) => l.id === selectedLeague)?.name}
							</p>
						)}
						{selectedTeam !== "all" && (
							<p>Team: {teams.find((t) => t.id === selectedTeam)?.name}</p>
						)}
						{selectedPosition !== "all" && <p>Position: {selectedPosition}</p>}
						{searchTerm && <p>Search: "{searchTerm}"</p>}
					</div>
				</div>
			)}

			{/* Results Count and Summary */}
			<div className="text-center space-y-2">
				<div className="text-sm text-gray-500">
					Showing {filteredPlayers.length} of {players.length} players
				</div>
				{/* League Distribution */}
				{selectedLeague === "all" && (
					<div className="flex flex-wrap justify-center gap-2">
						{leagues.map((league) => {
							const leaguePlayerCount = players.filter(
								(p) => p.team && p.team.leagueId === league.id
							).length;
							if (leaguePlayerCount === 0) return null;

							return (
								<span
									key={league.id}
									className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLeagueColor(
										league.name
									)}`}
								>
									<Building className="h-3 w-3 mr-1" />
									{league.name}: {leaguePlayerCount}
								</span>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};

export default Players;
