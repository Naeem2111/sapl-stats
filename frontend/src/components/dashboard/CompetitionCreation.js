import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
	Trophy,
	Plus,
	Users,
	Calendar,
	Globe,
	RefreshCw,
	CheckCircle,
	XCircle,
	AlertCircle,
	Download,
} from "lucide-react";
import api from "../../utils/api";

const CompetitionCreation = () => {
	const { user, isCompetitionAdmin, isLeagueAdmin } = useAuth();
	const [loading, setLoading] = useState(false);
	const [saplLoading, setSaplLoading] = useState(false);
	const [seasons, setSeasons] = useState([]);
	const [leagues, setLeagues] = useState([]);
	const [cups, setCups] = useState([]);
	const [saplTeams, setSaplTeams] = useState([]);
	const [localTeams, setLocalTeams] = useState([]);
	const [selectedTeams, setSelectedTeams] = useState([]);
	const [teamSearchTerm, setTeamSearchTerm] = useState("");
	const [leagueTeamSearchTerm, setLeagueTeamSearchTerm] = useState("");
	const [saplConnection, setSaplConnection] = useState(null);
	const [importStatus, setImportStatus] = useState(null); // 'success', 'error', or null
	const [saplSeasons, setSaplSeasons] = useState([]);
	const [selectedSeasonId, setSelectedSeasonId] = useState("825650177"); // Default to Season 28
	const [activeTab, setActiveTab] = useState("competition"); // 'season', 'league', 'competition'

	// Form state
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		seasonId: "",
		format: "KNOCKOUT",
		startDate: "",
		endDate: "",
		maxTeams: "",
		minTeams: "",
		competitionType: "CUP",
		matchDuration: 90,
		pointsForWin: 3,
		pointsForDraw: 1,
		pointsForLoss: 0,
	});

	// Season form state
	const [seasonForm, setSeasonForm] = useState({
		name: "",
		description: "",
		startDate: "",
		endDate: "",
		saplId: "",
	});

	// League form state
	const [leagueForm, setLeagueForm] = useState({
		name: "",
		description: "",
		seasonId: "",
		startDate: "",
		endDate: "",
		saplId: "",
		saplData: null,
	});
	const [selectedLeagueTeams, setSelectedLeagueTeams] = useState([]);

	useEffect(() => {
		console.log("CompetitionCreation component mounted");
		console.log("isCompetitionAdmin:", isCompetitionAdmin());
		console.log("isLeagueAdmin:", isLeagueAdmin());

		if (isCompetitionAdmin() || isLeagueAdmin()) {
			console.log("Fetching initial data...");
			fetchSeasons();
			fetchLeagues();
			fetchCups();
			fetchLocalTeams();
			testSaplConnection();
			fetchSAPLSeasons();
		}
	}, []); // Only run once when component mounts

	const fetchSeasons = async () => {
		try {
			const response = await api.get("/seasons");
			setSeasons(response.data.data || []);
		} catch (error) {
			console.error("Error fetching seasons:", error);
		}
	};

	const fetchLeagues = async () => {
		try {
			const response = await api.get("/leagues");
			setLeagues(response.data.data || []);
		} catch (error) {
			console.error("Error fetching leagues:", error);
		}
	};

	const fetchCups = async () => {
		try {
			const response = await api.get("/cups");
			setCups(response.data.data || []);
		} catch (error) {
			console.error("Error fetching cups:", error);
		}
	};

	const fetchLocalTeams = async () => {
		try {
			const response = await api.get("/teams");
			setLocalTeams(response.data.data || []);
		} catch (error) {
			console.error("Error fetching local teams:", error);
		}
	};

	const testSaplConnection = async () => {
		try {
			setSaplLoading(true);
			const response = await api.get(`/sapl/test-connection`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
				timeout: 15000, // 15 second timeout
			});
			setSaplConnection(response.data.data);
		} catch (error) {
			console.error("Error testing SAPL connection:", error);
			setSaplConnection({ connected: false, message: "Connection failed" });
		} finally {
			setSaplLoading(false);
		}
	};

	const fetchSaplTeams = async () => {
		try {
			setSaplLoading(true);
			const response = await api.get(`/sapl/teams`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
				timeout: 15000, // 15 second timeout
			});
			setSaplTeams(response.data.data.teams || []);
		} catch (error) {
			console.error("Error fetching SAPL teams:", error);
		} finally {
			setSaplLoading(false);
		}
	};

	const fetchSAPLSeasons = async () => {
		try {
			const response = await api.get(`/sapl/seasons`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
				timeout: 15000,
			});
			setSaplSeasons(response.data.data.seasons || []);
		} catch (error) {
			console.error("Error fetching SAPL seasons:", error);
		}
	};

	const syncSaplTeams = async () => {
		try {
			setSaplLoading(true);
			const response = await api.post(
				`/sapl/sync-teams`,
				{},
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
					timeout: 30000, // 30 second timeout
				}
			);

			// Refresh local teams after sync
			await fetchLocalTeams();

			// Show success message
			alert(
				`Teams synced successfully! Created: ${response.data.data.created}, Updated: ${response.data.data.updated}`
			);
		} catch (error) {
			console.error("Error syncing SAPL teams:", error);
			alert("Error syncing teams from SAPL");
		} finally {
			setSaplLoading(false);
		}
	};

	const importSeasonData = async () => {
		try {
			setSaplLoading(true);
			setImportStatus(null); // Reset status

			// Show user that import is starting
			console.log(`Starting Season ${selectedSeasonId} data import...`);

			const response = await api.post(
				`/sapl/import-season`,
				{ seasonId: selectedSeasonId },
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
					timeout: 60000, // 60 second timeout
				}
			);

			// Refresh local data after import
			await fetchLocalTeams();
			await fetchSeasons();

			// Show detailed success message
			const data = response.data.data;
			console.log("Import successful:", data);
			setImportStatus("success");

			// Auto-clear success status after 5 seconds
			setTimeout(() => setImportStatus(null), 5000);

			alert(
				`Season ${selectedSeasonId} data imported successfully!\n\n` +
					`Teams: ${data.teams.created} created, ${data.teams.updated} updated\n` +
					`Fixtures: ${data.fixtures.created} created, ${data.fixtures.updated} updated\n` +
					`Season: ${data.seasons.created} created, ${data.seasons.updated} updated\n\n` +
					`Total: ${data.total.created} created, ${data.total.updated} updated`
			);
		} catch (error) {
			console.error("Error importing Season 28 data:", error);
			setImportStatus("error");

			// Auto-clear error status after 10 seconds
			setTimeout(() => setImportStatus(null), 10000);

			// Provide more specific error messages
			let errorMessage = "Error importing Season 28 data from SAPL";
			if (error.response) {
				// Server responded with error
				errorMessage = `Server Error: ${
					error.response.data?.message || error.response.statusText
				}`;
			} else if (error.request) {
				// Request was made but no response
				errorMessage = "No response from server. Please check your connection.";
			} else if (error.code === "ECONNABORTED") {
				// Request timeout
				errorMessage = "Request timed out. The import may still be processing.";
			}

			alert(errorMessage);
		} finally {
			setSaplLoading(false);
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleTeamSelection = (teamId, checked) => {
		if (checked) {
			setSelectedTeams((prev) => [...prev, teamId]);
		} else {
			setSelectedTeams((prev) => prev.filter((id) => id !== teamId));
		}
	};

	// Filter teams based on search term
	const filteredTeams = localTeams.filter((team) =>
		team.name.toLowerCase().includes(teamSearchTerm.toLowerCase())
	);

	// Filter league teams based on search term
	const filteredLeagueTeams = localTeams.filter((team) =>
		team.name.toLowerCase().includes(leagueTeamSearchTerm.toLowerCase())
	);

	const handleLeagueTeamSelection = (teamId, checked) => {
		if (checked) {
			setSelectedLeagueTeams((prev) => [...prev, teamId]);
		} else {
			setSelectedLeagueTeams((prev) => prev.filter((id) => id !== teamId));
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (
			!formData.name ||
			!formData.seasonId ||
			!formData.startDate ||
			!formData.endDate
		) {
			alert("Please fill in all required fields");
			return;
		}

		if (selectedTeams.length === 0) {
			alert("Please select at least one team");
			return;
		}

		try {
			setLoading(true);

			// Create the competition/cup
			const competitionData = {
				...formData,
				maxTeams: formData.maxTeams ? parseInt(formData.maxTeams) : null,
				minTeams: formData.minTeams ? parseInt(formData.minTeams) : null,
			};

			let competitionResponse;
			if (formData.competitionType === "CUP") {
				competitionResponse = await api.post(`/cups`, competitionData, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				});
			} else if (formData.competitionType === "LEAGUE") {
				// Create league with round robin fixtures
				competitionResponse = await api.post(
					`/leagues`,
					{
						name: formData.name,
						description: formData.description,
						seasonId: formData.seasonId,
						teamIds: selectedTeams,
						startDate: formData.startDate,
						endDate: formData.endDate,
						matchDuration: formData.matchDuration,
						pointsForWin: formData.pointsForWin,
						pointsForDraw: formData.pointsForDraw,
						pointsForLoss: formData.pointsForLoss,
					},
					{
						headers: {
							Authorization: `Bearer ${localStorage.getItem("token")}`,
						},
					}
				);
			} else {
				// For seasons, we'll use the existing season creation
				competitionResponse = await api.post(
					`/seasons`,
					{
						name: formData.name,
						startDate: formData.startDate,
						endDate: formData.endDate,
					},
					{
						headers: {
							Authorization: `Bearer ${localStorage.getItem("token")}`,
						},
					}
				);
			}

			const competition = competitionResponse.data.data;

			// Add teams to the competition
			if (formData.competitionType === "CUP") {
				for (const teamId of selectedTeams) {
					await api.post(
						`/cups/${competition.id}/teams`,
						{ teamId },
						{
							headers: {
								Authorization: `Bearer ${localStorage.getItem("token")}`,
							},
						}
					);
				}
			}

			alert(`${formData.competitionType} created successfully!`);

			// Reset form
			setFormData({
				name: "",
				description: "",
				seasonId: "",
				format: "KNOCKOUT",
				startDate: "",
				endDate: "",
				maxTeams: "",
				minTeams: "",
				competitionType: "CUP",
			});
			setSelectedTeams([]);
		} catch (error) {
			console.error("Error creating competition:", error);
			alert("Error creating competition. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	// Season creation function
	const handleSeasonSubmit = async (e) => {
		e.preventDefault();

		if (!seasonForm.name || !seasonForm.startDate || !seasonForm.endDate) {
			alert("Please fill in all required fields");
			return;
		}

		try {
			setLoading(true);
			const response = await api.post("/seasons", seasonForm);
			alert("Season created successfully!");
			setSeasonForm({
				name: "",
				description: "",
				startDate: "",
				endDate: "",
				saplId: "",
			});
			fetchSeasons();
		} catch (error) {
			console.error("Error creating season:", error);
			alert("Error creating season. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	// League creation function
	const handleLeagueSubmit = async (e) => {
		e.preventDefault();

		if (
			!leagueForm.name ||
			!leagueForm.seasonId ||
			!leagueForm.startDate ||
			!leagueForm.endDate
		) {
			alert("Please fill in all required fields");
			return;
		}

		if (selectedLeagueTeams.length === 0) {
			alert("Please select at least one team for the league");
			return;
		}

		try {
			setLoading(true);
			const leagueData = {
				...leagueForm,
				teamIds: selectedLeagueTeams,
			};
			const response = await api.post("/leagues", leagueData);
			alert("League created successfully!");
			setLeagueForm({
				name: "",
				description: "",
				seasonId: "",
				startDate: "",
				endDate: "",
				saplId: "",
				saplData: null,
			});
			setSelectedLeagueTeams([]);
			fetchLeagues();
		} catch (error) {
			console.error("Error creating league:", error);
			alert("Error creating league. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const getConnectionStatusIcon = () => {
		if (saplConnection?.connected) {
			return <CheckCircle className="h-5 w-5 text-green-500" />;
		} else if (saplConnection?.connected === false) {
			return <XCircle className="h-5 w-5 text-red-500" />;
		} else {
			return <AlertCircle className="h-5 w-5 text-yellow-500" />;
		}
	};

	const getConnectionStatusText = () => {
		if (saplConnection?.connected) {
			return "Connected to SAPL";
		} else if (saplConnection?.connected === false) {
			return "SAPL Connection Failed";
		} else {
			return "Testing SAPL Connection...";
		}
	};

	if (!isCompetitionAdmin() && !isLeagueAdmin()) {
		return (
			<div className="p-6">
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<div className="flex items-center">
						<XCircle className="h-5 w-5 text-red-500 mr-2" />
						<h3 className="text-red-800 font-medium">Access Denied</h3>
					</div>
					<p className="text-red-600 mt-1">
						You need COMPETITION_ADMIN or LEAGUE_ADMIN privileges to access this
						feature.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6">
			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold text-gray-900 flex items-center">
								<Trophy className="h-8 w-8 text-blue-600 mr-3" />
								Competition Management
							</h1>
							<p className="text-gray-600 mt-2">
								Create seasons, leagues, and competitions
							</p>
						</div>
					</div>

					{/* Tabs */}
					<div className="mt-6">
						<div className="border-b border-gray-200">
							<nav className="-mb-px flex space-x-8">
								<button
									onClick={() => setActiveTab("season")}
									className={`py-2 px-1 border-b-2 font-medium text-sm ${
										activeTab === "season"
											? "border-blue-500 text-blue-600"
											: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
									}`}
								>
									<Calendar className="h-4 w-4 inline mr-2" />
									Create Season
								</button>
								<button
									onClick={() => setActiveTab("league")}
									className={`py-2 px-1 border-b-2 font-medium text-sm ${
										activeTab === "league"
											? "border-blue-500 text-blue-600"
											: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
									}`}
								>
									<Users className="h-4 w-4 inline mr-2" />
									Create League
								</button>
								<button
									onClick={() => setActiveTab("competition")}
									className={`py-2 px-1 border-b-2 font-medium text-sm ${
										activeTab === "competition"
											? "border-blue-500 text-blue-600"
											: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
									}`}
								>
									<Trophy className="h-4 w-4 inline mr-2" />
									Create Competition
								</button>
							</nav>
						</div>
					</div>
				</div>

				{/* Tab Content */}
				{activeTab === "season" && (
					<div className="max-w-2xl mx-auto">
						<div className="bg-white rounded-lg shadow-md p-6">
							<h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
								<Calendar className="h-5 w-5 text-blue-600 mr-2" />
								Create New Season
							</h2>
							<form onSubmit={handleSeasonSubmit} className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Season Name *
									</label>
									<input
										type="text"
										value={seasonForm.name}
										onChange={(e) =>
											setSeasonForm({ ...seasonForm, name: e.target.value })
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="e.g., Season 30"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Description
									</label>
									<textarea
										value={seasonForm.description}
										onChange={(e) =>
											setSeasonForm({
												...seasonForm,
												description: e.target.value,
											})
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										rows="3"
										placeholder="Optional description"
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Start Date *
										</label>
										<input
											type="date"
											value={seasonForm.startDate}
											onChange={(e) =>
												setSeasonForm({
													...seasonForm,
													startDate: e.target.value,
												})
											}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											required
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											End Date *
										</label>
										<input
											type="date"
											value={seasonForm.endDate}
											onChange={(e) =>
												setSeasonForm({
													...seasonForm,
													endDate: e.target.value,
												})
											}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											required
										/>
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										SAPL Season ID
									</label>
									<input
										type="text"
										value={seasonForm.saplId}
										onChange={(e) =>
											setSeasonForm({ ...seasonForm, saplId: e.target.value })
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="Optional SAPL season ID"
									/>
								</div>
								<button
									type="submit"
									disabled={loading}
									className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
								>
									{loading ? "Creating..." : "Create Season"}
								</button>
							</form>
						</div>
					</div>
				)}

				{activeTab === "league" && (
					<div className="max-w-2xl mx-auto">
						<div className="bg-white rounded-lg shadow-md p-6">
							<h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
								<Users className="h-5 w-5 text-blue-600 mr-2" />
								Create New League
							</h2>
							<form onSubmit={handleLeagueSubmit} className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										League Name *
									</label>
									<input
										type="text"
										value={leagueForm.name}
										onChange={(e) =>
											setLeagueForm({ ...leagueForm, name: e.target.value })
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="e.g., Premier League"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Season *
									</label>
									<select
										value={leagueForm.seasonId}
										onChange={(e) =>
											setLeagueForm({ ...leagueForm, seasonId: e.target.value })
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										required
									>
										<option value="">Select Season</option>
										{seasons.map((season) => (
											<option key={season.id} value={season.id}>
												{season.name}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Description
									</label>
									<textarea
										value={leagueForm.description}
										onChange={(e) =>
											setLeagueForm({
												...leagueForm,
												description: e.target.value,
											})
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										rows="3"
										placeholder="Optional description"
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Start Date *
										</label>
										<input
											type="date"
											value={leagueForm.startDate}
											onChange={(e) =>
												setLeagueForm({
													...leagueForm,
													startDate: e.target.value,
												})
											}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											required
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											End Date *
										</label>
										<input
											type="date"
											value={leagueForm.endDate}
											onChange={(e) =>
												setLeagueForm({
													...leagueForm,
													endDate: e.target.value,
												})
											}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											required
										/>
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										SAPL League ID
									</label>
									<input
										type="text"
										value={leagueForm.saplId}
										onChange={(e) =>
											setLeagueForm({ ...leagueForm, saplId: e.target.value })
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="Optional SAPL league ID"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Select Teams * ({selectedLeagueTeams.length} selected)
									</label>

									{/* League Team Search Bar */}
									<div className="mb-3">
										<input
											type="text"
											placeholder="Search teams..."
											value={leagueTeamSearchTerm}
											onChange={(e) => setLeagueTeamSearchTerm(e.target.value)}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>

									<div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3">
										{localTeams.length === 0 ? (
											<p className="text-gray-500 text-center py-4">
												No teams available. Sync teams from SAPL first.
											</p>
										) : filteredLeagueTeams.length === 0 ? (
											<p className="text-gray-500 text-center py-4">
												No teams found matching "{leagueTeamSearchTerm}"
											</p>
										) : (
											<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
												{filteredLeagueTeams.map((team) => (
													<label
														key={team.id}
														className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
													>
														<input
															type="checkbox"
															checked={selectedLeagueTeams.includes(team.id)}
															onChange={(e) =>
																handleLeagueTeamSelection(
																	team.id,
																	e.target.checked
																)
															}
															className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
														/>
														<div className="flex items-center">
															{team.logoUrl && (
																<img
																	src={team.logoUrl}
																	alt={team.name}
																	className="h-5 w-5 rounded-full mr-2"
																/>
															)}
															<span className="text-sm text-gray-700">
																{team.name}
															</span>
														</div>
													</label>
												))}
											</div>
										)}
									</div>
								</div>
								<button
									type="submit"
									disabled={loading || selectedLeagueTeams.length === 0}
									className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{loading ? "Creating..." : "Create League"}
								</button>
							</form>
						</div>
					</div>
				)}

				{activeTab === "competition" && (
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{/* SAPL Integration Panel */}
						<div className="lg:col-span-1">
							<div className="bg-white rounded-lg shadow-md p-6">
								<h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
									<Globe className="h-5 w-5 text-blue-600 mr-2" />
									SAPL Integration
								</h2>

								{/* Connection Status */}
								<div className="mb-4">
									<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
										<div className="flex items-center">
											{getConnectionStatusIcon()}
											<span className="ml-2 text-sm font-medium text-gray-700">
												{getConnectionStatusText()}
											</span>
											{saplConnection?.demo && (
												<span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
													DEMO MODE
												</span>
											)}
										</div>
										<button
											onClick={testSaplConnection}
											disabled={saplLoading}
											className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
										>
											<RefreshCw
												className={`h-4 w-4 ${
													saplLoading ? "animate-spin" : ""
												}`}
											/>
										</button>
									</div>
								</div>

								{/* SAPL Actions */}
								<div className="space-y-3">
									<button
										onClick={fetchSaplTeams}
										disabled={saplLoading || !saplConnection?.connected}
										className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
									>
										<Users className="h-4 w-4 mr-2" />
										Fetch SAPL Teams
									</button>

									<button
										onClick={syncSaplTeams}
										disabled={saplLoading || !saplConnection?.connected}
										className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
									>
										<RefreshCw className="h-4 w-4 mr-2" />
										Sync SAPL Teams
									</button>

									{/* Season Import */}
									<div className="border-t pt-3">
										<h4 className="text-sm font-medium text-gray-700 mb-2">
											Season Import
										</h4>

										{/* Season Selector */}
										<div className="mb-3">
											<label className="block text-xs text-gray-600 mb-1">
												Select Season to Import
											</label>
											<select
												value={selectedSeasonId}
												onChange={(e) => setSelectedSeasonId(e.target.value)}
												className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
											>
												{saplSeasons.map((season) => (
													<option key={season.id} value={season.id}>
														{season.name || `Season ${season.id}`}
													</option>
												))}
											</select>
										</div>

										<button
											onClick={importSeasonData}
											disabled={saplLoading || !saplConnection?.connected}
											className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
										>
											{saplLoading ? (
												<>
													<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
													Importing...
												</>
											) : (
												<>
													<Download className="h-4 w-4 mr-2" />
													Import Season Data
												</>
											)}
										</button>
										<p className="text-xs text-gray-500 mt-1 text-center">
											Teams, Fixtures & Results for Selected Season
										</p>
										{saplConnection?.demo && (
											<p className="text-xs text-yellow-600 mt-1 text-center font-medium">
												⚠️ Running in Demo Mode - Using Sample Data
											</p>
										)}
										{!saplConnection?.demo && (
											<p className="text-xs text-green-600 mt-1 text-center font-medium">
												✅ Connected to Real SAPL API
											</p>
										)}

										{/* Import Status Indicator */}
										{importStatus && (
											<div
												className={`mt-2 p-2 rounded-lg text-xs text-center ${
													importStatus === "success"
														? "bg-green-100 text-green-800"
														: "bg-red-100 text-red-800"
												}`}
											>
												{importStatus === "success"
													? "✅ Import completed successfully!"
													: "❌ Import failed. Check console for details."}
											</div>
										)}
									</div>
								</div>

								{/* SAPL Teams List */}
								{saplTeams.length > 0 && (
									<div className="mt-6">
										<h3 className="text-lg font-medium text-gray-900 mb-3">
											SAPL Teams ({saplTeams.length})
										</h3>
										<div className="max-h-64 overflow-y-auto space-y-2">
											{saplTeams.map((team) => (
												<div
													key={team.id}
													className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
												>
													<div className="flex items-center">
														{team.logo && (
															<img
																src={team.logo}
																alt={team.name}
																className="h-6 w-6 rounded-full mr-2"
															/>
														)}
														<span className="text-sm font-medium text-gray-700">
															{team.name}
														</span>
													</div>
													<span className="text-xs text-gray-500">
														{team.division}
													</span>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Competition Creation Form */}
						<div className="lg:col-span-2">
							<div className="bg-white rounded-lg shadow-md p-6">
								<h2 className="text-xl font-semibold text-gray-900 mb-6">
									Create New Competition
								</h2>

								<form onSubmit={handleSubmit} className="space-y-6">
									{/* Competition Type */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Competition Type
										</label>
										<select
											name="competitionType"
											value={formData.competitionType}
											onChange={handleInputChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										>
											<option value="CUP">Cup Tournament</option>
											<option value="LEAGUE">League (Round Robin)</option>
										</select>
									</div>

									{/* Basic Information */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Competition Name *
											</label>
											<input
												type="text"
												name="name"
												value={formData.name}
												onChange={handleInputChange}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
												placeholder="e.g., Champions Cup 2025"
												required
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Season *
											</label>
											<select
												name="seasonId"
												value={formData.seasonId}
												onChange={handleInputChange}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
												required
											>
												<option value="">Select Season</option>
												{seasons.map((season) => (
													<option key={season.id} value={season.id}>
														{season.name}
													</option>
												))}
											</select>
										</div>
									</div>

									{/* Description */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Description
										</label>
										<textarea
											name="description"
											value={formData.description}
											onChange={handleInputChange}
											rows={3}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
											placeholder="Describe the competition..."
										/>
									</div>

									{/* Cup-specific fields */}
									{formData.competitionType === "CUP" && (
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Tournament Format *
												</label>
												<select
													name="format"
													value={formData.format}
													onChange={handleInputChange}
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
													required
												>
													<option value="KNOCKOUT">Single Elimination</option>
													<option value="DOUBLE_KNOCKOUT">
														Double Elimination
													</option>
													<option value="GROUP_KNOCKOUT">
														Group Stage + Knockout
													</option>
													<option value="ROUND_ROBIN">Round Robin</option>
													<option value="SWISS_SYSTEM">Swiss System</option>
												</select>
											</div>

											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Max Teams
												</label>
												<input
													type="number"
													name="maxTeams"
													value={formData.maxTeams}
													onChange={handleInputChange}
													min="2"
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
													placeholder="e.g., 16"
												/>
											</div>
										</div>
									)}

									{/* League-specific fields */}
									{formData.competitionType === "LEAGUE" && (
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Match Duration (minutes)
												</label>
												<input
													type="number"
													name="matchDuration"
													value={formData.matchDuration}
													onChange={handleInputChange}
													min="60"
													max="120"
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
													placeholder="90"
												/>
											</div>

											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Points for Win
												</label>
												<input
													type="number"
													name="pointsForWin"
													value={formData.pointsForWin}
													onChange={handleInputChange}
													min="1"
													max="10"
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
													placeholder="3"
												/>
											</div>

											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Points for Draw
												</label>
												<input
													type="number"
													name="pointsForDraw"
													value={formData.pointsForDraw}
													onChange={handleInputChange}
													min="0"
													max="5"
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
													placeholder="1"
												/>
											</div>

											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Points for Loss
												</label>
												<input
													type="number"
													name="pointsForLoss"
													value={formData.pointsForLoss}
													onChange={handleInputChange}
													min="0"
													max="5"
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
													placeholder="0"
												/>
											</div>
										</div>
									)}

									{/* Dates */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Start Date *
											</label>
											<input
												type="date"
												name="startDate"
												value={formData.startDate}
												onChange={handleInputChange}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
												required
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												End Date *
											</label>
											<input
												type="date"
												name="endDate"
												value={formData.endDate}
												onChange={handleInputChange}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
												required
											/>
										</div>
									</div>

									{/* Team Selection */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Select Teams * ({selectedTeams.length} selected)
										</label>

										{/* Team Search Bar */}
										<div className="mb-3">
											<input
												type="text"
												placeholder="Search teams..."
												value={teamSearchTerm}
												onChange={(e) => setTeamSearchTerm(e.target.value)}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
											/>
										</div>

										<div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3">
											{localTeams.length === 0 ? (
												<p className="text-gray-500 text-center py-4">
													No teams available. Sync teams from SAPL first.
												</p>
											) : filteredTeams.length === 0 ? (
												<p className="text-gray-500 text-center py-4">
													No teams found matching "{teamSearchTerm}"
												</p>
											) : (
												<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
													{filteredTeams.map((team) => (
														<label
															key={team.id}
															className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
														>
															<input
																type="checkbox"
																checked={selectedTeams.includes(team.id)}
																onChange={(e) =>
																	handleTeamSelection(team.id, e.target.checked)
																}
																className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
															/>
															<div className="flex items-center">
																{team.logoUrl && (
																	<img
																		src={team.logoUrl}
																		alt={team.name}
																		className="h-5 w-5 rounded-full mr-2"
																	/>
																)}
																<span className="text-sm text-gray-700">
																	{team.name}
																</span>
															</div>
														</label>
													))}
												</div>
											)}
										</div>
									</div>

									{/* Submit Button */}
									<div className="flex justify-end">
										<button
											type="submit"
											disabled={loading || selectedTeams.length === 0}
											className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
										>
											{loading ? (
												<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
											) : (
												<Plus className="h-4 w-4 mr-2" />
											)}
											Create Competition
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default CompetitionCreation;
