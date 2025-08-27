import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
	Calendar,
	Clock,
	MapPin,
	Users,
	Trophy,
	Plus,
	Edit,
	Trash2,
	CheckCircle,
} from "lucide-react";
import axios from "axios";
import { API_ENDPOINTS } from "../../utils/api";

const Fixtures = () => {
	const { user, isTeamAdmin, isLeagueAdmin } = useAuth();
	const [fixtures, setFixtures] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedSeason, setSelectedSeason] = useState("all");
	const [selectedTeam, setSelectedTeam] = useState("all");
	const [dateRange, setDateRange] = useState("7");
	const [teams, setTeams] = useState([]);
	const [seasons, setSeasons] = useState([]);

	useEffect(() => {
		fetchFixtures();
		fetchTeams();
		fetchSeasons();
	}, [selectedSeason, selectedTeam, dateRange]);

	const fetchFixtures = async () => {
		try {
			let url = API_ENDPOINTS.MATCHES;
			const params = new URLSearchParams();

			if (selectedSeason !== "all") params.append("season", selectedSeason);
			if (selectedTeam !== "all") params.append("team", selectedTeam);
			if (dateRange !== "all") params.append("days", dateRange);

			if (params.toString()) {
				url += `?${params.toString()}`;
			}

			console.log("🔍 Fetching fixtures from:", url);
			const response = await axios.get(url);
			console.log("✅ Fixtures response:", response.data);
			setFixtures(response.data.data || []);
		} catch (error) {
			console.error("❌ Error fetching fixtures:", error);
			console.error("❌ Error details:", error.response?.data || error.message);
			setFixtures([]);
		} finally {
			setLoading(false);
		}
	};

	const fetchTeams = async () => {
		try {
			console.log("🔍 Fetching teams from:", API_ENDPOINTS.TEAMS);
			const response = await axios.get(API_ENDPOINTS.TEAMS);
			console.log("✅ Teams response:", response.data);
			setTeams(response.data.data || []);
		} catch (error) {
			console.error("❌ Error fetching teams:", error);
			console.error("❌ Error details:", error.response?.data || error.message);
			setTeams([]);
		}
	};

	const fetchSeasons = async () => {
		try {
			console.log("🔍 Fetching seasons from:", API_ENDPOINTS.SEASONS);
			const response = await axios.get(API_ENDPOINTS.SEASONS);
			console.log("✅ Seasons response:", response.data);
			setSeasons(response.data.data || []);
		} catch (error) {
			console.error("❌ Error fetching seasons:", error);
			console.error("❌ Error details:", error.response?.data || error.message);
			setSeasons([]);
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "COMPLETED":
				return "text-green-600";
			case "SCHEDULED":
				return "text-blue-600";
			case "CANCELLED":
				return "text-red-600";
			default:
				return "text-gray-600";
		}
	};

	const getCompetitionIcon = (type) => {
		switch (type) {
			case "LEAGUE":
				return <Trophy className="h-4 w-4" />;
			case "CUP":
				return <Trophy className="h-4 w-4" />;
			case "FRIENDLY":
				return <Users className="h-4 w-4" />;
			default:
				return <Calendar className="h-4 w-4" />;
		}
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
		});
	};

	const formatTime = (dateString) => {
		return new Date(dateString).toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Debug logging
	console.log("🔍 Fixtures component state:", {
		loading,
		fixturesCount: fixtures.length,
		teamsCount: teams.length,
		seasonsCount: seasons.length,
		selectedSeason,
		selectedTeam,
		dateRange,
	});

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
						Fixtures & Results
					</h2>
					<p className="mt-1 text-sm text-gray-500">
						Manage match schedules and view results
					</p>
				</div>
				{isTeamAdmin() && (
					<button className="btn-primary mt-4 sm:mt-0">
						<Plus className="h-4 w-4 mr-2" />
						Add Match
					</button>
				)}
			</div>

			{/* Filters */}
			<div className="card">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Season
						</label>
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
							Date Range
						</label>
						<select
							value={dateRange}
							onChange={(e) => setDateRange(e.target.value)}
							className="input-field"
						>
							<option value="7">Next 7 days</option>
							<option value="30">Next 30 days</option>
							<option value="90">Next 90 days</option>
							<option value="all">All dates</option>
						</select>
					</div>
				</div>
			</div>

			{/* Fixtures List */}
			<div className="card">
				{fixtures.length === 0 ? (
					<div className="text-center py-12">
						<Calendar className="mx-auto h-12 w-12 text-gray-400" />
						<h3 className="mt-2 text-sm font-medium text-gray-900">
							No fixtures found
						</h3>
						<p className="mt-1 text-sm text-gray-500">
							Get started by creating a new fixture.
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{fixtures.map((fixture) => (
							<div
								key={fixture.id}
								className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-4">
										<div className="text-center">
											<div className="font-semibold text-lg">
												{fixture.homeScore}
											</div>
											<div className="text-sm text-gray-500">
												{fixture.homeTeam?.name}
											</div>
										</div>

										<div className="text-center text-gray-400">
											<div className="text-sm">vs</div>
										</div>

										<div className="text-center">
											<div className="font-semibold text-lg">
												{fixture.awayScore}
											</div>
											<div className="text-sm text-gray-500">
												{fixture.awayTeam?.name}
											</div>
										</div>
									</div>

									<div className="text-right">
										<div className="flex items-center space-x-2 text-sm text-gray-500">
											<Calendar className="h-4 w-4" />
											<span>{formatDate(fixture.date)}</span>
										</div>
										<div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
											<Clock className="h-4 w-4" />
											<span>{formatTime(fixture.date)}</span>
										</div>
										<div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
											{getCompetitionIcon(fixture.competitionType)}
											<span className="capitalize">
												{fixture.competitionType.toLowerCase()}
											</span>
										</div>
									</div>
								</div>

								{isTeamAdmin() && (
									<div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
										<button className="btn-secondary">
											<Edit className="h-4 w-4 mr-2" />
											Edit
										</button>
										<button className="btn-danger">
											<Trash2 className="h-4 w-4 mr-2" />
											Delete
										</button>
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default Fixtures;
