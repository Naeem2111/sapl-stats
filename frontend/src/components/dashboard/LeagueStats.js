import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
	Trophy,
	TrendingUp,
	Users,
	Target,
	BarChart3,
	Medal,
	Calendar,
	ChevronRight,
} from "lucide-react";
import api from "../../utils/api";

const LeagueStats = () => {
	const { user, isLeagueAdmin } = useAuth();
	const [teams, setTeams] = useState([]);
	const [matches, setMatches] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedSeason, setSelectedSeason] = useState("");
	const [seasons, setSeasons] = useState([]);
	const [competitions, setCompetitions] = useState([]);
	const [selectedCompetition, setSelectedCompetition] = useState("");
	const [competitionType, setCompetitionType] = useState(""); // "cup" or "league"
	const [competitionData, setCompetitionData] = useState(null);
	const [step, setStep] = useState(1); // 1: Select Season, 2: Select Competition, 3: View Stats

	useEffect(() => {
		if (isLeagueAdmin()) {
			fetchSeasons();
		}
	}, [isLeagueAdmin, user]);

	useEffect(() => {
		if (selectedSeason && selectedSeason !== "") {
			fetchCompetitions();
		}
	}, [selectedSeason]);

	useEffect(() => {
		if (selectedCompetition && selectedCompetition !== "") {
			fetchCompetitionData();
		}
	}, [selectedCompetition, competitionType]);

	const fetchTeams = async () => {
		try {
			const response = await api.get("/teams");
			setTeams(response.data.data || []);
		} catch (error) {
			console.error("Error fetching teams:", error);
			setTeams([]);
		}
	};

	const fetchMatches = async () => {
		try {
			const response = await api.get("/matches");
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
			const response = await api.get("/seasons");
			setSeasons(response.data.data || []);
		} catch (error) {
			console.error("Error fetching seasons:", error);
			setSeasons([]);
		}
	};

	const fetchCompetitions = async () => {
		try {
			setLoading(true);
			const [cupsResponse, leaguesResponse] = await Promise.all([
				api.get(`/cups?season=${selectedSeason}`),
				api.get(`/leagues?season=${selectedSeason}`),
			]);

			const cups = cupsResponse.data.data || [];
			const leagues = leaguesResponse.data.data || [];

			// Combine and format competitions
			const allCompetitions = [
				...cups.map((cup) => ({ ...cup, type: "cup", name: cup.name })),
				...leagues.map((league) => ({
					...league,
					type: "league",
					name: league.name,
				})),
			];

			setCompetitions(allCompetitions);
		} catch (error) {
			console.error("Error fetching competitions:", error);
			setCompetitions([]);
		} finally {
			setLoading(false);
		}
	};

	const fetchCompetitionData = async () => {
		try {
			setLoading(true);
			let response;

			if (competitionType === "cup") {
				response = await api.get(`/cups/${selectedCompetition}`);
			} else {
				response = await api.get(`/leagues/${selectedCompetition}`);
			}

			setCompetitionData(response.data.data);
			setStep(3);
		} catch (error) {
			console.error("Error fetching competition data:", error);
			setCompetitionData(null);
		} finally {
			setLoading(false);
		}
	};

	const handleSeasonSelect = (seasonId) => {
		setSelectedSeason(seasonId);
		setSelectedCompetition("");
		setCompetitionType("");
		setCompetitionData(null);
		setStep(2);
	};

	const handleCompetitionSelect = (competitionId, type) => {
		setSelectedCompetition(competitionId);
		setCompetitionType(type);
	};

	const handleBackToSeasons = () => {
		setSelectedSeason("");
		setSelectedCompetition("");
		setCompetitionType("");
		setCompetitionData(null);
		setCompetitions([]);
		setStep(1);
	};

	const handleBackToCompetitions = () => {
		setSelectedCompetition("");
		setCompetitionType("");
		setCompetitionData(null);
		setStep(2);
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

	// Step 1: Select Season
	if (step === 1) {
		return (
			<div className="space-y-6">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						League Statistics
					</h2>
					<p className="text-gray-500">
						Select a season to view competition statistics
					</p>
				</div>

				<div className="max-w-2xl mx-auto">
					<div className="card">
						<div className="flex items-center space-x-3 mb-4">
							<Calendar className="h-6 w-6 text-primary-600" />
							<h3 className="text-lg font-semibold">Choose Season</h3>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{seasons.map((season) => (
								<button
									key={season.id}
									onClick={() => handleSeasonSelect(season.id)}
									className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
								>
									<div className="flex items-center justify-between">
										<div>
											<h4 className="font-medium text-gray-900">
												{season.name}
											</h4>
											<p className="text-sm text-gray-500">
												{new Date(season.startDate).toLocaleDateString()} -{" "}
												{new Date(season.endDate).toLocaleDateString()}
											</p>
										</div>
										<ChevronRight className="h-5 w-5 text-gray-400" />
									</div>
								</button>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Step 2: Select Competition
	if (step === 2) {
		return (
			<div className="space-y-6">
				<div className="flex items-center space-x-4">
					<button
						onClick={handleBackToSeasons}
						className="text-gray-500 hover:text-gray-700"
					>
						← Back to Seasons
					</button>
					<div>
						<h2 className="text-2xl font-bold text-gray-900">
							{seasons.find((s) => s.id === selectedSeason)?.name} Competitions
						</h2>
						<p className="text-gray-500">
							Select a competition to view detailed statistics
						</p>
					</div>
				</div>

				<div className="max-w-4xl mx-auto">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{competitions.map((competition) => (
							<button
								key={`${competition.type}-${competition.id}`}
								onClick={() =>
									handleCompetitionSelect(competition.id, competition.type)
								}
								className="p-6 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-3">
										<div className="p-2 bg-primary-100 rounded-lg">
											{competition.type === "cup" ? (
												<Trophy className="h-6 w-6 text-primary-600" />
											) : (
												<BarChart3 className="h-6 w-6 text-primary-600" />
											)}
										</div>
										<div>
											<h4 className="font-medium text-gray-900">
												{competition.name}
											</h4>
											<p className="text-sm text-gray-500 capitalize">
												{competition.type} Competition
											</p>
											{competition.status && (
												<span
													className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
														competition.status === "ACTIVE"
															? "bg-green-100 text-green-800"
															: "bg-gray-100 text-gray-800"
													}`}
												>
													{competition.status}
												</span>
											)}
										</div>
									</div>
									<ChevronRight className="h-5 w-5 text-gray-400" />
								</div>
							</button>
						))}
					</div>

					{competitions.length === 0 && (
						<div className="text-center py-12">
							<Trophy className="mx-auto h-12 w-12 text-gray-400" />
							<h3 className="mt-2 text-sm font-medium text-gray-900">
								No Competitions Found
							</h3>
							<p className="mt-1 text-sm text-gray-500">
								No cups or leagues found for this season.
							</p>
						</div>
					)}
				</div>
			</div>
		);
	}

	// Step 3: View Competition Statistics
	if (step === 3 && competitionData) {
		return (
			<div className="space-y-6">
				<div className="flex items-center space-x-4">
					<button
						onClick={handleBackToCompetitions}
						className="text-gray-500 hover:text-gray-700"
					>
						← Back to Competitions
					</button>
					<div>
						<h2 className="text-2xl font-bold text-gray-900">
							{competitionData.name}
						</h2>
						<p className="text-gray-500 capitalize">
							{competitionType} Competition Statistics
						</p>
					</div>
				</div>

				{/* Competition Overview Stats */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
					<div className="card">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<Users className="h-8 w-8 text-primary-600" />
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-500">Teams</p>
								<p className="text-2xl font-semibold text-gray-900">
									{competitionData.entries?.length ||
										competitionData.teams?.length ||
										0}
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
								<p className="text-sm font-medium text-gray-500">Matches</p>
								<p className="text-2xl font-semibold text-gray-900">
									{competitionData.matches?.length || 0}
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
									{competitionData.matches?.reduce(
										(total, match) =>
											total + (match.homeScore || 0) + (match.awayScore || 0),
										0
									) || 0}
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
								<p className="text-sm font-medium text-gray-500">Status</p>
								<p className="text-lg font-semibold text-gray-900">
									{competitionData.status || "N/A"}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Competition Details */}
				<div className="card">
					<h3 className="text-lg font-medium text-gray-900 mb-4">
						Competition Details
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<h4 className="font-medium text-gray-700 mb-2">Description</h4>
							<p className="text-gray-600">
								{competitionData.description || "No description available"}
							</p>
						</div>
						<div>
							<h4 className="font-medium text-gray-700 mb-2">Format</h4>
							<p className="text-gray-600">{competitionData.format || "N/A"}</p>
						</div>
					</div>
				</div>

				{/* Matches Table */}
				{competitionData.matches && competitionData.matches.length > 0 && (
					<div className="card">
						<h3 className="text-lg font-medium text-gray-900 mb-4">
							Recent Matches
						</h3>
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Date
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Home Team
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Score
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Away Team
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Status
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{competitionData.matches.slice(0, 10).map((match) => (
										<tr key={match.id} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{new Date(match.date).toLocaleDateString()}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
												{match.homeTeam?.name || "TBD"}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{match.homeScore || 0} - {match.awayScore || 0}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
												{match.awayTeam?.name || "TBD"}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span
													className={`inline-block px-2 py-1 text-xs rounded-full ${
														match.status === "COMPLETED"
															? "bg-green-100 text-green-800"
															: match.status === "SCHEDULED"
															? "bg-blue-100 text-blue-800"
															: "bg-gray-100 text-gray-800"
													}`}
												>
													{match.status}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</div>
		);
	}

	return null;
};

export default LeagueStats;
