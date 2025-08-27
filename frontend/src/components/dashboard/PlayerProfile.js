import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
	User,
	MapPin,
	Calendar,
	Trophy,
	Award,
	Star,
	Target,
	TrendingUp,
	Clock,
	Users,
} from "lucide-react";
import axios from "axios";
import { API_ENDPOINTS } from "../../utils/api";

const PlayerProfile = () => {
	const { playerId } = useParams();
	const { user, isTeamAdmin, isLeagueAdmin } = useAuth();
	const [player, setPlayer] = useState(null);
	const [badges, setBadges] = useState([]);
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [selectedSeason, setSelectedSeason] = useState("all");
	const [seasons, setSeasons] = useState([]);

	useEffect(() => {
		if (playerId) {
			fetchPlayerData();
			fetchSeasons();
		}
	}, [playerId, selectedSeason]);

	const fetchPlayerData = async () => {
		try {
			setLoading(true);
			
			// Fetch player details
			const playerResponse = await axios.get(`${API_ENDPOINTS.PLAYERS}/${playerId}`);
			setPlayer(playerResponse.data.data);

			// Fetch player badges
			const badgesResponse = await axios.get(`${API_ENDPOINTS.BADGES}/player/${playerId}?season=${selectedSeason}`);
			setBadges(badgesResponse.data.data.awardedBadges || []);

			// Fetch player stats for the selected season
			if (selectedSeason !== "all") {
				const statsResponse = await axios.get(`${API_ENDPOINTS.STATS}/player/${playerId}?season=${selectedSeason}`);
				setStats(statsResponse.data.data);
			} else {
				setStats(null);
			}
		} catch (error) {
			console.error("Error fetching player data:", error);
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
		}
	};

	const getBadgeIcon = (category) => {
		switch (category) {
			case "PERFORMANCE":
				return <Star className="h-5 w-5 text-yellow-500" />;
			case "ACHIEVEMENT":
				return <Trophy className="h-5 w-5 text-blue-500" />;
			case "MILESTONE":
				return <Target className="h-5 w-5 text-green-500" />;
			case "SPECIAL":
				return <Award className="h-5 w-5 text-purple-500" />;
			default:
				return <Award className="h-5 w-5 text-gray-500" />;
		}
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

	if (!player) {
		return (
			<div className="text-center py-12">
				<User className="mx-auto h-12 w-12 text-gray-400" />
				<h3 className="mt-2 text-sm font-medium text-gray-900">Player not found</h3>
				<p className="mt-1 text-sm text-gray-500">The requested player could not be found.</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">Player Profile</h2>
					<p className="mt-1 text-sm text-gray-500">
						View player information, statistics, and achievements
					</p>
				</div>
				<div className="mt-4 sm:mt-0">
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
			</div>

			{/* Player Information */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Player Card */}
				<div className="lg:col-span-1">
					<div className="card">
						<div className="text-center">
							<div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
								<User className="w-12 h-12 text-gray-400" />
							</div>
							<h3 className="text-xl font-semibold text-gray-900">{player.gamertag}</h3>
							{player.realName && (
								<p className="text-sm text-gray-500">{player.realName}</p>
							)}
							<div className="mt-2">
								<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
									{player.position}
								</span>
							</div>
						</div>

						<div className="mt-6 space-y-3">
							{player.team && (
								<div className="flex items-center text-sm text-gray-600">
									<Users className="h-4 w-4 mr-2" />
									<span>Team: {player.team.name}</span>
								</div>
							)}
							<div className="flex items-center text-sm text-gray-600">
								<Calendar className="h-4 w-4 mr-2" />
								<span>Joined: {formatDate(player.createdAt)}</span>
							</div>
						</div>
					</div>
				</div>

				{/* Player Stats */}
				<div className="lg:col-span-2">
					<div className="card">
						<h3 className="text-lg font-medium text-gray-900 mb-4">Season Statistics</h3>
						{stats ? (
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div className="text-center">
									<div className="text-2xl font-bold text-primary-600">{stats.matchesPlayed}</div>
									<div className="text-sm text-gray-500">Matches</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-green-600">{stats.totalGoals}</div>
									<div className="text-sm text-gray-500">Goals</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-blue-600">{stats.totalAssists}</div>
									<div className="text-sm text-gray-500">Assists</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-yellow-600">{stats.avgRating.toFixed(1)}</div>
									<div className="text-sm text-gray-500">Avg Rating</div>
								</div>
							</div>
						) : (
							<div className="text-center py-8">
								<TrendingUp className="mx-auto h-8 w-8 text-gray-400" />
								<p className="mt-2 text-sm text-gray-500">No statistics available for this season</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Badges Section */}
			<div className="card">
				<div className="flex items-center justify-between mb-6">
					<h3 className="text-lg font-medium text-gray-900">Achievements & Badges</h3>
					<div className="text-sm text-gray-500">
						{selectedSeason === "all" ? "All Time" : `Season ${seasons.find(s => s.id === selectedSeason)?.name || ""}`}
					</div>
				</div>

				{/* Badge Categories */}
				<div className="space-y-6">
					{["PERFORMANCE", "ACHIEVEMENT", "MILESTONE", "SPECIAL"].map((category) => {
						const categoryBadges = badges.filter(
							(awardedBadge) => awardedBadge.badge.category === category
						);

						if (categoryBadges.length === 0) return null;

						return (
							<div key={category} className="border-t border-gray-200 pt-6">
								<h4 className="text-md font-medium text-gray-700 mb-4 flex items-center">
									{getBadgeIcon(category)}
									<span className="ml-2">{category}</span>
								</h4>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{categoryBadges.map((awardedBadge) => (
										<div
											key={awardedBadge.id}
											className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
										>
											<div className="flex items-start space-x-3">
												<div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
													{getBadgeIcon(awardedBadge.badge.category)}
												</div>
												<div className="flex-1 min-w-0">
													<h5 className="text-sm font-medium text-gray-900">
														{awardedBadge.badge.name}
													</h5>
													<p className="text-sm text-gray-500 mt-1">
														{awardedBadge.badge.description}
													</p>
													<div className="mt-2 text-xs text-gray-400">
														<Clock className="inline h-3 w-3 mr-1" />
														{formatDate(awardedBadge.awardedAt)}
													</div>
													{awardedBadge.match && (
														<div className="mt-1 text-xs text-gray-400">
															vs {awardedBadge.match.awayTeam?.name || "Unknown"}
														</div>
													)}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						);
					})}
				</div>

				{/* No Badges Message */}
				{badges.length === 0 && (
					<div className="text-center py-12">
						<Trophy className="mx-auto h-12 w-12 text-gray-400" />
						<h3 className="mt-2 text-sm font-medium text-gray-900">No badges yet</h3>
						<p className="mt-1 text-sm text-gray-500">
							This player hasn't earned any badges yet. Keep playing to unlock achievements!
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default PlayerProfile;
