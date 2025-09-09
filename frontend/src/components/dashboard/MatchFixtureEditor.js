import React, { useState, useEffect } from "react";
import {
	Edit,
	Save,
	X,
	RotateCcw,
	Users,
	Shield,
	Target,
	Clock,
	Calendar,
	MapPin,
} from "lucide-react";
import api from "../../utils/api";
import FormationSelector from "./FormationSelector";
import FormationDisplay from "./FormationDisplay";
import PlayerCard from "./PlayerCard";
import MatchStatsInput from "./MatchStatsInput";

const MatchFixtureEditor = ({ matchId, onClose, onSave }) => {
	const [match, setMatch] = useState(null);
	const [homeTeam, setHomeTeam] = useState(null);
	const [awayTeam, setAwayTeam] = useState(null);
	const [homeFormation, setHomeFormation] = useState("4-4-2");
	const [awayFormation, setAwayFormation] = useState("4-4-2");
	const [homeLineup, setHomeLineup] = useState({});
	const [awayLineup, setAwayLineup] = useState({});
	const [homeStats, setHomeStats] = useState({});
	const [awayStats, setAwayStats] = useState({});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [activeTab, setActiveTab] = useState("home"); // "home" or "away"
	const [selectedPlayer, setSelectedPlayer] = useState(null);

	useEffect(() => {
		if (matchId) {
			fetchMatchDetails();
		}
	}, [matchId]);

	const fetchMatchDetails = async () => {
		try {
			setLoading(true);
			const response = await api.get(`/matches/${matchId}`);
			const matchData = response.data.data;

			console.log("🔍 Match data received:", matchData);
			console.log("🔍 Home team players:", matchData.homeTeam?.players);
			console.log("🔍 Away team players:", matchData.awayTeam?.players);

			setMatch(matchData);
			setHomeTeam(matchData.homeTeam);
			setAwayTeam(matchData.awayTeam);

			// Load existing lineups and stats if available
			if (matchData.homeLineup) {
				setHomeLineup(matchData.homeLineup);
			}
			if (matchData.awayLineup) {
				setAwayLineup(matchData.awayLineup);
			}
			if (matchData.homeStats) {
				setHomeStats(matchData.homeStats);
			}
			if (matchData.awayStats) {
				setAwayStats(matchData.awayStats);
			}

			// If teams don't have players, fetch them separately
			if (
				!matchData.homeTeam?.players ||
				matchData.homeTeam.players.length === 0
			) {
				console.log("🔍 Fetching home team players separately");
				fetchTeamPlayers(matchData.homeTeam.id, "home");
			}
			if (
				!matchData.awayTeam?.players ||
				matchData.awayTeam.players.length === 0
			) {
				console.log("🔍 Fetching away team players separately");
				fetchTeamPlayers(matchData.awayTeam.id, "away");
			}
		} catch (error) {
			console.error("Error fetching match details:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchTeamPlayers = async (teamId, teamType) => {
		try {
			console.log(`🔍 Fetching players for team ${teamId} (${teamType})`);
			const response = await api.get(`/teams/${teamId}`);
			const teamData = response.data.data;

			console.log(`🔍 Team ${teamType} players fetched:`, teamData.players);

			if (teamType === "home") {
				setHomeTeam((prev) => ({
					...prev,
					players: teamData.players || [],
				}));
			} else {
				setAwayTeam((prev) => ({
					...prev,
					players: teamData.players || [],
				}));
			}
		} catch (error) {
			console.error(`Error fetching ${teamType} team players:`, error);
		}
	};

	const handlePlayerDrop = (playerId, position, teamType) => {
		if (teamType === "home") {
			setHomeLineup((prev) => ({
				...prev,
				[position]: playerId,
			}));
		} else {
			setAwayLineup((prev) => ({
				...prev,
				[position]: playerId,
			}));
		}
	};

	const handlePlayerRemove = (position, teamType) => {
		if (teamType === "home") {
			setHomeLineup((prev) => {
				const newLineup = { ...prev };
				delete newLineup[position];
				return newLineup;
			});
		} else {
			setAwayLineup((prev) => {
				const newLineup = { ...prev };
				delete newLineup[position];
				return newLineup;
			});
		}
	};

	const handleStatsChange = (playerId, stats, teamType) => {
		if (teamType === "home") {
			setHomeStats((prev) => ({
				...prev,
				[playerId]: stats,
			}));
		} else {
			setAwayStats((prev) => ({
				...prev,
				[playerId]: stats,
			}));
		}
	};

	const handleFormationChange = (newFormation, teamType) => {
		// Get the new formation positions
		const getFormationPositions = (formation) => {
			const positions = {
				"4-4-2": {
					GK: ["GK"],
					DEF: ["LB", "CB1", "CB2", "RB"],
					MID: ["LM", "CM1", "CM2", "RM"],
					ATT: ["ST1", "ST2"],
				},
				"4-3-3": {
					GK: ["GK"],
					DEF: ["LB", "CB1", "CB2", "RB"],
					MID: ["CM1", "CM2", "CM3"],
					ATT: ["LW", "ST", "RW"],
				},
				"3-5-2": {
					GK: ["GK"],
					DEF: ["CB1", "CB2", "CB3"],
					MID: ["LM", "CM1", "CM2", "CM3", "RM"],
					ATT: ["ST1", "ST2"],
				},
				"4-2-3-1": {
					GK: ["GK"],
					DEF: ["LB", "CB1", "CB2", "RB"],
					MID: ["CDM1", "CDM2", "LW", "CAM", "RW"],
					ATT: ["ST"],
				},
				"5-3-2": {
					GK: ["GK"],
					DEF: ["LB", "CB1", "CB2", "CB3", "RB"],
					MID: ["CM1", "CM2", "CM3"],
					ATT: ["ST1", "ST2"],
				},
				"4-1-4-1": {
					GK: ["GK"],
					DEF: ["LB", "CB1", "CB2", "RB"],
					MID: ["CDM", "LM", "CM1", "CM2", "RM"],
					ATT: ["ST"],
				},
				"3-4-3": {
					GK: ["GK"],
					DEF: ["CB1", "CB2", "CB3"],
					MID: ["LM", "CM1", "CM2", "RM"],
					ATT: ["LW", "ST", "RW"],
				},
				"4-5-1": {
					GK: ["GK"],
					DEF: ["LB", "CB1", "CB2", "RB"],
					MID: ["LM", "CM1", "CM2", "CM3", "RM"],
					ATT: ["ST"],
				},
			};
			return positions[formation] || positions["4-4-2"];
		};

		const newPositions = getFormationPositions(newFormation);
		const allNewPositions = Object.values(newPositions).flat();

		if (teamType === "home") {
			// Check which players can retain their positions
			const newHomeLineup = {};
			const removedPlayers = [];

			// Check each current player in lineup
			Object.entries(homeLineup).forEach(([position, playerId]) => {
				// Clean position name (remove numbers)
				const cleanPosition = position.replace(/[0-9]/g, "");

				// Check if this clean position exists in new formation
				const hasMatchingPosition = allNewPositions.some(
					(pos) => pos.replace(/[0-9]/g, "") === cleanPosition
				);

				if (hasMatchingPosition) {
					// Find the first available slot for this position type
					const matchingSlot = allNewPositions.find(
						(pos) =>
							pos.replace(/[0-9]/g, "") === cleanPosition &&
							!Object.values(newHomeLineup).includes(playerId)
					);

					if (matchingSlot) {
						newHomeLineup[matchingSlot] = playerId;
					} else {
						removedPlayers.push(playerId);
					}
				} else {
					removedPlayers.push(playerId);
				}
			});

			setHomeFormation(newFormation);
			setHomeLineup(newHomeLineup);

			if (removedPlayers.length > 0) {
				console.log(
					`Removed ${removedPlayers.length} players from home team lineup due to formation change`
				);
			}
		} else {
			// Check which players can retain their positions
			const newAwayLineup = {};
			const removedPlayers = [];

			// Check each current player in lineup
			Object.entries(awayLineup).forEach(([position, playerId]) => {
				// Clean position name (remove numbers)
				const cleanPosition = position.replace(/[0-9]/g, "");

				// Check if this clean position exists in new formation
				const hasMatchingPosition = allNewPositions.some(
					(pos) => pos.replace(/[0-9]/g, "") === cleanPosition
				);

				if (hasMatchingPosition) {
					// Find the first available slot for this position type
					const matchingSlot = allNewPositions.find(
						(pos) =>
							pos.replace(/[0-9]/g, "") === cleanPosition &&
							!Object.values(newAwayLineup).includes(playerId)
					);

					if (matchingSlot) {
						newAwayLineup[matchingSlot] = playerId;
					} else {
						removedPlayers.push(playerId);
					}
				} else {
					removedPlayers.push(playerId);
				}
			});

			setAwayFormation(newFormation);
			setAwayLineup(newAwayLineup);

			if (removedPlayers.length > 0) {
				console.log(
					`Removed ${removedPlayers.length} players from away team lineup due to formation change`
				);
			}
		}
	};

	const handleSave = async () => {
		try {
			setSaving(true);

			const matchData = {
				homeLineup,
				awayLineup,
				homeStats,
				awayStats,
				homeFormation,
				awayFormation,
			};

			await api.put(`/matches/${matchId}`, matchData, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});

			onSave?.(matchData);
			onClose?.();
		} catch (error) {
			console.error("Error saving match:", error);
			alert("Error saving match. Please try again.");
		} finally {
			setSaving(false);
		}
	};

	const getAvailablePlayers = (team) => {
		if (!team?.players) return [];
		const isHomeTeam = team.id === homeTeam?.id;
		const lineup = isHomeTeam ? homeLineup : awayLineup;

		console.log("🔍 getAvailablePlayers debug:", {
			teamId: team.id,
			teamName: team.name,
			isHomeTeam,
			homeTeamId: homeTeam?.id,
			awayTeamId: awayTeam?.id,
			lineup,
			totalPlayers: team.players.length,
		});

		return team.players.filter((player) => {
			return !Object.values(lineup).includes(player.id);
		});
	};

	const getPlayerInPosition = (position, team) => {
		const isHomeTeam = team.id === homeTeam?.id;
		const lineup = isHomeTeam ? homeLineup : awayLineup;
		const playerId = lineup[position];
		if (!playerId) return null;

		const teamPlayers = team?.players || [];
		return teamPlayers.find((p) => p.id === playerId);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
			</div>
		);
	}

	if (!match) {
		return (
			<div className="text-center py-8">
				<p className="text-gray-500">Match not found</p>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b">
					<div className="flex items-center space-x-4">
						<div className="flex items-center space-x-2">
							<Calendar className="h-5 w-5 text-gray-500" />
							<span className="font-medium">
								{new Date(match.date).toLocaleDateString()}
							</span>
						</div>
						<div className="flex items-center space-x-2">
							<Clock className="h-5 w-5 text-gray-500" />
							<span className="text-sm text-gray-500">{match.status}</span>
						</div>
					</div>
					<div className="flex items-center space-x-2">
						<button
							onClick={onClose}
							className="p-2 text-gray-400 hover:text-gray-600"
						>
							<X className="h-5 w-5" />
						</button>
					</div>
				</div>

				{/* Match Info */}
				<div className="p-6 border-b bg-gray-50">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<div className="text-center">
								<div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-2">
									<Shield className="h-6 w-6 text-primary-600" />
								</div>
								<h3 className="font-semibold text-lg">{homeTeam?.name}</h3>
								<p className="text-sm text-gray-500">Home</p>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold">VS</div>
								<div className="text-sm text-gray-500">vs</div>
							</div>
							<div className="text-center">
								<div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
									<Shield className="h-6 w-6 text-gray-600" />
								</div>
								<h3 className="font-semibold text-lg">{awayTeam?.name}</h3>
								<p className="text-sm text-gray-500">Away</p>
							</div>
						</div>
						<div className="text-right">
							<div className="text-sm text-gray-500">Score</div>
							<div className="text-2xl font-bold">
								{match.homeScore || 0} - {match.awayScore || 0}
							</div>
						</div>
					</div>
				</div>

				{/* Tabs */}
				<div className="flex border-b">
					<button
						onClick={() => setActiveTab("home")}
						className={`px-6 py-3 font-medium ${
							activeTab === "home"
								? "text-primary-600 border-b-2 border-primary-600"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						{homeTeam?.name} (Home)
					</button>
					<button
						onClick={() => setActiveTab("away")}
						className={`px-6 py-3 font-medium ${
							activeTab === "away"
								? "text-primary-600 border-b-2 border-primary-600"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						{awayTeam?.name} (Away)
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-6 min-h-0">
					{activeTab === "home" ? (
						<div className="space-y-6">
							{/* Formation Selector */}
							<FormationSelector
								formation={homeFormation}
								onFormationChange={(formation) =>
									handleFormationChange(formation, "home")
								}
								teamName={homeTeam?.name}
							/>

							{/* Team Lineup */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								{/* Formation Display */}
								<div className="space-y-4">
									<h4 className="font-semibold text-lg">Formation & Lineup</h4>
									<FormationDisplay
										formation={homeFormation}
										lineup={homeLineup}
										team={homeTeam}
										teamType="home"
										onPlayerDrop={handlePlayerDrop}
										onPlayerRemove={handlePlayerRemove}
									/>
								</div>

								{/* Available Players */}
								<div className="space-y-4">
									<h4 className="font-semibold text-lg">Available Players</h4>
									<div className="text-sm text-gray-500 mb-2">
										{getAvailablePlayers(homeTeam).length} players available
									</div>
									<div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 max-h-[500px] overflow-y-auto p-2">
										{getAvailablePlayers(homeTeam).map((player) => (
											<div key={player.id} className="flex justify-center">
												<PlayerCard
													player={player}
													onDragStart={() => setSelectedPlayer(player)}
												/>
											</div>
										))}
									</div>
								</div>
							</div>

							{/* Match Stats */}
							<MatchStatsInput
								team={homeTeam}
								lineup={homeLineup}
								stats={homeStats}
								matchId={matchId}
								onStatsChange={(playerId, stats) =>
									handleStatsChange(playerId, stats, "home")
								}
							/>
						</div>
					) : (
						<div className="space-y-6">
							{/* Formation Selector */}
							<FormationSelector
								formation={awayFormation}
								onFormationChange={(formation) =>
									handleFormationChange(formation, "away")
								}
								teamName={awayTeam?.name}
							/>

							{/* Team Lineup */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								{/* Formation Display */}
								<div className="space-y-4">
									<h4 className="font-semibold text-lg">Formation & Lineup</h4>
									<FormationDisplay
										formation={awayFormation}
										lineup={awayLineup}
										team={awayTeam}
										teamType="away"
										onPlayerDrop={handlePlayerDrop}
										onPlayerRemove={handlePlayerRemove}
									/>
								</div>

								{/* Available Players */}
								<div className="space-y-4">
									<h4 className="font-semibold text-lg">Available Players</h4>
									<div className="text-sm text-gray-500 mb-2">
										{getAvailablePlayers(awayTeam).length} players available
									</div>
									<div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 max-h-[500px] overflow-y-auto p-2">
										{getAvailablePlayers(awayTeam).map((player) => (
											<div key={player.id} className="flex justify-center">
												<PlayerCard
													player={player}
													onDragStart={() => setSelectedPlayer(player)}
												/>
											</div>
										))}
									</div>
								</div>
							</div>

							{/* Match Stats */}
							<MatchStatsInput
								team={awayTeam}
								lineup={awayLineup}
								stats={awayStats}
								matchId={matchId}
								onStatsChange={(playerId, stats) =>
									handleStatsChange(playerId, stats, "away")
								}
							/>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between p-6 border-t bg-gray-50">
					<button
						onClick={onClose}
						className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
					>
						Cancel
					</button>
					<div className="flex items-center space-x-3">
						<button
							onClick={() => {
								setHomeLineup({});
								setAwayLineup({});
								setHomeStats({});
								setAwayStats({});
							}}
							className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center"
						>
							<RotateCcw className="h-4 w-4 mr-2" />
							Reset
						</button>
						<button
							onClick={handleSave}
							disabled={saving}
							className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center"
						>
							<Save className="h-4 w-4 mr-2" />
							{saving ? "Saving..." : "Save Match"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default MatchFixtureEditor;
