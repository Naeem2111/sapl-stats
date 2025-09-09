import React, { useState, useEffect } from "react";
import api from "../../utils/api";

const SeasonManagement = () => {
	const [seasons, setSeasons] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [editingSeason, setEditingSeason] = useState(null);

	// Form states
	const [formData, setFormData] = useState({
		name: "",
		startDate: "",
		endDate: "",
		description: "",
	});

	useEffect(() => {
		fetchSeasons();
	}, []);

	const fetchSeasons = async () => {
		try {
			setLoading(true);
			const response = await api.get("/seasons");
			setSeasons(response.data.data || []);
		} catch (err) {
			setError("Failed to fetch seasons");
			console.error("Error fetching seasons:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleCreateSeason = async (e) => {
		e.preventDefault();
		try {
			await api.post("/seasons", formData);
			setSuccess("Season created successfully");
			setFormData({ name: "", startDate: "", endDate: "", description: "" });
			setShowCreateForm(false);
			fetchSeasons();
		} catch (err) {
			setError("Failed to create season");
			console.error("Error creating season:", err);
		}
	};

	const handleSetActive = async (seasonId) => {
		try {
			await api.post(`/seasons/${seasonId}/set-active`);
			setSuccess("Active season updated successfully");
			fetchSeasons();
		} catch (err) {
			setError("Failed to set active season");
			console.error("Error setting active season:", err);
		}
	};

	const handleEditSeason = (season) => {
		setEditingSeason(season);
		setFormData({
			name: season.name,
			startDate: season.startDate.split("T")[0],
			endDate: season.endDate.split("T")[0],
			description: season.description || "",
		});
		setShowCreateForm(true);
	};

	const handleUpdateSeason = async (e) => {
		e.preventDefault();
		try {
			await api.put(`/seasons/${editingSeason.id}`, formData);
			setSuccess("Season updated successfully");
			setEditingSeason(null);
			setFormData({ name: "", startDate: "", endDate: "", description: "" });
			setShowCreateForm(false);
			fetchSeasons();
		} catch (err) {
			setError("Failed to update season");
			console.error("Error updating season:", err);
		}
	};

	const handleDeleteSeason = async (seasonId) => {
		if (!window.confirm("Are you sure you want to delete this season?")) {
			return;
		}

		try {
			await api.delete(`/seasons/${seasonId}`);
			setSuccess("Season deleted successfully");
			fetchSeasons();
		} catch (err) {
			setError("Failed to delete season");
			console.error("Error deleting season:", err);
		}
	};

	const resetForm = () => {
		setFormData({ name: "", startDate: "", endDate: "", description: "" });
		setEditingSeason(null);
		setShowCreateForm(false);
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold text-gray-900">Season Management</h1>
				<button
					onClick={() => setShowCreateForm(true)}
					className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
				>
					Create New Season
				</button>
			</div>

			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
					{error}
				</div>
			)}

			{success && (
				<div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
					{success}
				</div>
			)}

			{/* Create/Edit Form */}
			{showCreateForm && (
				<div className="bg-white rounded-lg shadow-md p-6 mb-6">
					<h2 className="text-xl font-semibold mb-4">
						{editingSeason ? "Edit Season" : "Create New Season"}
					</h2>
					<form
						onSubmit={editingSeason ? handleUpdateSeason : handleCreateSeason}
					>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Season Name
								</label>
								<input
									type="text"
									name="name"
									value={formData.name}
									onChange={handleInputChange}
									required
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="e.g., Season 28"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Description
								</label>
								<input
									type="text"
									name="description"
									value={formData.description}
									onChange={handleInputChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="Optional description"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Start Date
								</label>
								<input
									type="date"
									name="startDate"
									value={formData.startDate}
									onChange={handleInputChange}
									required
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									End Date
								</label>
								<input
									type="date"
									name="endDate"
									value={formData.endDate}
									onChange={handleInputChange}
									required
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
						</div>
						<div className="flex gap-2">
							<button
								type="submit"
								className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
							>
								{editingSeason ? "Update Season" : "Create Season"}
							</button>
							<button
								type="button"
								onClick={resetForm}
								className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Seasons List */}
			<div className="bg-white rounded-lg shadow-md overflow-hidden">
				<div className="px-6 py-4 border-b border-gray-200">
					<h2 className="text-lg font-semibold text-gray-900">Seasons</h2>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Name
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Period
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Status
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Description
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{seasons.map((season) => (
								<tr key={season.id} className="hover:bg-gray-50">
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm font-medium text-gray-900">
											{season.name}
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm text-gray-900">
											{new Date(season.startDate).toLocaleDateString()} -{" "}
											{new Date(season.endDate).toLocaleDateString()}
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										{season.isActive ? (
											<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
												Active
											</span>
										) : (
											<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
												Inactive
											</span>
										)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm text-gray-900">
											{season.description || "-"}
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
										<div className="flex space-x-2">
											{!season.isActive && (
												<button
													onClick={() => handleSetActive(season.id)}
													className="text-green-600 hover:text-green-900"
												>
													Set Active
												</button>
											)}
											<button
												onClick={() => handleEditSeason(season)}
												className="text-blue-600 hover:text-blue-900"
											>
												Edit
											</button>
											<button
												onClick={() => handleDeleteSeason(season.id)}
												className="text-red-600 hover:text-red-900"
											>
												Delete
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{seasons.length === 0 && (
				<div className="text-center py-8 text-gray-500">
					No seasons found. Create your first season to get started.
				</div>
			)}
		</div>
	);
};

export default SeasonManagement;
