import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
	Calendar,
	Clock,
	Users,
	Trophy,
	Edit,
	Trash2,
	CheckCircle,
	ArrowLeft,
	Eye,
	Zap,
	X,
	Share2,
	Download,
	Printer,
} from "lucide-react";
import api from "../../utils/api";

const FixtureDetail = () => {
	const { fixtureId } = useParams();
	const navigate = useNavigate();
	const { isTeamAdmin } = useAuth();

	const [fixture, setFixture] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [homeTeam, setHomeTeam] = useState(null);
	const [awayTeam, setAwayTeam] = useState(null);
	const [season, setSeason] = useState(null);
	const [playerStats, setPlayerStats] = useState([]);

	const fetchFixtureDetails = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			// Fetch fixture details
			const fixtureResponse = await api.get(`/matches/${fixtureId}`);
			const fixtureData = fixtureResponse.data.data;
			setFixture(fixtureData);

			// Fetch related data
			if (fixtureData.homeTeamId) {
				const homeTeamResponse = await api.get(
					`/teams/${fixtureData.homeTeamId}`
				);
				setHomeTeam(homeTeamResponse.data.data);
			}

			if (fixtureData.awayTeamId) {
				const awayTeamResponse = await api.get(
					`/teams/${fixtureData.awayTeamId}`
				);
				setAwayTeam(awayTeamResponse.data.data);
			}

			if (fixtureData.seasonId) {
				const seasonResponse = await api.get(
					`/seasons/${fixtureData.seasonId}`
				);
				setSeason(seasonResponse.data.data);
			}

			// Fetch player match stats
			const statsResponse = await api.get(`/matches/${fixtureId}/player-stats`);
			setPlayerStats(statsResponse.data.data || []);
		} catch (error) {
			console.error("Error fetching fixture details:", error);
			setError("Failed to load fixture details. Please try again.");
		} finally {
			setLoading(false);
		}
	}, [fixtureId]);

	useEffect(() => {
		fetchFixtureDetails();
	}, [fetchFixtureDetails]);

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
				return <CheckCircle className="h-5 w-5" />;
			case "SCHEDULED":
				return <Calendar className="h-5 w-5" />;
			case "IN_PROGRESS":
				return <Zap className="h-5 w-5" />;
			case "CANCELLED":
				return <X className="h-5 w-5" />;
			case "POSTPONED":
				return <Clock className="h-5 w-5" />;
			default:
				return <Calendar className="h-5 w-5" />;
		}
	};

	const getCompetitionIcon = (type) => {
		switch (type) {
			case "LEAGUE":
				return <Trophy className="h-5 w-5 text-yellow-600" />;
			case "CUP":
				return <Trophy className="h-5 w-5 text-purple-600" />;
			case "FRIENDLY":
				return <Users className="h-5 w-5 text-blue-600" />;
			default:
				return <Calendar className="h-5 w-5 text-gray-600" />;
		}
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const formatTime = (dateString) => {
		return new Date(dateString).toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const handleEdit = () => {
		// Navigate to edit fixture page
		navigate(`/dashboard/fixture/${fixtureId}/edit`);
	};

	const handleDelete = async () => {
		if (
			window.confirm(
				"Are you sure you want to delete this fixture? This action cannot be undone."
			)
		) {
			try {
				await api.delete(`/matches/${fixtureId}`);
				navigate("/dashboard/fixtures");
			} catch (error) {
				console.error("Error deleting fixture:", error);
				alert("Failed to delete fixture. Please try again.");
			}
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-12">
				<div className="text-red-600 mb-4">
					<X className="mx-auto h-12 w-12" />
				</div>
				<h3 className="text-lg font-medium text-gray-900 mb-2">
					Error Loading Fixture
				</h3>
				<p className="text-gray-500 mb-4">{error}</p>
				<Link to="/dashboard/fixtures" className="btn-primary">
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back to Fixtures
				</Link>
			</div>
		);
	}

	if (!fixture) {
		return (
			<div className="text-center py-12">
				<div className="text-gray-400 mb-4">
					<Calendar className="mx-auto h-12 w-12" />
				</div>
				<h3 className="text-lg font-medium text-gray-900 mb-2">
					Fixture Not Found
				</h3>
				<p className="text-gray-500 mb-4">
					The fixture you're looking for doesn't exist.
				</p>
				<Link to="/dashboard/fixtures" className="btn-primary">
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back to Fixtures
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<Link
						to="/dashboard/fixtures"
						className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
					>
						<ArrowLeft className="h-4 w-4" />
						<span>Back to Fixtures</span>
					</Link>
					<div className="h-6 w-px bg-gray-300"></div>
					<h2 className="text-2xl font-bold text-gray-900">Fixture Details</h2>
				</div>

				<div className="flex items-center space-x-3">
					{/* Action Buttons */}
					<button className="btn-secondary">
						<Share2 className="h-4 w-4 mr-2" />
						Share
					</button>
					<button className="btn-secondary">
						<Download className="h-4 w-4 mr-2" />
						Export
					</button>
					<button className="btn-secondary">
						<Printer className="h-4 w-4 mr-2" />
						Print
					</button>

					{isTeamAdmin() && (
						<>
							<button onClick={handleEdit} className="btn-primary">
								<Edit className="h-4 w-4 mr-2" />
								Edit
							</button>
							<button onClick={handleDelete} className="btn-danger">
								<Trash2 className="h-4 w-4 mr-2" />
								Delete
							</button>
						</>
					)}
				</div>
			</div>

			{/* Main Content */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Match Details - Main Column */}
				<div className="lg:col-span-2 space-y-6">
					{/* Match Card */}
					<div className="card">
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center space-x-3">
								<div
									className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
										fixture.status
									)}`}
								>
									{getStatusIcon(fixture.status)}
									<span className="ml-2 capitalize">
										{fixture.status.toLowerCase().replace("_", " ")}
									</span>
								</div>
								<div className="flex items-center space-x-2 text-gray-600">
									{getCompetitionIcon(fixture.competitionType)}
									<span className="text-sm capitalize">
										{fixture.competitionType.toLowerCase()}
									</span>
								</div>
							</div>
							{season && (
								<div className="text-sm text-gray-500">{season.name}</div>
							)}
						</div>

						{/* Score Display */}
						<div className="text-center mb-6">
							{fixture.status === "COMPLETED" ? (
								<div className="flex items-center justify-center space-x-8">
									<div className="text-center">
										<div className="text-4xl font-bold text-gray-900 mb-2">
											{fixture.homeScore}
										</div>
										<div className="text-lg font-semibold text-gray-700">
											{homeTeam?.name || "Home Team"}
										</div>
									</div>
									<div className="text-2xl font-bold text-gray-400">-</div>
									<div className="text-center">
										<div className="text-4xl font-bold text-gray-900 mb-2">
											{fixture.awayScore}
										</div>
										<div className="text-lg font-semibold text-gray-700">
											{awayTeam?.name || "Away Team"}
										</div>
									</div>
								</div>
							) : (
								<div className="flex items-center justify-center space-x-8">
									<div className="text-center">
										<div className="text-2xl font-semibold text-gray-700">
											{homeTeam?.name || "Home Team"}
										</div>
									</div>
									<div className="text-lg font-medium text-gray-400">vs</div>
									<div className="text-center">
										<div className="text-2xl font-semibold text-gray-700">
											{awayTeam?.name || "Away Team"}
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Match Info */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-200">
							<div className="flex items-center space-x-3">
								<Calendar className="h-5 w-5 text-gray-400" />
								<div>
									<div className="text-sm font-medium text-gray-900">Date</div>
									<div className="text-sm text-gray-500">
										{formatDate(fixture.date)}
									</div>
								</div>
							</div>
							<div className="flex items-center space-x-3">
								<Clock className="h-5 w-5 text-gray-400" />
								<div>
									<div className="text-sm font-medium text-gray-900">Time</div>
									<div className="text-sm text-gray-500">
										{formatTime(fixture.date)}
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Player Match Statistics */}
					{playerStats.length > 0 && (
						<div className="card">
							<h3 className="text-lg font-semibold text-gray-900 mb-4">
								Player Match Statistics
							</h3>
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Player
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Position
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Goals
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Assists
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Rating
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Pass %
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Tackles
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Saves
											</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{playerStats.map((stat) => (
											<tr key={stat.id} className="hover:bg-gray-50">
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="flex items-center">
														<div className="flex-shrink-0 h-10 w-10">
															<div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
																<span className="text-sm font-medium text-gray-700">
																	{stat.player?.gamertag?.charAt(0) || "P"}
																</span>
															</div>
														</div>
														<div className="ml-4">
															<div className="text-sm font-medium text-gray-900">
																{stat.player?.gamertag || "Unknown Player"}
															</div>
															<div className="text-sm text-gray-500">
																{stat.player?.realName || ""}
															</div>
														</div>
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
														{stat.player?.position || "N/A"}
													</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{stat.goals || 0}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{stat.assists || 0}
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<span
														className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
															stat.rating >= 8
																? "bg-green-100 text-green-800"
																: stat.rating >= 6
																? "bg-yellow-100 text-yellow-800"
																: "bg-red-100 text-red-800"
														}`}
													>
														{stat.rating ? stat.rating.toFixed(1) : "N/A"}
													</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{stat.passAccuracy
														? (stat.passAccuracy * 100).toFixed(1) + "%"
														: "N/A"}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{stat.tackles || 0}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{stat.saves || 0}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{/* Team Information */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Home Team */}
						<div className="card">
							<h3 className="text-lg font-semibold text-gray-900 mb-4">
								Home Team
							</h3>
							{homeTeam ? (
								<div className="space-y-3">
									<div className="flex items-center space-x-3">
										{homeTeam.logoUrl && (
											<img
												src={homeTeam.logoUrl}
												alt={homeTeam.name}
												className="h-12 w-12 rounded-full object-cover"
											/>
										)}
										<div>
											<div className="font-medium text-gray-900">
												{homeTeam.name}
											</div>
											{homeTeam.saplId && (
												<div className="text-sm text-gray-500">
													SAPL ID: {homeTeam.saplId}
												</div>
											)}
										</div>
									</div>
									<Link
										to={`/dashboard/team/${homeTeam.id}`}
										className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
									>
										<Eye className="h-4 w-4 mr-1" />
										View Team Details
									</Link>
								</div>
							) : (
								<div className="text-gray-500">
									Team information not available
								</div>
							)}
						</div>

						{/* Away Team */}
						<div className="card">
							<h3 className="text-lg font-semibold text-gray-900 mb-4">
								Away Team
							</h3>
							{awayTeam ? (
								<div className="space-y-3">
									<div className="flex items-center space-x-3">
										{awayTeam.logoUrl && (
											<img
												src={awayTeam.logoUrl}
												alt={awayTeam.name}
												className="h-12 w-12 rounded-full object-cover"
											/>
										)}
										<div>
											<div className="font-medium text-gray-900">
												{awayTeam.name}
											</div>
											{awayTeam.saplId && (
												<div className="text-sm text-gray-500">
													SAPL ID: {awayTeam.saplId}
												</div>
											)}
										</div>
									</div>
									<Link
										to={`/dashboard/team/${awayTeam.id}`}
										className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
									>
										<Eye className="h-4 w-4 mr-1" />
										View Team Details
									</Link>
								</div>
							) : (
								<div className="text-gray-500">
									Team information not available
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Match Statistics */}
					<div className="card">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">
							Match Statistics
						</h3>
						<div className="space-y-3">
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600">Competition Type</span>
								<span className="text-sm font-medium text-gray-900 capitalize">
									{fixture.competitionType?.toLowerCase()}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600">Match Status</span>
								<span className="text-sm font-medium text-gray-900 capitalize">
									{fixture.status?.toLowerCase().replace("_", " ")}
								</span>
							</div>
							{fixture.homeScore !== null && fixture.awayScore !== null && (
								<div className="flex justify-between items-center">
									<span className="text-sm text-gray-600">Final Score</span>
									<span className="text-sm font-medium text-gray-900">
										{fixture.homeScore} - {fixture.awayScore}
									</span>
								</div>
							)}
							{fixture.createdAt && (
								<div className="flex justify-between items-center">
									<span className="text-sm text-gray-600">Created</span>
									<span className="text-sm text-gray-500">
										{new Date(fixture.createdAt).toLocaleDateString()}
									</span>
								</div>
							)}
							{fixture.updatedAt && (
								<div className="flex justify-between items-center">
									<span className="text-sm text-gray-600">Last Updated</span>
									<span className="text-sm text-gray-500">
										{new Date(fixture.updatedAt).toLocaleDateString()}
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Quick Actions */}
					<div className="card">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">
							Quick Actions
						</h3>
						<div className="space-y-2">
							<Link
								to={`/dashboard/team/${fixture.homeTeamId}`}
								className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
							>
								View Home Team
							</Link>
							<Link
								to={`/dashboard/team/${fixture.awayTeamId}`}
								className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
							>
								View Away Team
							</Link>
							{season && (
								<Link
									to={`/dashboard/season/${fixture.seasonId}`}
									className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
								>
									View Season
								</Link>
							)}
						</div>
					</div>

					{/* Match ID */}
					<div className="card">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">
							Match Information
						</h3>
						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600">Match ID</span>
								<span className="text-sm font-mono text-gray-900">
									{fixture.id}
								</span>
							</div>
							{fixture.saplId && (
								<div className="flex justify-between items-center">
									<span className="text-sm text-gray-600">SAPL ID</span>
									<span className="text-sm font-mono text-gray-900">
										{fixture.saplId}
									</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default FixtureDetail;
