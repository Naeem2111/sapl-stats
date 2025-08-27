import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
	Trophy,
	TrendingUp,
	Users,
	Target,
	BarChart3,
	Medal,
} from "lucide-react";
import axios from "axios";
import { API_ENDPOINTS } from "../../utils/api";

const LeagueStats = () => {
	const { user, isLeagueAdmin } = useAuth();
	const [teams, setTeams] = useState([]);
	const [matches, setMatches] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedSeason, setSelectedSeason] = useState("all");
	const [seasons, setSeasons] = useState([]);

	useEffect(() => {
		if (isLeagueAdmin()) {
			fetchTeams();
			fetchMatches();
			fetchSeasons();
		}
	}, [selectedSeason, isLeagueAdmin]);

	const fetchTeams = async () => {
		try {
			const response = await axios.get(API_ENDPOINTS.TEAMS);
			setTeams(response.data.data || []);
		} catch (error) {
			console.error("Error fetching teams:", error);
			setTeams([]);
		}
	};

	const fetchMatches = async () => {
		try {
			const response = await axios.get(API_ENDPOINTS.MATCHES);
			setMatches(response.data.data || []);
		} catch (error) {
			console.error("Error fetching matches:", error);
			setMatches([]);
		} finally {
			setLoading(false);
		}
	};

	const fetchSeasons = async () => {
		try {
			const response = await axios.get(API_ENDPOINTS.SEASONS);
			setSeasons(response.data.data || []);
		} catch (error) {
			console.error("Error fetching seasons:", error);
			setSeasons([]);
		}
	};

	const getTeamStats = (teamId) => {
		const teamMatches = matches.filter(
			(match) => match.homeTeamId === teamId || match.awayTeamId === teamId
		);

		let points = 0;
		let goalsFor = 0;
		let goalsAgainst = 0;
		let wins = 0;
		let draws = 0;
		let losses = 0;

		teamMatches.forEach((match) => {
			if (match.homeTeamId === teamId) {
				goalsFor += match.homeScore || 0;
				goalsAgainst += match.awayScore || 0;

				if (match.homeScore > match.awayScore) {
					wins++;
					points += 3;
				} else if (match.homeScore === match.awayScore) {
					draws++;
					points += 1;
				} else {
					losses++;
				}
			} else {
				goalsFor += match.awayScore || 0;
				goalsAgainst += match.homeScore || 0;

				if (match.awayScore > match.homeScore) {
					wins++;
					points += 3;
				} else if (match.awayScore === match.homeScore) {
					draws++;
					points += 1;
				} else {
					losses++;
				}
			}
		});

		return {
			points,
			goalsFor,
			goalsAgainst,
			goalDifference: goalsFor - goalsAgainst,
			wins,
			draws,
			losses,
			played: wins + draws + losses,
		};
	};

	const getLeagueTable = () => {
		return teams
			.map((team) => ({
				...team,
				...getTeamStats(team.id),
			}))
			.sort((a, b) => {
				if (b.points !== a.points) return b.points - a.points;
				if (b.goalDifference !== a.goalDifference)
					return b.goalDifference - a.goalDifference;
				return b.goalsFor - a.goalsFor;
			});
	};

	const getTopScorers = () => {
		// Mock data for demonstration - replace with real API data
		return [
			{ name: "DragonSlayer", team: "Red Dragons", goals: 15, assists: 8 },
			{ name: "LionHeart", team: "Blue Lions", goals: 12, assists: 10 },
			{ name: "EagleEye", team: "Green Eagles", goals: 10, assists: 6 },
			{ name: "SwiftStriker", team: "Blue Lions", goals: 9, assists: 7 },
		];
	};

	if (!isLeagueAdmin()) {
		return (
			<div className="text-center py-12">
				<Trophy className="mx-auto h-12 w-12 text-gray-400" />
				<h3 className="mt-2 text-sm font-medium text-gray-900">
					Access Restricted
				</h3>
				<p className="mt-1 text-sm text-gray-500">
					League statistics are only available to League Administrators and
					above.
				</p>
			</div>
		);
	}

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
						League Statistics
					</h2>
					<p className="mt-1 text-sm text-gray-500">
						Comprehensive league overview and standings
					</p>
				</div>
			</div>

			{/* Season Filter */}
			<div className="card">
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Season
				</label>
				<select
					value={selectedSeason}
					onChange={(e) => setSelectedSeason(e.target.value)}
					className="input-field max-w-xs"
				>
					<option value="all">All Seasons</option>
					{seasons.map((season) => (
						<option key={season.id} value={season.id}>
							{season.name}
						</option>
					))}
				</select>
			</div>

			{/* League Overview Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<div className="card">
					<div className="flex items-center">
						<div className="flex-shrink-0">
							<Users className="h-8 w-8 text-primary-600" />
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-500">Total Teams</p>
							<p className="text-2xl font-semibold text-gray-900">
								{teams.length}
							</p>
						</div>
					</div>
				</div>

				<div className="card">
					<div className="flex items-center">
						<div className="flex-shrink-0">
							<Trophy className="h-8 w-8 text-green-600" />
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-500">Total Matches</p>
							<p className="text-2xl font-semibold text-gray-900">
								{matches.length}
							</p>
						</div>
					</div>
				</div>

				<div className="card">
					<div className="flex items-center">
						<div className="flex-shrink-0">
							<Target className="h-8 w-8 text-blue-600" />
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-500">Total Goals</p>
							<p className="text-2xl font-semibold text-gray-900">
								{matches.reduce(
									(total, match) =>
										total + (match.homeScore || 0) + (match.awayScore || 0),
									0
								)}
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
							<p className="text-sm font-medium text-gray-500">Active Season</p>
							<p className="text-lg font-semibold text-gray-900">
								{seasons.find((s) => s.isActive)?.name || "N/A"}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* League Table */}
			<div className="card">
				<h3 className="text-lg font-medium text-gray-900 mb-4">League Table</h3>
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Pos
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Team
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									P
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									W
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									D
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									L
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									GF
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									GA
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									GD
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Pts
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{getLeagueTable().map((team, index) => (
								<tr key={team.id} className="hover:bg-gray-50">
									<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
										{index + 1}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
										{team.name}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{team.played}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{team.wins}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{team.draws}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{team.losses}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{team.goalsFor}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{team.goalsAgainst}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{team.goalDifference}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">
										{team.points}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Top Scorers */}
			<div className="card">
				<h3 className="text-lg font-medium text-gray-900 mb-4">Top Scorers</h3>
				<div className="space-y-3">
					{getTopScorers().map((scorer, index) => (
						<div
							key={index}
							className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
						>
							<div className="flex items-center space-x-3">
								<div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm font-medium text-primary-600">
									{index + 1}
								</div>
								<div>
									<p className="font-medium text-gray-900">{scorer.name}</p>
									<p className="text-sm text-gray-500">{scorer.team}</p>
								</div>
							</div>
							<div className="flex items-center space-x-4">
								<div className="text-right">
									<p className="text-sm text-gray-500">Assists</p>
									<p className="text-lg font-semibold text-blue-600">
										{scorer.assists}
									</p>
								</div>
								<div className="text-right">
									<p className="text-sm text-gray-500">Goals</p>
									<p className="text-lg font-semibold text-primary-600">
										{scorer.goals}
									</p>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default LeagueStats;
