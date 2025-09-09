import React, { useState, useEffect } from "react";
import api from "../../utils/api";

const RatingCalculator = () => {
	const [activeTab, setActiveTab] = useState("formulas");
	const [formulas, setFormulas] = useState([]);
	const [positionMappings, setPositionMappings] = useState([]);
	const [calculations, setCalculations] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	// Formula states
	const [showFormulaModal, setShowFormulaModal] = useState(false);
	const [editingFormula, setEditingFormula] = useState(null);
	const [formulaData, setFormulaData] = useState({
		name: "",
		description: "",
		formula: "",
		position: "",
		color: "#4ECDC4",
	});

	// Position mapping states
	const [showMappingModal, setShowMappingModal] = useState(false);
	const [editingMapping, setEditingMapping] = useState(null);
	const [mappingData, setMappingData] = useState({
		position: "",
		formation: "",
		mappedRole: "",
		description: "",
	});

	// Calculation states
	const [showCalculationModal, setShowCalculationModal] = useState(false);
	const [calculationData, setCalculationData] = useState({
		name: "",
		type: "WEEKLY",
		seasonId: "",
		leagueId: "",
		teamId: "",
		formulaId: "",
		fixtureRange: { start: "", end: "" },
	});

	const [seasons, setSeasons] = useState([]);
	const [leagues, setLeagues] = useState([]);
	const [teams, setTeams] = useState([]);

	useEffect(() => {
		fetchData();
		fetchReferenceData();
	}, []);

	const fetchData = async () => {
		setLoading(true);
		try {
			const [formulasRes, mappingsRes, calculationsRes] = await Promise.all([
				api.get("/rating-calculator/formulas"),
				api.get("/rating-calculator/position-mappings"),
				api.get("/rating-calculator/calculations"),
			]);

			setFormulas(formulasRes.data.data);
			setPositionMappings(mappingsRes.data.data);
			setCalculations(calculationsRes.data.data);
		} catch (err) {
			setError("Failed to fetch data");
			console.error("Error fetching data:", err);
		} finally {
			setLoading(false);
		}
	};

	const fetchReferenceData = async () => {
		try {
			const [seasonsRes, leaguesRes, teamsRes] = await Promise.all([
				api.get("/seasons"),
				api.get("/leagues"),
				api.get("/teams"),
			]);

			setSeasons(seasonsRes.data.data || []);
			setLeagues(leaguesRes.data.data || []);
			setTeams(teamsRes.data.data || []);
		} catch (err) {
			console.error("Error fetching reference data:", err);
		}
	};

	const handleFormulaSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			if (editingFormula) {
				await api.put(
					`/rating-calculator/formulas/${editingFormula.id}`,
					formulaData
				);
			} else {
				await api.post("/rating-calculator/formulas", formulaData);
			}

			await fetchData();
			setShowFormulaModal(false);
			setFormulaData({
				name: "",
				description: "",
				formula: "",
				position: "",
				color: "#4ECDC4",
			});
			setEditingFormula(null);
		} catch (err) {
			setError("Failed to save formula");
			console.error("Error saving formula:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleMappingSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			if (editingMapping) {
				await api.put(
					`/rating-calculator/position-mappings/${editingMapping.id}`,
					mappingData
				);
			} else {
				await api.post("/rating-calculator/position-mappings", mappingData);
			}

			await fetchData();
			setShowMappingModal(false);
			setMappingData({
				position: "",
				formation: "",
				mappedRole: "",
				description: "",
			});
			setEditingMapping(null);
		} catch (err) {
			setError("Failed to save position mapping");
			console.error("Error saving mapping:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleCalculationSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			const data = {
				...calculationData,
				fixtureRange:
					calculationData.fixtureRange.start && calculationData.fixtureRange.end
						? JSON.stringify(calculationData.fixtureRange)
						: null,
			};

			await api.post("/rating-calculator/calculations", data);
			await fetchData();
			setShowCalculationModal(false);
			setCalculationData({
				name: "",
				type: "WEEKLY",
				seasonId: "",
				leagueId: "",
				teamId: "",
				formulaId: "",
				fixtureRange: { start: "", end: "" },
			});
		} catch (err) {
			setError("Failed to create calculation");
			console.error("Error creating calculation:", err);
		} finally {
			setLoading(false);
		}
	};

	const executeCalculation = async (calculationId) => {
		setLoading(true);
		try {
			await api.post(
				`/rating-calculator/calculations/${calculationId}/execute`
			);
			await fetchData();
		} catch (err) {
			setError("Failed to execute calculation");
			console.error("Error executing calculation:", err);
		} finally {
			setLoading(false);
		}
	};

	const deleteFormula = async (id) => {
		if (!window.confirm("Are you sure you want to delete this formula?"))
			return;

		try {
			await api.delete(`/rating-calculator/formulas/${id}`);
			await fetchData();
		} catch (err) {
			setError("Failed to delete formula");
			console.error("Error deleting formula:", err);
		}
	};

	const deleteMapping = async (id) => {
		if (!window.confirm("Are you sure you want to delete this mapping?"))
			return;

		try {
			await api.delete(`/rating-calculator/position-mappings/${id}`);
			await fetchData();
		} catch (err) {
			setError("Failed to delete mapping");
			console.error("Error deleting mapping:", err);
		}
	};

	const deleteCalculation = async (id) => {
		if (!window.confirm("Are you sure you want to delete this calculation?"))
			return;

		try {
			await api.delete(`/rating-calculator/calculations/${id}`);
			await fetchData();
		} catch (err) {
			setError("Failed to delete calculation");
			console.error("Error deleting calculation:", err);
		}
	};

	const editFormula = (formula) => {
		setEditingFormula(formula);
		setFormulaData({
			name: formula.name,
			description: formula.description || "",
			formula: formula.formula,
			position: formula.position || "",
			color: formula.color || "#4ECDC4",
		});
		setShowFormulaModal(true);
	};

	const editMapping = (mapping) => {
		setEditingMapping(mapping);
		setMappingData({
			position: mapping.position,
			formation: mapping.formation,
			mappedRole: mapping.mappedRole,
			description: mapping.description || "",
		});
		setShowMappingModal(true);
	};

	if (loading && !formulas.length) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold text-gray-900">
					SAPL Rating Calculator
				</h1>
				<div className="flex space-x-2">
					<button
						onClick={() => setShowFormulaModal(true)}
						className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
					>
						New Formula
					</button>
					<button
						onClick={() => setShowMappingModal(true)}
						className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
					>
						New Mapping
					</button>
					<button
						onClick={() => setShowCalculationModal(true)}
						className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
					>
						New Calculation
					</button>
				</div>
			</div>

			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
					{error}
				</div>
			)}

			{/* Tabs */}
			<div className="border-b border-gray-200">
				<nav className="-mb-px flex space-x-8">
					{["formulas", "mappings", "calculations"].map((tab) => (
						<button
							key={tab}
							onClick={() => setActiveTab(tab)}
							className={`py-2 px-1 border-b-2 font-medium text-sm ${
								activeTab === tab
									? "border-blue-500 text-blue-600"
									: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
							}`}
						>
							{tab.charAt(0).toUpperCase() + tab.slice(1)}
						</button>
					))}
				</nav>
			</div>

			{/* Formulas Tab */}
			{activeTab === "formulas" && (
				<div className="space-y-4">
					<div className="grid gap-4">
						{formulas.map((formula) => (
							<div
								key={formula.id}
								className="bg-white rounded-lg shadow p-6 border-l-4"
								style={{ borderLeftColor: formula.color }}
							>
								<div className="flex justify-between items-start">
									<div className="flex-1">
										<div className="flex items-center space-x-3">
											<h3 className="text-lg font-semibold text-gray-900">
												{formula.name}
											</h3>
											{formula.position && (
												<span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
													{formula.position}
												</span>
											)}
										</div>
										{formula.description && (
											<p className="text-gray-600 mt-1">
												{formula.description}
											</p>
										)}
										<div className="mt-3">
											<code className="bg-gray-100 p-2 rounded text-sm block">
												{formula.formula}
											</code>
										</div>
									</div>
									<div className="flex space-x-2 ml-4">
										<button
											onClick={() => editFormula(formula)}
											className="text-blue-600 hover:text-blue-800"
										>
											Edit
										</button>
										<button
											onClick={() => deleteFormula(formula.id)}
											className="text-red-600 hover:text-red-800"
										>
											Delete
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Position Mappings Tab */}
			{activeTab === "mappings" && (
				<div className="space-y-4">
					<div className="grid gap-4">
						{positionMappings.map((mapping) => (
							<div key={mapping.id} className="bg-white rounded-lg shadow p-6">
								<div className="flex justify-between items-start">
									<div className="flex-1">
										<div className="flex items-center space-x-3">
											<span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded">
												{mapping.position}
											</span>
											<span className="text-gray-400">→</span>
											<span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded">
												{mapping.mappedRole}
											</span>
											<span className="text-gray-500 text-sm">
												in {mapping.formation}
											</span>
										</div>
										{mapping.description && (
											<p className="text-gray-600 mt-2">
												{mapping.description}
											</p>
										)}
									</div>
									<div className="flex space-x-2 ml-4">
										<button
											onClick={() => editMapping(mapping)}
											className="text-blue-600 hover:text-blue-800"
										>
											Edit
										</button>
										<button
											onClick={() => deleteMapping(mapping.id)}
											className="text-red-600 hover:text-red-800"
										>
											Delete
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Calculations Tab */}
			{activeTab === "calculations" && (
				<div className="space-y-4">
					<div className="grid gap-4">
						{calculations.map((calculation) => (
							<div
								key={calculation.id}
								className="bg-white rounded-lg shadow p-6"
							>
								<div className="flex justify-between items-start">
									<div className="flex-1">
										<h3 className="text-lg font-semibold text-gray-900">
											{calculation.name}
										</h3>
										<div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
											<span>Type: {calculation.type}</span>
											<span>Formula: {calculation.formula.name}</span>
											<span>Ratings: {calculation._count.playerRatings}</span>
										</div>
									</div>
									<div className="flex space-x-2 ml-4">
										<button
											onClick={() => executeCalculation(calculation.id)}
											className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
										>
											Execute
										</button>
										<button
											onClick={() => deleteCalculation(calculation.id)}
											className="text-red-600 hover:text-red-800"
										>
											Delete
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Formula Modal */}
			{showFormulaModal && (
				<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
					<div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
						<h3 className="text-lg font-bold text-gray-900 mb-4">
							{editingFormula ? "Edit Formula" : "New Formula"}
						</h3>
						<form onSubmit={handleFormulaSubmit} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Name
								</label>
								<input
									type="text"
									value={formulaData.name}
									onChange={(e) =>
										setFormulaData({ ...formulaData, name: e.target.value })
									}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Description
								</label>
								<textarea
									value={formulaData.description}
									onChange={(e) =>
										setFormulaData({
											...formulaData,
											description: e.target.value,
										})
									}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
									rows="2"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Position (optional)
								</label>
								<select
									value={formulaData.position}
									onChange={(e) =>
										setFormulaData({ ...formulaData, position: e.target.value })
									}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
								>
									<option value="">All Positions</option>
									<option value="GK">Goalkeeper</option>
									<option value="CB">Center Back</option>
									<option value="LB">Left Back</option>
									<option value="RB">Right Back</option>
									<option value="CM">Central Midfielder</option>
									<option value="LM">Left Midfielder</option>
									<option value="RM">Right Midfielder</option>
									<option value="ST">Striker</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Color
								</label>
								<input
									type="color"
									value={formulaData.color}
									onChange={(e) =>
										setFormulaData({ ...formulaData, color: e.target.value })
									}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Formula (JavaScript)
								</label>
								<textarea
									value={formulaData.formula}
									onChange={(e) =>
										setFormulaData({ ...formulaData, formula: e.target.value })
									}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
									rows="3"
									placeholder="(goals * 0.3) + (assists * 0.2) + (rating * 0.5)"
									required
								/>
							</div>
							<div className="flex justify-end space-x-3">
								<button
									type="button"
									onClick={() => {
										setShowFormulaModal(false);
										setEditingFormula(null);
										setFormulaData({
											name: "",
											description: "",
											formula: "",
											position: "",
											color: "#4ECDC4",
										});
									}}
									className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
								>
									{editingFormula ? "Update" : "Create"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Position Mapping Modal */}
			{showMappingModal && (
				<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
					<div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
						<h3 className="text-lg font-bold text-gray-900 mb-4">
							{editingMapping
								? "Edit Position Mapping"
								: "New Position Mapping"}
						</h3>
						<form onSubmit={handleMappingSubmit} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Position
								</label>
								<select
									value={mappingData.position}
									onChange={(e) =>
										setMappingData({ ...mappingData, position: e.target.value })
									}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
									required
								>
									<option value="">Select Position</option>
									<option value="GK">Goalkeeper</option>
									<option value="CB">Center Back</option>
									<option value="LB">Left Back</option>
									<option value="RB">Right Back</option>
									<option value="CM">Central Midfielder</option>
									<option value="LM">Left Midfielder</option>
									<option value="RM">Right Midfielder</option>
									<option value="ST">Striker</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Formation
								</label>
								<input
									type="text"
									value={mappingData.formation}
									onChange={(e) =>
										setMappingData({
											...mappingData,
											formation: e.target.value,
										})
									}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
									placeholder="e.g., 4-4-2, 3-5-2"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Mapped Role
								</label>
								<input
									type="text"
									value={mappingData.mappedRole}
									onChange={(e) =>
										setMappingData({
											...mappingData,
											mappedRole: e.target.value,
										})
									}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
									placeholder="e.g., WINGER, WINGBACK, FULLBACK"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Description
								</label>
								<textarea
									value={mappingData.description}
									onChange={(e) =>
										setMappingData({
											...mappingData,
											description: e.target.value,
										})
									}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
									rows="2"
								/>
							</div>
							<div className="flex justify-end space-x-3">
								<button
									type="button"
									onClick={() => {
										setShowMappingModal(false);
										setEditingMapping(null);
										setMappingData({
											position: "",
											formation: "",
											mappedRole: "",
											description: "",
										});
									}}
									className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
								>
									{editingMapping ? "Update" : "Create"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Calculation Modal */}
			{showCalculationModal && (
				<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
					<div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
						<h3 className="text-lg font-bold text-gray-900 mb-4">
							New Calculation
						</h3>
						<form onSubmit={handleCalculationSubmit} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Name
								</label>
								<input
									type="text"
									value={calculationData.name}
									onChange={(e) =>
										setCalculationData({
											...calculationData,
											name: e.target.value,
										})
									}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Type
								</label>
								<select
									value={calculationData.type}
									onChange={(e) =>
										setCalculationData({
											...calculationData,
											type: e.target.value,
										})
									}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
								>
									<option value="WEEKLY">Team of the Week</option>
									<option value="SEASONAL">Team of the Season</option>
									<option value="CUSTOM">Custom Range</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Formula
								</label>
								<select
									value={calculationData.formulaId}
									onChange={(e) =>
										setCalculationData({
											...calculationData,
											formulaId: e.target.value,
										})
									}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
									required
								>
									<option value="">Select Formula</option>
									{formulas.map((formula) => (
										<option key={formula.id} value={formula.id}>
											{formula.name}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Season
								</label>
								<select
									value={calculationData.seasonId}
									onChange={(e) =>
										setCalculationData({
											...calculationData,
											seasonId: e.target.value,
										})
									}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
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
								<label className="block text-sm font-medium text-gray-700">
									League
								</label>
								<select
									value={calculationData.leagueId}
									onChange={(e) =>
										setCalculationData({
											...calculationData,
											leagueId: e.target.value,
										})
									}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
								>
									<option value="">Select League</option>
									{leagues.map((league) => (
										<option key={league.id} value={league.id}>
											{league.name}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Team
								</label>
								<select
									value={calculationData.teamId}
									onChange={(e) =>
										setCalculationData({
											...calculationData,
											teamId: e.target.value,
										})
									}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
								>
									<option value="">Select Team</option>
									{teams.map((team) => (
										<option key={team.id} value={team.id}>
											{team.name}
										</option>
									))}
								</select>
							</div>
							{calculationData.type === "CUSTOM" && (
								<>
									<div>
										<label className="block text-sm font-medium text-gray-700">
											Start Date
										</label>
										<input
											type="date"
											value={calculationData.fixtureRange.start}
											onChange={(e) =>
												setCalculationData({
													...calculationData,
													fixtureRange: {
														...calculationData.fixtureRange,
														start: e.target.value,
													},
												})
											}
											className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700">
											End Date
										</label>
										<input
											type="date"
											value={calculationData.fixtureRange.end}
											onChange={(e) =>
												setCalculationData({
													...calculationData,
													fixtureRange: {
														...calculationData.fixtureRange,
														end: e.target.value,
													},
												})
											}
											className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
										/>
									</div>
								</>
							)}
							<div className="flex justify-end space-x-3">
								<button
									type="button"
									onClick={() => setShowCalculationModal(false)}
									className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
								>
									Create
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default RatingCalculator;
