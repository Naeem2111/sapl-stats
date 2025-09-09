import React, { useState, useCallback } from "react";
import { BarChart3, Save, Camera, Upload } from "lucide-react";
import api from "../../utils/api";

// StatInput component moved outside to prevent re-creation on every render
const StatInput = React.memo(
	({
		label,
		value,
		onChange,
		type = "number",
		min = 0,
		max = 100,
		step = 1,
	}) => {
		const handleChange = (e) => {
			const newValue =
				type === "number" ? Number(e.target.value) : e.target.value;
			onChange(newValue);
		};

		return (
			<div className="space-y-1">
				<label className="text-sm font-medium text-gray-700">{label}</label>
				{type === "boolean" ? (
					<label className="flex items-center space-x-2">
						<input
							type="checkbox"
							checked={value}
							onChange={(e) => onChange(e.target.checked)}
							className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
						/>
						<span className="text-sm text-gray-600">Yes</span>
					</label>
				) : (
					<input
						type={type}
						value={value}
						onChange={handleChange}
						min={min}
						max={max}
						step={step}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
					/>
				)}
			</div>
		);
	}
);

// Individual player stats form component that maintains its own state
const PlayerStatsForm = React.memo(
	({ playerId, position, player, initialStats, onStatsChange }) => {
		const [isExpanded, setIsExpanded] = useState(false);
		const [localStats, setLocalStats] = useState(initialStats);

		// Update local stats when initialStats change
		React.useEffect(() => {
			setLocalStats(initialStats);
		}, [initialStats]);

		const handleStatChange = useCallback(
			(statName, value) => {
				const newStats = {
					...localStats,
					[statName]: value,
				};
				setLocalStats(newStats);
				onStatsChange(playerId, newStats);
			},
			[localStats, onStatsChange, playerId]
		);

		const toggleExpanded = useCallback(() => {
			setIsExpanded((prev) => !prev);
		}, []);

		if (!player) return null;

		return (
			<div className="bg-white rounded-lg border border-gray-200 p-4">
				{/* Player Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<div
							className={`px-3 py-1 rounded-full text-xs font-medium ${getPositionColor(
								position
							)}`}
						>
							{position}
						</div>
						<div>
							<h4 className="font-medium text-gray-900">{player.name}</h4>
							<p className="text-sm text-gray-500">
								{player.team?.name || "No Team"}
							</p>
						</div>
					</div>
					<button
						onClick={toggleExpanded}
						className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
					>
						{isExpanded ? "Collapse" : "Expand"}
					</button>
				</div>

				{/* Quick Stats Summary */}
				<div className="mt-3 grid grid-cols-4 gap-2 text-center">
					<div className="bg-gray-50 rounded p-2">
						<div className="text-lg font-bold text-green-600">
							{localStats.goals || 0}
						</div>
						<div className="text-xs text-gray-500">Goals</div>
					</div>
					<div className="bg-gray-50 rounded p-2">
						<div className="text-lg font-bold text-blue-600">
							{localStats.assists || 0}
						</div>
						<div className="text-xs text-gray-500">Assists</div>
					</div>
					<div className="bg-gray-50 rounded p-2">
						<div className="text-lg font-bold text-yellow-600">
							{localStats.rating || 0}
						</div>
						<div className="text-xs text-gray-500">Rating</div>
					</div>
					<div className="bg-gray-50 rounded p-2">
						<div className="text-lg font-bold text-purple-600">
							{localStats.minutesPlayed || 90}
						</div>
						<div className="text-xs text-gray-500">Minutes</div>
					</div>
				</div>

				{/* Detailed Stats Form */}
				{isExpanded && (
					<div className="mt-4 space-y-4">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<StatInput
								label="Goals"
								value={localStats.goals}
								onChange={(value) => handleStatChange("goals", value)}
								min={0}
								max={10}
							/>
							<StatInput
								label="Assists"
								value={localStats.assists}
								onChange={(value) => handleStatChange("assists", value)}
								min={0}
								max={10}
							/>
							<StatInput
								label="Shots"
								value={localStats.shots}
								onChange={(value) => handleStatChange("shots", value)}
								min={0}
								max={20}
							/>
							<StatInput
								label="Passes"
								value={localStats.passes}
								onChange={(value) => handleStatChange("passes", value)}
								min={0}
								max={100}
							/>
						</div>

						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<StatInput
								label="Pass Accuracy (%)"
								value={localStats.passAccuracy}
								onChange={(value) => handleStatChange("passAccuracy", value)}
								min={0}
								max={100}
							/>
							<StatInput
								label="Tackles"
								value={localStats.tackles}
								onChange={(value) => handleStatChange("tackles", value)}
								min={0}
								max={20}
							/>
							<StatInput
								label="Interceptions"
								value={localStats.interceptions}
								onChange={(value) => handleStatChange("interceptions", value)}
								min={0}
								max={20}
							/>
							<StatInput
								label="Saves"
								value={localStats.saves}
								onChange={(value) => handleStatChange("saves", value)}
								min={0}
								max={15}
							/>
						</div>

						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<StatInput
								label="Rating"
								value={localStats.rating}
								onChange={(value) => handleStatChange("rating", value)}
								min={0}
								max={10}
								step={0.1}
							/>
							<StatInput
								label="Minutes Played"
								value={localStats.minutesPlayed}
								onChange={(value) => handleStatChange("minutesPlayed", value)}
								min={0}
								max={120}
							/>
							<StatInput
								label="Yellow Cards"
								value={localStats.yellowCards}
								onChange={(value) => handleStatChange("yellowCards", value)}
								min={0}
								max={3}
							/>
							<StatInput
								label="Red Cards"
								value={localStats.redCards}
								onChange={(value) => handleStatChange("redCards", value)}
								min={0}
								max={1}
							/>
						</div>

						{/* Boolean Stats */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<StatInput
								label="Clean Sheet"
								value={localStats.cleanSheet}
								onChange={(value) => handleStatChange("cleanSheet", value)}
								type="boolean"
							/>
							<StatInput
								label="Man of the Match"
								value={localStats.manOfTheMatch}
								onChange={(value) => handleStatChange("manOfTheMatch", value)}
								type="boolean"
							/>
						</div>

						{/* Advanced Stats */}
						<div className="border-t pt-4">
							<h5 className="text-sm font-medium text-gray-700 mb-3">
								Advanced Stats
							</h5>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<StatInput
									label="xG"
									value={localStats.xG}
									onChange={(value) => handleStatChange("xG", value)}
									min={0}
									max={5}
									step={0.1}
								/>
								<StatInput
									label="xA"
									value={localStats.xA}
									onChange={(value) => handleStatChange("xA", value)}
									min={0}
									max={5}
									step={0.1}
								/>
								<StatInput
									label="Goals Conceded"
									value={localStats.goalsConceded}
									onChange={(value) => handleStatChange("goalsConceded", value)}
									min={0}
									max={10}
								/>
								<StatInput
									label="Tackle Success Rate (%)"
									value={localStats.tackleSuccessRate}
									onChange={(value) =>
										handleStatChange("tackleSuccessRate", value)
									}
									min={0}
									max={100}
								/>
							</div>
						</div>
					</div>
				)}
			</div>
		);
	}
);

// Helper function to get position colors
const getPositionColor = (position) => {
	const colors = {
		GK: "bg-red-100 text-red-800",
		CB: "bg-blue-100 text-blue-800",
		LB: "bg-green-100 text-green-800",
		RB: "bg-green-100 text-green-800",
		CDM: "bg-yellow-100 text-yellow-800",
		CM: "bg-orange-100 text-orange-800",
		CAM: "bg-purple-100 text-purple-800",
		LW: "bg-pink-100 text-pink-800",
		RW: "bg-pink-100 text-pink-800",
		ST: "bg-indigo-100 text-indigo-800",
		CF: "bg-gray-100 text-gray-800",
	};
	return colors[position] || "bg-gray-100 text-gray-800";
};

const MatchStatsInput = ({ team, lineup, stats, onStatsChange, matchId }) => {
	const [isProcessingOCR, setIsProcessingOCR] = useState(false);
	const [ocrResult, setOcrResult] = useState(null);

	const getPlayerInLineup = (playerId) => {
		return team?.players?.find((player) => player.id === playerId);
	};

	const getPlayerStats = (playerId) => {
		return (
			stats[playerId] || {
				goals: 0,
				assists: 0,
				shots: 0,
				passes: 0,
				passAccuracy: 0,
				tackles: 0,
				interceptions: 0,
				saves: 0,
				cleanSheet: false,
				rating: 0,
				minutesPlayed: 90,
				yellowCards: 0,
				redCards: 0,
				// Comprehensive stats
				possessionLost: 0,
				possessionWon: 0,
				manOfTheMatch: false,
				tackleSuccessRate: 0,
				savesSuccessRate: 0,
				goalsConceded: 0,
				// Advanced stats
				xG: 0,
				totalDuelSuccess: 0,
				playersBeatenByPass: 0,
				xA: 0,
				tacklesAttempted: 0,
			}
		);
	};

	const handleStatChange = useCallback(
		(playerId, statName, value) => {
			const currentStats = getPlayerStats(playerId);
			const newStats = {
				...currentStats,
				[statName]: value,
			};
			onStatsChange(playerId, newStats);
		},
		[onStatsChange]
	);

	const handleFileUpload = async (event) => {
		const file = event.target.files[0];
		if (!file) return;

		setIsProcessingOCR(true);
		try {
			const formData = new FormData();
			formData.append("screenshot", file);

			const response = await api.post("/ocr/process-screenshot", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			if (response.data.success) {
				setOcrResult(response.data.data);
				// Auto-fill stats for the first player in lineup
				const firstPlayerId = Object.values(lineup)[0];
				if (firstPlayerId && response.data.data.statistics) {
					const extractedStats = response.data.data.statistics;
					handleStatChange(firstPlayerId, "goals", extractedStats.goals || 0);
					handleStatChange(
						firstPlayerId,
						"assists",
						extractedStats.assists || 0
					);
					handleStatChange(firstPlayerId, "shots", extractedStats.shots || 0);
					handleStatChange(firstPlayerId, "passes", extractedStats.passes || 0);
					handleStatChange(
						firstPlayerId,
						"passAccuracy",
						extractedStats.passAccuracy || 0
					);
					handleStatChange(
						firstPlayerId,
						"tackles",
						extractedStats.tackles || 0
					);
					handleStatChange(
						firstPlayerId,
						"interceptions",
						extractedStats.interceptions || 0
					);
					handleStatChange(firstPlayerId, "saves", extractedStats.saves || 0);
					handleStatChange(firstPlayerId, "rating", extractedStats.rating || 0);
					handleStatChange(
						firstPlayerId,
						"minutesPlayed",
						extractedStats.minutesPlayed || 90
					);
					handleStatChange(
						firstPlayerId,
						"yellowCards",
						extractedStats.yellowCards || 0
					);
					handleStatChange(
						firstPlayerId,
						"redCards",
						extractedStats.redCards || 0
					);
					handleStatChange(
						firstPlayerId,
						"cleanSheet",
						extractedStats.cleanSheet || false
					);
					handleStatChange(firstPlayerId, "xG", extractedStats.xG || 0);
					handleStatChange(
						firstPlayerId,
						"totalDuelSuccess",
						extractedStats.totalDuelSuccess || 0
					);
					handleStatChange(
						firstPlayerId,
						"playersBeatenByPass",
						extractedStats.playersBeatenByPass || 0
					);
					handleStatChange(firstPlayerId, "xA", extractedStats.xA || 0);
					handleStatChange(
						firstPlayerId,
						"tacklesAttempted",
						extractedStats.tacklesAttempted || 0
					);
				}
			}
		} catch (error) {
			console.error("OCR processing error:", error);
			alert("Failed to process screenshot. Please try again.");
		} finally {
			setIsProcessingOCR(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center space-x-2">
					<BarChart3 className="h-5 w-5 text-primary-600" />
					<h3 className="text-lg font-semibold">Match Statistics</h3>
				</div>
				<div className="flex items-center space-x-2">
					<label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
						<Camera className="h-4 w-4 mr-2" />
						{isProcessingOCR ? "Processing..." : "📷 OCR Upload"}
						<input
							type="file"
							accept="image/*"
							onChange={handleFileUpload}
							className="hidden"
							disabled={isProcessingOCR}
						/>
					</label>
				</div>
			</div>

			{/* OCR Result Display */}
			{ocrResult && (
				<div className="bg-green-50 border border-green-200 rounded-lg p-4">
					<div className="flex items-center space-x-2 mb-2">
						<Upload className="h-4 w-4 text-green-600" />
						<h4 className="text-sm font-semibold text-green-800">
							OCR Results
						</h4>
					</div>
					<div className="text-sm text-green-700">
						<p>Confidence: {ocrResult.confidence}%</p>
						<p>
							Extracted text: {ocrResult.extractedText?.substring(0, 100)}...
						</p>
					</div>
				</div>
			)}

			{/* OCR Upload Section */}
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<Camera className="h-5 w-5 text-blue-600" />
						<div>
							<h4 className="text-sm font-semibold text-blue-800">
								Quick Stats Input
							</h4>
							<p className="text-xs text-blue-600">
								Upload a screenshot to auto-fill player statistics
							</p>
						</div>
					</div>
					<label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
						<Camera className="h-4 w-4 mr-2" />
						{isProcessingOCR ? "Processing..." : "📷 Upload Screenshot"}
						<input
							type="file"
							accept="image/*"
							onChange={handleFileUpload}
							className="hidden"
							disabled={isProcessingOCR}
						/>
					</label>
				</div>
			</div>

			{/* Team Stats Summary */}
			<div className="bg-gray-50 rounded-lg p-4">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
					<div>
						<div className="text-2xl font-bold text-primary-600">
							{Object.values(lineup).length}
						</div>
						<div className="text-sm text-gray-500">Players in Lineup</div>
					</div>
					<div>
						<div className="text-2xl font-bold text-green-600">
							{Object.values(stats).reduce(
								(sum, playerStats) => sum + (playerStats.goals || 0),
								0
							)}
						</div>
						<div className="text-sm text-gray-500">Total Goals</div>
					</div>
					<div>
						<div className="text-2xl font-bold text-blue-600">
							{Object.values(stats).reduce(
								(sum, playerStats) => sum + (playerStats.assists || 0),
								0
							)}
						</div>
						<div className="text-sm text-gray-500">Total Assists</div>
					</div>
					<div>
						<div className="text-2xl font-bold text-yellow-600">
							{Object.values(stats).length > 0
								? (
										Object.values(stats).reduce(
											(sum, playerStats) => sum + (playerStats.rating || 0),
											0
										) / Object.values(stats).length
								  ).toFixed(1)
								: 0}
						</div>
						<div className="text-sm text-gray-500">Avg Rating</div>
					</div>
				</div>
			</div>

			{/* Player Stats Forms */}
			<div className="space-y-4">
				{Object.entries(lineup).map(([position, playerId]) => {
					const player = getPlayerInLineup(playerId);
					const initialStats = getPlayerStats(playerId);

					return (
						<PlayerStatsForm
							key={`${position}-${playerId}`}
							playerId={playerId}
							position={position}
							player={player}
							initialStats={initialStats}
							onStatsChange={handleStatChange}
						/>
					);
				})}
			</div>

			{/* Save Button */}
			<div className="flex justify-end">
				<button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center">
					<Save className="h-4 w-4 mr-2" />
					Save All Stats
				</button>
			</div>
		</div>
	);
};

export default MatchStatsInput;
