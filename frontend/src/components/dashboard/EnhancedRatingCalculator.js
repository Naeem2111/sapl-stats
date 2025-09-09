import React, { useState, useEffect } from "react";
import api, { publicApi } from "../../utils/api";

const EnhancedRatingCalculator = () => {
	const [activeTab, setActiveTab] = useState("formulas");
	const [formulas, setFormulas] = useState([]);
	const [positionMappings, setPositionMappings] = useState([]);
	const [calculations, setCalculations] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	// Dynamic data
	const [statsFields, setStatsFields] = useState([]);
	const [groupedFields, setGroupedFields] = useState({});
	const [formations, setFormations] = useState([]);
	const [positions, setPositions] = useState([]);
	const [mappedRoles, setMappedRoles] = useState([]);

	// Formula builder states
	const [showFormulaBuilder, setShowFormulaBuilder] = useState(false);
	const [editingFormula, setEditingFormula] = useState(null);
	const [formulaData, setFormulaData] = useState({
		name: "",
		description: "",
		formula: "",
		position: "",
		color: "#4ECDC4",
	});
	const [formulaBuilder, setFormulaBuilder] = useState({
		selectedFields: [],
		operators: [],
		values: [],
		formula: "",
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

	useEffect(() => {
		fetchData();
		fetchDynamicData();
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

	const fetchDynamicData = async () => {
		try {
			const [fieldsRes, formationsRes, positionsRes, rolesRes] =
				await Promise.all([
					publicApi.get("/stats-fields/available"),
					publicApi.get("/stats-fields/formations"),
					publicApi.get("/stats-fields/positions"),
					publicApi.get("/stats-fields/mapped-roles"),
				]);

			setStatsFields(fieldsRes.data.data.fields);
			setGroupedFields(fieldsRes.data.data.grouped);
			setFormations(formationsRes.data.data);
			setPositions(positionsRes.data.data);
			setMappedRoles(rolesRes.data.data);
		} catch (err) {
			console.error("Error fetching dynamic data:", err);
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
			setShowFormulaBuilder(false);
			resetFormulaData();
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
			resetMappingData();
		} catch (err) {
			setError("Failed to save position mapping");
			console.error("Error saving mapping:", err);
		} finally {
			setLoading(false);
		}
	};

	const resetFormulaData = () => {
		setFormulaData({
			name: "",
			description: "",
			formula: "",
			position: "",
			color: "#4ECDC4",
		});
		setFormulaBuilder({
			selectedFields: [],
			operators: [],
			values: [],
			formula: "",
		});
		setEditingFormula(null);
	};

	const resetMappingData = () => {
		setMappingData({
			position: "",
			formation: "",
			mappedRole: "",
			description: "",
		});
		setEditingMapping(null);
	};

	const addFieldToFormula = (field) => {
		const newFormula = formulaBuilder.formula + field.name;
		setFormulaBuilder({
			...formulaBuilder,
			formula: newFormula,
			selectedFields: [...formulaBuilder.selectedFields, field],
		});
		setFormulaData({
			...formulaData,
			formula: newFormula,
		});
	};

	const addOperatorToFormula = (operator) => {
		const newFormula = formulaBuilder.formula + ` ${operator} `;
		setFormulaBuilder({
			...formulaBuilder,
			formula: newFormula,
			operators: [...formulaBuilder.operators, operator],
		});
		setFormulaData({
			...formulaData,
			formula: newFormula,
		});
	};

	const addValueToFormula = (value) => {
		const newFormula = formulaBuilder.formula + value;
		setFormulaBuilder({
			...formulaBuilder,
			formula: newFormula,
			values: [...formulaBuilder.values, value],
		});
		setFormulaData({
			...formulaData,
			formula: newFormula,
		});
	};

	const clearFormula = () => {
		setFormulaBuilder({
			selectedFields: [],
			operators: [],
			values: [],
			formula: "",
		});
		setFormulaData({
			...formulaData,
			formula: "",
		});
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

	const editFormula = (formula) => {
		setEditingFormula(formula);
		setFormulaData({
			name: formula.name,
			description: formula.description || "",
			formula: formula.formula,
			position: formula.position || "",
			color: formula.color || "#4ECDC4",
		});
		setShowFormulaBuilder(true);
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
					Enhanced SAPL Rating Calculator
				</h1>
				<div className="flex space-x-2">
					<button
						onClick={() => setShowFormulaBuilder(true)}
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
					{["formulas", "mappings"].map((tab) => (
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

			{/* Enhanced Formula Builder Modal */}
			{showFormulaBuilder && (
				<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
					<div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
						<h3 className="text-lg font-bold text-gray-900 mb-4">
							{editingFormula ? "Edit Formula" : "Build New Formula"}
						</h3>

						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* Formula Builder */}
							<div className="space-y-4">
								<h4 className="text-md font-semibold text-gray-700">
									Formula Builder
								</h4>

								{/* Basic Info */}
								<div className="grid grid-cols-2 gap-4">
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
											Position
										</label>
										<select
											value={formulaData.position}
											onChange={(e) =>
												setFormulaData({
													...formulaData,
													position: e.target.value,
												})
											}
											className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
										>
											<option value="">All Positions</option>
											{positions.map((pos) => (
												<option key={pos.value} value={pos.value}>
													{pos.label}
												</option>
											))}
										</select>
									</div>
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

								{/* Formula Display */}
								<div>
									<label className="block text-sm font-medium text-gray-700">
										Formula
									</label>
									<div className="mt-1 bg-gray-100 p-3 rounded-md min-h-[60px] border">
										<code className="text-sm">
											{formulaBuilder.formula ||
												"Click on stats and operators to build your formula..."}
										</code>
									</div>
									<button
										type="button"
										onClick={clearFormula}
										className="mt-2 text-sm text-red-600 hover:text-red-800"
									>
										Clear Formula
									</button>
								</div>
							</div>

							{/* Stats Fields */}
							<div className="space-y-4">
								<h4 className="text-md font-semibold text-gray-700">
									Available Stats
								</h4>

								{/* Math Operators */}
								<div>
									<h5 className="text-sm font-medium text-gray-600 mb-2">
										Math Operators
									</h5>
									<div className="flex flex-wrap gap-2">
										{["+", "-", "*", "/", "(", ")", "?"].map((op) => (
											<button
												key={op}
												onClick={() => addOperatorToFormula(op)}
												className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
											>
												{op}
											</button>
										))}
									</div>
								</div>

								{/* Stats Fields by Category */}
								{Object.entries(groupedFields).map(([category, fields]) => (
									<div key={category}>
										<h5 className="text-sm font-medium text-gray-600 mb-2">
											{category}
										</h5>
										<div className="flex flex-wrap gap-2">
											{fields.map((field) => (
												<button
													key={field.name}
													onClick={() => addFieldToFormula(field)}
													className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
													title={field.description}
												>
													{field.name}
												</button>
											))}
										</div>
									</div>
								))}

								{/* Common Values */}
								<div>
									<h5 className="text-sm font-medium text-gray-600 mb-2">
										Common Values
									</h5>
									<div className="flex flex-wrap gap-2">
										{["0.1", "0.2", "0.3", "0.5", "1", "2", "3", "5", "10"].map(
											(val) => (
												<button
													key={val}
													onClick={() => addValueToFormula(val)}
													className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm hover:bg-yellow-200"
												>
													{val}
												</button>
											)
										)}
									</div>
								</div>
							</div>
						</div>

						<div className="flex justify-end space-x-3 mt-6">
							<button
								type="button"
								onClick={() => {
									setShowFormulaBuilder(false);
									resetFormulaData();
								}}
								className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
							>
								Cancel
							</button>
							<button
								onClick={handleFormulaSubmit}
								className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
							>
								{editingFormula ? "Update" : "Create"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Enhanced Position Mapping Modal */}
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
									{positions.map((pos) => (
										<option key={pos.value} value={pos.value}>
											{pos.label}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Formation
								</label>
								<select
									value={mappingData.formation}
									onChange={(e) =>
										setMappingData({
											...mappingData,
											formation: e.target.value,
										})
									}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
									required
								>
									<option value="">Select Formation</option>
									{formations.map((formation) => (
										<option key={formation} value={formation}>
											{formation}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Mapped Role
								</label>
								<select
									value={mappingData.mappedRole}
									onChange={(e) =>
										setMappingData({
											...mappingData,
											mappedRole: e.target.value,
										})
									}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
									required
								>
									<option value="">Select Mapped Role</option>
									{mappedRoles.map((role) => (
										<option key={role.value} value={role.value}>
											{role.label}
										</option>
									))}
								</select>
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
										resetMappingData();
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
		</div>
	);
};

export default EnhancedRatingCalculator;
