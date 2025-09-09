import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../utils/api";

const OCRStats = () => {
	const { user } = useAuth();
	const [selectedPlayer, setSelectedPlayer] = useState("");
	const [selectedSeason, setSelectedSeason] = useState("");
	const [selectedMatch, setSelectedMatch] = useState("");
	const [players, setPlayers] = useState([]);
	const [seasons, setSeasons] = useState([]);
	const [matches, setMatches] = useState([]);
	const [uploadedFile, setUploadedFile] = useState(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [ocrResult, setOcrResult] = useState(null);
	const [extractedStats, setExtractedStats] = useState({});
	const [isApplying, setIsApplying] = useState(false);
	const [message, setMessage] = useState("");

	// Load players, seasons, and matches on component mount
	useEffect(() => {
		loadPlayers();
		loadSeasons();
		loadMatches();
	}, []);

	const loadPlayers = async () => {
		try {
			const response = await api.get("/players");
			if (response.data.success) {
				setPlayers(response.data.data);
			}
		} catch (error) {
			console.error("Error loading players:", error);
			setMessage("Error loading players");
		}
	};

	const loadSeasons = async () => {
		try {
			const response = await api.get("/seasons");
			if (response.data.success) {
				setSeasons(response.data.data);
				// Set default to Season 29 if available
				const season29 = response.data.data.find((s) => s.name === "Season 29");
				if (season29) {
					setSelectedSeason(season29.id);
				}
			}
		} catch (error) {
			console.error("Error loading seasons:", error);
		}
	};

	const loadMatches = async () => {
		try {
			const response = await api.get("/matches");
			if (response.data.success) {
				setMatches(response.data.data);
			}
		} catch (error) {
			console.error("Error loading matches:", error);
		}
	};

	const handleFileUpload = (event) => {
		const file = event.target.files[0];
		if (file) {
			// Validate file type
			if (!file.type.startsWith("image/")) {
				setMessage("Please select an image file");
				return;
			}

			// Validate file size (10MB limit)
			if (file.size > 10 * 1024 * 1024) {
				setMessage("File size must be less than 10MB");
				return;
			}

			setUploadedFile(file);
			setMessage("");
		}
	};

	const processScreenshot = async () => {
		if (!uploadedFile || !selectedPlayer) {
			setMessage("Please select a player and upload a screenshot");
			return;
		}

		setIsProcessing(true);
		setMessage("");

		try {
			const formData = new FormData();
			formData.append("screenshot", uploadedFile);
			formData.append("playerId", selectedPlayer);
			if (selectedSeason) formData.append("seasonId", selectedSeason);
			if (selectedMatch) formData.append("matchId", selectedMatch);

			const response = await api.post("/ocr/process-screenshot", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			if (response.data.success) {
				setOcrResult(response.data.data);
				setExtractedStats(response.data.data.extractedStats);
				setMessage("Screenshot processed successfully!");
			} else {
				setMessage(`Error: ${response.data.error}`);
			}
		} catch (error) {
			console.error("Error processing screenshot:", error);
			setMessage(
				`Error processing screenshot: ${
					error.response?.data?.error || error.message
				}`
			);
		} finally {
			setIsProcessing(false);
		}
	};

	const applyStatistics = async () => {
		if (!selectedPlayer || Object.keys(extractedStats).length === 0) {
			setMessage("No statistics to apply");
			return;
		}

		setIsApplying(true);
		setMessage("");

		try {
			const response = await api.post("/ocr/apply-stats", {
				playerId: selectedPlayer,
				seasonId: selectedSeason,
				matchId: selectedMatch,
				statistics: extractedStats,
				isMatchStats: !!selectedMatch,
			});

			if (response.data.success) {
				setMessage("Statistics applied successfully!");
				// Reset form
				setUploadedFile(null);
				setOcrResult(null);
				setExtractedStats({});
				document.getElementById("screenshot-upload").value = "";
			} else {
				setMessage(`Error: ${response.data.error}`);
			}
		} catch (error) {
			console.error("Error applying statistics:", error);
			setMessage(
				`Error applying statistics: ${
					error.response?.data?.error || error.message
				}`
			);
		} finally {
			setIsApplying(false);
		}
	};

	const formatStatValue = (key, value) => {
		if (typeof value === "number") {
			// Format percentages
			if (
				key.includes("Rate") ||
				key.includes("Accuracy") ||
				key.includes("Success")
			) {
				return `${value.toFixed(1)}%`;
			}
			// Format decimal numbers
			if (key.includes("xG") || key.includes("xA") || key.includes("Rating")) {
				return value.toFixed(2);
			}
			// Format integers
			return Math.round(value).toString();
		}
		return value.toString();
	};

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="bg-white rounded-lg shadow-md p-6">
					<h1 className="text-3xl font-bold text-gray-900 mb-8">
						OCR Statistics Upload
					</h1>
					<p className="text-gray-600 mb-8">
						Upload a screenshot of player statistics and automatically extract
						the data using OCR technology.
					</p>

					{/* Player Selection */}
					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Select Player *
						</label>
						<select
							value={selectedPlayer}
							onChange={(e) => setSelectedPlayer(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="">Choose a player...</option>
							{players.map((player) => (
								<option key={player.id} value={player.id}>
									{player.firstName} {player.lastName} ({player.gamertag})
								</option>
							))}
						</select>
					</div>

					{/* Season Selection */}
					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Season
						</label>
						<select
							value={selectedSeason}
							onChange={(e) => setSelectedSeason(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="">Choose a season...</option>
							{seasons.map((season) => (
								<option key={season.id} value={season.id}>
									{season.name}
								</option>
							))}
						</select>
					</div>

					{/* Match Selection (Optional) */}
					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Match (Optional - for match-specific stats)
						</label>
						<select
							value={selectedMatch}
							onChange={(e) => setSelectedMatch(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="">Choose a match...</option>
							{matches.map((match) => (
								<option key={match.id} value={match.id}>
									{match.homeTeam?.name} vs {match.awayTeam?.name} -{" "}
									{new Date(match.date).toLocaleDateString()}
								</option>
							))}
						</select>
					</div>

					{/* File Upload */}
					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Upload Screenshot *
						</label>
						<input
							id="screenshot-upload"
							type="file"
							accept="image/*"
							onChange={handleFileUpload}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<p className="text-sm text-gray-500 mt-1">
							Supported formats: JPG, PNG, GIF. Max size: 10MB
						</p>
					</div>

					{/* Process Button */}
					<div className="mb-6">
						<button
							onClick={processScreenshot}
							disabled={!uploadedFile || !selectedPlayer || isProcessing}
							className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
						>
							{isProcessing ? "Processing..." : "Process Screenshot"}
						</button>
					</div>

					{/* OCR Results */}
					{ocrResult && (
						<div className="mb-6">
							<h3 className="text-lg font-semibold text-gray-900 mb-4">
								OCR Results
							</h3>

							{/* Player Info */}
							<div className="bg-gray-50 p-4 rounded-md mb-4">
								<h4 className="font-medium text-gray-900">
									Player Information
								</h4>
								<p>
									<strong>Name:</strong> {ocrResult.player.name}
								</p>
								<p>
									<strong>Gamertag:</strong> {ocrResult.player.gamertag}
								</p>
								{ocrResult.player.team && (
									<p>
										<strong>Team:</strong> {ocrResult.player.team}
									</p>
								)}
							</div>

							{/* Extracted Statistics */}
							{Object.keys(extractedStats).length > 0 && (
								<div className="bg-green-50 p-4 rounded-md mb-4">
									<h4 className="font-medium text-gray-900 mb-3">
										Extracted Statistics
									</h4>
									<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
										{Object.entries(extractedStats).map(([key, value]) => (
											<div key={key} className="bg-white p-3 rounded border">
												<div className="text-sm font-medium text-gray-600 capitalize">
													{key.replace(/([A-Z])/g, " $1").trim()}
												</div>
												<div className="text-lg font-semibold text-gray-900">
													{formatStatValue(key, value)}
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Apply Statistics Button */}
							<button
								onClick={applyStatistics}
								disabled={
									Object.keys(extractedStats).length === 0 || isApplying
								}
								className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
							>
								{isApplying ? "Applying..." : "Apply Statistics"}
							</button>
						</div>
					)}

					{/* Message Display */}
					{message && (
						<div
							className={`p-4 rounded-md ${
								message.includes("Error") || message.includes("error")
									? "bg-red-50 text-red-700"
									: "bg-green-50 text-green-700"
							}`}
						>
							{message}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default OCRStats;
