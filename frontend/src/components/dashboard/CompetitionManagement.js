import React, { useState, useEffect } from "react";
import api from "../../utils/api";

const CompetitionManagement = () => {
	const [competitions, setCompetitions] = useState([]);
	const [selectedCompetition, setSelectedCompetition] = useState(null);
	const [fixtures, setFixtures] = useState([]);
	const [teams, setTeams] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [activeTab, setActiveTab] = useState("fixtures");

	// Fixture management states
	const [selectedFixtures, setSelectedFixtures] = useState([]);
	const [bulkAction, setBulkAction] = useState("");
	const [newMatchTime, setNewMatchTime] = useState("");

	// League table adjustment states
	const [selectedTeam, setSelectedTeam] = useState("");
	const [adjustmentType, setAdjustmentType] = useState("points");
	const [adjustmentValue, setAdjustmentValue] = useState("");
	const [adjustmentReason, setAdjustmentReason] = useState("");

	useEffect(() => {
		fetchCompetitions();
		fetchTeams();
	}, []);

	useEffect(() => {
		if (selectedCompetition) {
			fetchFixtures();
		}
	}, [selectedCompetition]);

	const fetchCompetitions = async () => {
		try {
			setLoading(true);
			const response = await api.get("/competition-management/competitions");
			setCompetitions(response.data.data || []);
		} catch (err) {
			setError("Failed to fetch competitions");
			console.error("Error fetching competitions:", err);
		} finally {
			setLoading(false);
		}
	};

	const fetchFixtures = async () => {
		if (!selectedCompetition) return;
		try {
			const response = await api.get(
				`/competition-management/competitions/${selectedCompetition}/fixtures`
			);
			setFixtures(response.data.data || []);
		} catch (err) {
			setError("Failed to fetch fixtures");
			console.error("Error fetching fixtures:", err);
		}
	};

	const fetchTeams = async () => {
		try {
			const response = await api.get("/teams");
			setTeams(response.data.data || []);
		} catch (err) {
			setError("Failed to fetch teams");
			console.error("Error fetching teams:", err);
		}
	};

	const handleFixtureSelection = (fixtureId) => {
		setSelectedFixtures((prev) =>
			prev.includes(fixtureId)
				? prev.filter((id) => id !== fixtureId)
				: [...prev, fixtureId]
		);
	};

	const handleSelectAllFixtures = () => {
		if (selectedFixtures.length === fixtures.length) {
			setSelectedFixtures([]);
		} else {
			setSelectedFixtures(fixtures.map((f) => f.id));
		}
	};

	const handleBulkAction = async () => {
		if (!bulkAction || selectedFixtures.length === 0) {
			setError("Please select an action and fixtures");
			return;
		}

		try {
			setLoading(true);
			const actionData = {
				fixtureIds: selectedFixtures,
				action: bulkAction,
				newMatchTime: newMatchTime || null,
			};

			await api.post(
				"/competition-management/competitions/bulk-action",
				actionData
			);
			setSuccess(
				`Successfully ${bulkAction} ${selectedFixtures.length} fixtures`
			);
			setSelectedFixtures([]);
			setBulkAction("");
			setNewMatchTime("");
			fetchFixtures();
		} catch (err) {
			setError(
				`Failed to ${bulkAction} fixtures: ${
					err.response?.data?.message || err.message
				}`
			);
		} finally {
			setLoading(false);
		}
	};

	const handleLeagueAdjustment = async () => {
		if (!selectedTeam || !adjustmentValue) {
			setError("Please select a team and enter adjustment value");
			return;
		}

		try {
			setLoading(true);
			const adjustmentData = {
				teamId: selectedTeam,
				type: adjustmentType,
				value: parseInt(adjustmentValue),
				reason: adjustmentReason,
			};

			await api.post(
				"/competition-management/competitions/league-adjustment",
				adjustmentData
			);
			setSuccess(`Successfully adjusted ${adjustmentType} for team`);
			setSelectedTeam("");
			setAdjustmentValue("");
			setAdjustmentReason("");
		} catch (err) {
			setError(
				`Failed to adjust league table: ${
					err.response?.data?.message || err.message
				}`
			);
		} finally {
			setLoading(false);
		}
	};

	const lockFixtureStats = async (fixtureId) => {
		try {
			await api.post(
				`/competition-management/fixtures/${fixtureId}/lock-stats`
			);
			setSuccess("Fixture stats locked successfully");
			fetchFixtures();
		} catch (err) {
			setError("Failed to lock fixture stats");
		}
	};

	const unlockFixtureStats = async (fixtureId) => {
		try {
			await api.post(
				`/competition-management/fixtures/${fixtureId}/unlock-stats`
			);
			setSuccess("Fixture stats unlocked successfully");
			fetchFixtures();
		} catch (err) {
			setError("Failed to unlock fixture stats");
		}
	};

	const formatDateTime = (dateTime) => {
		return new Date(dateTime).toLocaleString();
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "COMPLETED":
				return "bg-green-100 text-green-800";
			case "IN_PROGRESS":
				return "bg-blue-100 text-blue-800";
			case "SCHEDULED":
				return "bg-yellow-100 text-yellow-800";
			case "CANCELLED":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<div className="space-y-6">
			<div className="bg-white shadow rounded-lg">
				<div className="px-6 py-4 border-b border-gray-200">
					<h2 className="text-xl font-semibold text-gray-900">
						Competition Management
					</h2>
				</div>

				{/* Competition Selection */}
				<div className="p-6">
					<div className="mb-4">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Select Competition
						</label>
						<select
							value={selectedCompetition || ""}
							onChange={(e) => setSelectedCompetition(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="">Choose a competition</option>
							{competitions.map((comp) => (
								<option key={comp.id} value={comp.id}>
									{comp.name} - {comp.season?.name}
								</option>
							))}
						</select>
					</div>

					{selectedCompetition && (
						<div className="flex space-x-1 border-b border-gray-200">
							<button
								onClick={() => setActiveTab("fixtures")}
								className={`px-4 py-2 text-sm font-medium ${
									activeTab === "fixtures"
										? "border-b-2 border-blue-500 text-blue-600"
										: "text-gray-500 hover:text-gray-700"
								}`}
							>
								Fixture Management
							</button>
							<button
								onClick={() => setActiveTab("league")}
								className={`px-4 py-2 text-sm font-medium ${
									activeTab === "league"
										? "border-b-2 border-blue-500 text-blue-600"
										: "text-gray-500 hover:text-gray-700"
								}`}
							>
								League Adjustments
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Error/Success Messages */}
			{error && (
				<div className="bg-red-50 border border-red-200 rounded-md p-4">
					<div className="text-sm text-red-700">{error}</div>
				</div>
			)}

			{success && (
				<div className="bg-green-50 border border-green-200 rounded-md p-4">
					<div className="text-sm text-green-700">{success}</div>
				</div>
			)}

			{/* Fixture Management Tab */}
			{activeTab === "fixtures" && selectedCompetition && (
				<div className="space-y-6">
					{/* Bulk Actions */}
					<div className="bg-white shadow rounded-lg p-6">
						<h3 className="text-lg font-medium text-gray-900 mb-4">
							Bulk Actions
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Action
								</label>
								<select
									value={bulkAction}
									onChange={(e) => setBulkAction(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="">Select action</option>
									<option value="lock-stats">Lock Stats</option>
									<option value="unlock-stats">Unlock Stats</option>
									<option value="delete-results">Delete Results</option>
									<option value="update-time">Update Match Time</option>
								</select>
							</div>
							{bulkAction === "update-time" && (
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										New Match Time
									</label>
									<input
										type="datetime-local"
										value={newMatchTime}
										onChange={(e) => setNewMatchTime(e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							)}
							<div className="flex items-end">
								<button
									onClick={handleBulkAction}
									disabled={
										loading || !bulkAction || selectedFixtures.length === 0
									}
									className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{loading
										? "Processing..."
										: `Apply to ${selectedFixtures.length} fixtures`}
								</button>
							</div>
						</div>
					</div>

					{/* Fixtures List */}
					<div className="bg-white shadow rounded-lg">
						<div className="px-6 py-4 border-b border-gray-200">
							<div className="flex items-center justify-between">
								<h3 className="text-lg font-medium text-gray-900">
									Fixtures ({fixtures.length})
								</h3>
								<button
									onClick={handleSelectAllFixtures}
									className="text-sm text-blue-600 hover:text-blue-800"
								>
									{selectedFixtures.length === fixtures.length
										? "Deselect All"
										: "Select All"}
								</button>
							</div>
						</div>
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											<input
												type="checkbox"
												checked={
													selectedFixtures.length === fixtures.length &&
													fixtures.length > 0
												}
												onChange={handleSelectAllFixtures}
												className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
											/>
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Match
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Date & Time
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Status
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Stats Locked
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{fixtures.map((fixture) => (
										<tr key={fixture.id} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap">
												<input
													type="checkbox"
													checked={selectedFixtures.includes(fixture.id)}
													onChange={() => handleFixtureSelection(fixture.id)}
													className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
												/>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{fixture.homeTeam?.name} vs {fixture.awayTeam?.name}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{formatDateTime(fixture.date)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span
													className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
														fixture.status
													)}`}
												>
													{fixture.status}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{fixture.statsLocked ? "Yes" : "No"}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
												{fixture.statsLocked ? (
													<button
														onClick={() => unlockFixtureStats(fixture.id)}
														className="text-red-600 hover:text-red-900"
													>
														Unlock
													</button>
												) : (
													<button
														onClick={() => lockFixtureStats(fixture.id)}
														className="text-green-600 hover:text-green-900"
													>
														Lock
													</button>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			)}

			{/* League Adjustments Tab */}
			{activeTab === "league" && selectedCompetition && (
				<div className="bg-white shadow rounded-lg p-6">
					<h3 className="text-lg font-medium text-gray-900 mb-4">
						League Table Adjustments
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Team
							</label>
							<select
								value={selectedTeam}
								onChange={(e) => setSelectedTeam(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="">Select team</option>
								{teams.map((team) => (
									<option key={team.id} value={team.id}>
										{team.name}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Adjustment Type
							</label>
							<select
								value={adjustmentType}
								onChange={(e) => setAdjustmentType(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="points">Points</option>
								<option value="goalDifference">Goal Difference</option>
								<option value="goalsFor">Goals For</option>
								<option value="goalsAgainst">Goals Against</option>
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Value (use negative for deductions)
							</label>
							<input
								type="number"
								value={adjustmentValue}
								onChange={(e) => setAdjustmentValue(e.target.value)}
								placeholder="e.g., -3 for point deduction"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Reason
							</label>
							<input
								type="text"
								value={adjustmentReason}
								onChange={(e) => setAdjustmentReason(e.target.value)}
								placeholder="Reason for adjustment"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
					</div>
					<div className="mt-6">
						<button
							onClick={handleLeagueAdjustment}
							disabled={loading || !selectedTeam || !adjustmentValue}
							className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? "Processing..." : "Apply Adjustment"}
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default CompetitionManagement;
