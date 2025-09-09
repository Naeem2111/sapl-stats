import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";
import {
	Calendar,
	Clock,
	Users,
	Trophy,
	Plus,
	Edit,
	Trash2,
	CheckCircle,
	Search,
	Filter,
	Eye,
	ArrowUpDown,
	CalendarDays,
	Zap,
	X,
} from "lucide-react";
import api from "../../utils/api";
import MatchFixtureEditor from "./MatchFixtureEditor";

const Fixtures = () => {
	const { isTeamAdmin, isLeagueAdmin } = useAuth();
	const [fixtures, setFixtures] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedSeason, setSelectedSeason] = useState("all");
	const [selectedTeam, setSelectedTeam] = useState("all");
	const [dateRange, setDateRange] = useState("7");
	const [teams, setTeams] = useState([]);
	const [seasons, setSeasons] = useState([]);
	const [competitions, setCompetitions] = useState([]);

	// Enhanced filtering states
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [competitionFilter, setCompetitionFilter] = useState("all");
	const [sortBy, setSortBy] = useState("date");
	const [sortOrder, setSortOrder] = useState("asc");
	const [showFilters, setShowFilters] = useState(false);
	const [viewMode, setViewMode] = useState("list"); // list, grid, calendar
	const [editingMatch, setEditingMatch] = useState(null);
	const [updatingResult, setUpdatingResult] = useState(null);
	const [savingResult, setSavingResult] = useState(false);
	const [resultForm, setResultForm] = useState({
		homeScore: "",
		awayScore: "",
		status: "COMPLETED",
	});

	const fetchFixtures = useCallback(async () => {
		try {
			let url = "/matches";
			const params = new URLSearchParams();

			if (selectedSeason !== "all") params.append("season", selectedSeason);
			if (selectedTeam !== "all") params.append("team", selectedTeam);
			if (dateRange !== "all") params.append("days", dateRange);

			if (params.toString()) {
				url += `?${params.toString()}`;
			}

			console.log("🔍 Fetching fixtures from:", url);
			const response = await api.get(url);
			console.log("✅ Fixtures response:", response.data);
			setFixtures(response.data.data || []);
		} catch (error) {
			console.error("❌ Error fetching fixtures:", error);
			console.error("❌ Error details:", error.response?.data || error.message);
			setFixtures([]);
		} finally {
			setLoading(false);
		}
	}, [selectedSeason, selectedTeam, dateRange]);

	const handleUpdateResult = async (matchId) => {
		try {
			setSavingResult(true);

			const response = await api.put(
				`/matches/${matchId}/scores`,
				{
					homeScore: parseInt(resultForm.homeScore),
					awayScore: parseInt(resultForm.awayScore),
					status: resultForm.status,
				},
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}
			);

			console.log("Update response:", response.data);

			if (response.data.success) {
				console.log("Update successful, refreshing fixtures...");
				// Refresh fixtures
				await fetchFixtures();
				// Reset form
				setResultForm({
					homeScore: "",
					awayScore: "",
					status: "COMPLETED",
				});
				setUpdatingResult(null);
				console.log("Fixtures refreshed, form reset");
			} else {
				console.error("Update failed:", response.data);
				alert("Failed to update match result");
			}
		} catch (error) {
			console.error("Error updating match result:", error);
			alert("Error updating match result. Please try again.");
		} finally {
			setSavingResult(false);
		}
	};

	const handleStartResultUpdate = (fixture) => {
		setUpdatingResult(fixture.id);
		setResultForm({
			homeScore: fixture.homeScore?.toString() || "",
			awayScore: fixture.awayScore?.toString() || "",
			status: "COMPLETED", // Always default to COMPLETED when updating results
		});
	};

	const handleCancelResultUpdate = () => {
		setUpdatingResult(null);
		setResultForm({
			homeScore: "",
			awayScore: "",
			status: "COMPLETED",
		});
	};

	useEffect(() => {
		fetchFixtures();
		fetchTeams();
		fetchSeasons();
		fetchCompetitions();
	}, [fetchFixtures]);

	const fetchTeams = async () => {
		try {
			console.log("🔍 Fetching teams from:", "/teams");
			const response = await api.get("/teams");
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
			console.log("🔍 Fetching seasons from:", "/seasons");
			const response = await api.get("/seasons");
			console.log("✅ Seasons response:", response.data);
			setSeasons(response.data.data || []);
		} catch (error) {
			console.error("❌ Error fetching seasons:", error);
			console.error("❌ Error details:", error.response?.data || error.message);
			setSeasons([]);
		}
	};

	const fetchCompetitions = async () => {
		try {
			console.log("🔍 Fetching competitions from:", "/cups");
			const response = await api.get("/cups");
			console.log("✅ Competitions response:", response.data);
			setCompetitions(response.data.data || []);
		} catch (error) {
			console.error("❌ Error fetching competitions:", error);
			console.error("❌ Error details:", error.response?.data || error.message);
			setCompetitions([]);
		}
	};

	// Enhanced filtering and sorting
	const filteredAndSortedFixtures = fixtures
		.filter((fixture) => {
			// Search filter
			if (searchTerm) {
				const searchLower = searchTerm.toLowerCase();
				const homeTeamName = fixture.homeTeam?.name?.toLowerCase() || "";
				const awayTeamName = fixture.awayTeam?.name?.toLowerCase() || "";
				const competitionType = fixture.competitionType?.toLowerCase() || "";

				if (
					!homeTeamName.includes(searchLower) &&
					!awayTeamName.includes(searchLower) &&
					!competitionType.includes(searchLower)
				) {
					return false;
				}
			}

			// Status filter
			if (statusFilter !== "all" && fixture.status !== statusFilter) {
				return false;
			}

			// Competition filter
			if (
				competitionFilter !== "all" &&
				fixture.competitionId !== competitionFilter
			) {
				return false;
			}

			return true;
		})
		.sort((a, b) => {
			let comparison = 0;

			switch (sortBy) {
				case "date":
					comparison = new Date(a.date) - new Date(b.date);
					break;
				case "homeTeam":
					comparison = (a.homeTeam?.name || "").localeCompare(
						b.homeTeam?.name || ""
					);
					break;
				case "awayTeam":
					comparison = (a.awayTeam?.name || "").localeCompare(
						b.awayTeam?.name || ""
					);
					break;
				case "competition":
					comparison = (a.competitionType || "").localeCompare(
						b.competitionType || ""
					);
					break;
				case "status":
					comparison = (a.status || "").localeCompare(b.status || "");
					break;
				default:
					comparison = 0;
			}

			return sortOrder === "asc" ? comparison : -comparison;
		});

	const getStatusColor = (status) => {
		switch (status) {
			case "COMPLETED":
				return "text-green-600 bg-green-50 border-green-200";
			case "SCHEDULED":
				return "text-blue-600 bg-blue-50 border-blue-200";
			case "IN_PROGRESS":
				return "text-orange-600 bg-orange-50 border-orange-200";
			case "CANCELLED":
				return "text-red-600 bg-red-50 border-red-200";
			case "POSTPONED":
				return "text-yellow-600 bg-yellow-50 border-yellow-200";
			default:
				return "text-gray-600 bg-gray-50 border-gray-200";
		}
	};

	const getStatusIcon = (status) => {
		switch (status) {
			case "COMPLETED":
				return <CheckCircle className="h-4 w-4" />;
			case "SCHEDULED":
				return <Calendar className="h-4 w-4" />;
			case "IN_PROGRESS":
				return <Zap className="h-4 w-4" />;
			case "CANCELLED":
				return <X className="h-4 w-4" />;
			case "POSTPONED":
				return <Clock className="h-4 w-4" />;
			default:
				return <Calendar className="h-4 w-4" />;
		}
	};

	const getCompetitionIcon = (type) => {
		switch (type) {
			case "LEAGUE":
				return <Trophy className="h-4 w-4 text-yellow-600" />;
			case "CUP":
				return <Trophy className="h-4 w-4 text-purple-600" />;
			case "FRIENDLY":
				return <Users className="h-4 w-4 text-blue-600" />;
			default:
				return <Calendar className="h-4 w-4 text-gray-600" />;
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

	const getScoreDisplay = (fixture) => {
		// Check if this fixture is being updated
		const isUpdating = updatingResult === fixture.id;

		if (isUpdating) {
			return (
				<div className="space-y-3">
					<div className="flex items-center space-x-4">
						<div className="text-center flex-1">
							<div className="text-sm text-gray-600 font-medium mb-1">
								{fixture.homeTeam?.name}
							</div>
							<input
								type="number"
								value={resultForm.homeScore}
								onChange={(e) =>
									setResultForm((prev) => ({
										...prev,
										homeScore: e.target.value,
									}))
								}
								className="w-16 text-center text-2xl font-bold border border-gray-300 rounded px-2 py-1"
								placeholder="0"
								min="0"
							/>
						</div>
						<div className="text-center text-gray-400">
							<div className="text-lg font-semibold">-</div>
						</div>
						<div className="text-center flex-1">
							<div className="text-sm text-gray-600 font-medium mb-1">
								{fixture.awayTeam?.name}
							</div>
							<input
								type="number"
								value={resultForm.awayScore}
								onChange={(e) =>
									setResultForm((prev) => ({
										...prev,
										awayScore: e.target.value,
									}))
								}
								className="w-16 text-center text-2xl font-bold border border-gray-300 rounded px-2 py-1"
								placeholder="0"
								min="0"
							/>
						</div>
					</div>
					<div className="flex items-center justify-center space-x-2">
						<select
							value={resultForm.status}
							onChange={(e) =>
								setResultForm((prev) => ({ ...prev, status: e.target.value }))
							}
							className="text-sm border border-gray-300 rounded px-2 py-1"
						>
							<option value="COMPLETED">Full Time</option>
							<option value="EXTRA_TIME">After Extra Time</option>
							<option value="PENALTIES">Penalties</option>
						</select>
						<button
							onClick={() => handleUpdateResult(fixture.id)}
							disabled={savingResult}
							className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
						>
							{savingResult ? "Saving..." : "Save"}
						</button>
						<button
							onClick={handleCancelResultUpdate}
							className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
						>
							Cancel
						</button>
					</div>
				</div>
			);
		} else if (
			fixture.status === "COMPLETED" ||
			fixture.status === "EXTRA_TIME" ||
			fixture.status === "PENALTIES"
		) {
			return (
				<div className="flex items-center justify-center space-x-6">
					<div className="text-center">
						<div className="text-sm text-gray-600 font-medium mb-1">
							{fixture.homeTeam?.name}
						</div>
						<div className="font-bold text-3xl text-gray-900">
							{fixture.homeScore}
						</div>
						{fixture.status === "PENALTIES" && (
							<div className="text-xs text-gray-500 mt-1">Penalties</div>
						)}
						{fixture.status === "EXTRA_TIME" && (
							<div className="text-xs text-gray-500 mt-1">AET</div>
						)}
					</div>
					<div className="text-center text-gray-400">
						<div className="text-2xl font-bold">-</div>
					</div>
					<div className="text-center">
						<div className="text-sm text-gray-600 font-medium mb-1">
							{fixture.awayTeam?.name}
						</div>
						<div className="font-bold text-3xl text-gray-900">
							{fixture.awayScore}
						</div>
						{fixture.status === "PENALTIES" && (
							<div className="text-xs text-gray-500 mt-1">Penalties</div>
						)}
						{fixture.status === "EXTRA_TIME" && (
							<div className="text-xs text-gray-500 mt-1">AET</div>
						)}
					</div>
				</div>
			);
		} else {
			return (
				<div className="flex items-center justify-center space-x-6">
					<div className="text-center">
						<div className="text-lg font-semibold text-gray-700">
							{fixture.homeTeam?.name}
						</div>
					</div>
					<div className="text-center text-gray-400">
						<div className="text-lg font-medium">VS</div>
					</div>
					<div className="text-center">
						<div className="text-lg font-semibold text-gray-700">
							{fixture.awayTeam?.name}
						</div>
					</div>
				</div>
			);
		}
	};

	const clearFilters = () => {
		setSearchTerm("");
		setStatusFilter("all");
		setCompetitionFilter("all");
		setSortBy("date");
		setSortOrder("asc");
	};

	const hasActiveFilters =
		searchTerm || statusFilter !== "all" || competitionFilter !== "all";

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
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
				<div className="flex items-center space-x-3 mt-4 sm:mt-0">
					{/* View Mode Toggle */}
					<div className="flex bg-gray-100 rounded-lg p-1">
						<button
							onClick={() => setViewMode("list")}
							className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
								viewMode === "list"
									? "bg-white text-gray-900 shadow-sm"
									: "text-gray-600 hover:text-gray-900"
							}`}
						>
							List
						</button>
						<button
							onClick={() => setViewMode("grid")}
							className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
								viewMode === "grid"
									? "bg-white text-gray-900 shadow-sm"
									: "text-gray-600 hover:text-gray-900"
							}`}
						>
							Grid
						</button>
					</div>

					{isTeamAdmin() && (
						<button className="btn-primary">
							<Plus className="h-4 w-4 mr-2" />
							Add Match
						</button>
					)}
				</div>
			</div>

			{/* Enhanced Filters */}
			<div className="card">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-medium text-gray-900">
						Filters & Search
					</h3>
					<button
						onClick={() => setShowFilters(!showFilters)}
						className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
					>
						<Filter className="h-4 w-4" />
						<span>{showFilters ? "Hide" : "Show"} Advanced Filters</span>
					</button>
				</div>

				{/* Basic Filters */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Sort By
						</label>
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value)}
							className="input-field"
						>
							<option value="date">Date</option>
							<option value="homeTeam">Home Team</option>
							<option value="awayTeam">Away Team</option>
							<option value="competition">Competition</option>
							<option value="status">Status</option>
						</select>
					</div>
				</div>

				{/* Advanced Filters */}
				{showFilters && (
					<div className="border-t border-gray-200 pt-4">
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							{/* Search */}
							<div className="md:col-span-2">
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Search
								</label>
								<div className="relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
									<input
										type="text"
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										placeholder="Search teams, competitions..."
										className="input-field pl-10"
									/>
								</div>
							</div>

							{/* Status Filter */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Status
								</label>
								<select
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}
									className="input-field"
								>
									<option value="all">All Statuses</option>
									<option value="SCHEDULED">Scheduled</option>
									<option value="IN_PROGRESS">In Progress</option>
									<option value="COMPLETED">Completed</option>
									<option value="CANCELLED">Cancelled</option>
									<option value="POSTPONED">Postponed</option>
								</select>
							</div>

							{/* Competition Filter */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Competition
								</label>
								<select
									value={competitionFilter}
									onChange={(e) => setCompetitionFilter(e.target.value)}
									className="input-field"
								>
									<option value="all">All Competitions</option>
									{competitions.map((competition) => (
										<option key={competition.id} value={competition.id}>
											{competition.name}
										</option>
									))}
								</select>
							</div>
						</div>

						{/* Sort Order and Clear Filters */}
						<div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
							<div className="flex items-center space-x-4">
								<label className="flex items-center space-x-2 text-sm text-gray-700">
									<span>Sort Order:</span>
									<button
										onClick={() =>
											setSortOrder(sortOrder === "asc" ? "desc" : "asc")
										}
										className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
									>
										<ArrowUpDown className="h-4 w-4" />
										<span className="capitalize">{sortOrder}</span>
									</button>
								</label>
							</div>

							{hasActiveFilters && (
								<button
									onClick={clearFilters}
									className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
								>
									<X className="h-4 w-4" />
									<span>Clear Filters</span>
								</button>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Results Summary */}
			<div className="flex items-center justify-between">
				<div className="text-sm text-gray-600">
					Showing {filteredAndSortedFixtures.length} of {fixtures.length}{" "}
					fixtures
					{hasActiveFilters && " (filtered)"}
				</div>
			</div>

			{/* Fixtures List/Grid */}
			<div className="card">
				{filteredAndSortedFixtures.length === 0 ? (
					<div className="text-center py-12">
						<Calendar className="mx-auto h-12 w-12 text-gray-400" />
						<h3 className="mt-2 text-sm font-medium text-gray-900">
							No fixtures found
						</h3>
						<p className="mt-1 text-sm text-gray-500">
							{hasActiveFilters
								? "Try adjusting your filters or search terms."
								: "Get started by creating a new fixture."}
						</p>
					</div>
				) : (
					<div
						className={
							viewMode === "grid"
								? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
								: "space-y-4"
						}
					>
						{filteredAndSortedFixtures.map((fixture) => (
							<div
								key={fixture.id}
								className={`border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors ${
									viewMode === "grid" ? "h-full" : ""
								}`}
							>
								{/* Status Badge */}
								<div className="flex items-center justify-between mb-3">
									<div
										className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
											fixture.status
										)}`}
									>
										{getStatusIcon(fixture.status)}
										<span className="ml-1 capitalize">
											{fixture.status.toLowerCase().replace("_", " ")}
										</span>
									</div>
									<div className="flex items-center space-x-1 text-gray-500">
										{getCompetitionIcon(fixture.competitionType)}
										<span className="text-xs capitalize">
											{fixture.competitionType.toLowerCase()}
										</span>
									</div>
								</div>

								{/* Match Details */}
								<div className="mb-4">{getScoreDisplay(fixture)}</div>

								{/* Date and Time */}
								<div className="flex items-center justify-between text-sm text-gray-500 mb-3">
									<div className="flex items-center space-x-2">
										<CalendarDays className="h-4 w-4" />
										<span>{formatDate(fixture.date)}</span>
									</div>
									<div className="flex items-center space-x-2">
										<Clock className="h-4 w-4" />
										<span>{formatTime(fixture.date)}</span>
									</div>
								</div>

								{/* Team Links */}
								<div className="flex items-center justify-between text-xs text-gray-500 mb-3">
									<Link
										to={`/dashboard/team/${fixture.homeTeam?.id}`}
										className="hover:text-blue-600 hover:underline"
									>
										View {fixture.homeTeam?.name} Team
									</Link>
									<Link
										to={`/dashboard/team/${fixture.awayTeam?.id}`}
										className="hover:text-blue-600 hover:underline"
									>
										View {fixture.awayTeam?.name} Team
									</Link>
								</div>

								{/* Action Buttons */}
								<div className="flex items-center justify-between pt-3 border-t border-gray-200">
									<div className="flex items-center space-x-2">
										<Link
											to={`/dashboard/fixture/${fixture.id}`}
											className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
										>
											<Eye className="h-4 w-4" />
											<span>View Details</span>
										</Link>
									</div>

									{isTeamAdmin() && (
										<div className="flex items-center space-x-2">
											{fixture.status === "SCHEDULED" && (
												<button
													onClick={() => handleStartResultUpdate(fixture)}
													className="btn-primary text-xs"
												>
													<CheckCircle className="h-3 w-3 mr-1" />
													Update Result
												</button>
											)}
											<button
												onClick={() => setEditingMatch(fixture.id)}
												className="btn-secondary text-xs"
											>
												<Edit className="h-3 w-3 mr-1" />
												Edit Match
											</button>
											<button className="btn-danger text-xs">
												<Trash2 className="h-3 w-3 mr-1" />
												Delete
											</button>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Match Fixture Editor Modal */}
			{editingMatch && (
				<MatchFixtureEditor
					matchId={editingMatch}
					onClose={() => setEditingMatch(null)}
					onSave={(matchData) => {
						console.log("Match saved:", matchData);
						setEditingMatch(null);
						// Optionally refresh fixtures
						fetchFixtures();
					}}
				/>
			)}
		</div>
	);
};

export default Fixtures;
