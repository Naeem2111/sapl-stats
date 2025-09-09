import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
	Trophy,
	Users,
	Calendar,
	Eye,
	Edit,
	Trash2,
	Plus,
	Filter,
	Search,
	BarChart3,
} from "lucide-react";
import api from "../../utils/api";

const CupManagement = () => {
	const { user, isCompetitionAdmin, isLeagueAdmin } = useAuth();
	const [cups, setCups] = useState([]);
	const [seasons, setSeasons] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedSeason, setSelectedSeason] = useState("all");
	const [selectedStatus, setSelectedStatus] = useState("all");
	const [selectedFormat, setSelectedFormat] = useState("all");
	const [searchTerm, setSearchTerm] = useState("");

	useEffect(() => {
		if (isCompetitionAdmin() || isLeagueAdmin()) {
			fetchCups();
			fetchSeasons();
		}
	}, [
		selectedSeason,
		selectedStatus,
		selectedFormat,
		isCompetitionAdmin,
		isLeagueAdmin,
	]);

	const fetchCups = async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams();
			if (selectedSeason !== "all") params.append("season", selectedSeason);
			if (selectedStatus !== "all") params.append("status", selectedStatus);
			if (selectedFormat !== "all") params.append("format", selectedFormat);

			const response = await api.get(`/cups?${params}`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});
			setCups(response.data.data || []);
		} catch (error) {
			console.error("Error fetching cups:", error);
			setCups([]);
		} finally {
			setLoading(false);
		}
	};

	const fetchSeasons = async () => {
		try {
			const response = await api.get("/seasons");
			setSeasons(response.data.data || []);
		} catch (error) {
			console.error("Error fetching seasons:", error);
		}
	};

	const deleteCup = async (cupId) => {
		if (
			!window.confirm(
				"Are you sure you want to delete this cup? This action cannot be undone."
			)
		) {
			return;
		}

		try {
			await api.delete(`/cups/${cupId}`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});

			// Refresh cups list
			await fetchCups();
			alert("Cup deleted successfully");
		} catch (error) {
			console.error("Error deleting cup:", error);
			alert("Error deleting cup. Please try again.");
		}
	};

	const getStatusColor = (status) => {
		const colors = {
			PLANNING: "bg-yellow-100 text-yellow-800",
			REGISTRATION: "bg-blue-100 text-blue-800",
			SEEDING: "bg-purple-100 text-purple-800",
			ACTIVE: "bg-green-100 text-green-800",
			COMPLETED: "bg-gray-100 text-gray-800",
			CANCELLED: "bg-red-100 text-red-800",
		};
		return colors[status] || "bg-gray-100 text-gray-800";
	};

	const getFormatColor = (format) => {
		const colors = {
			KNOCKOUT: "bg-red-100 text-red-800",
			DOUBLE_KNOCKOUT: "bg-orange-100 text-orange-800",
			GROUP_KNOCKOUT: "bg-blue-100 text-blue-800",
			ROUND_ROBIN: "bg-green-100 text-green-800",
			SWISS_SYSTEM: "bg-purple-100 text-purple-800",
		};
		return colors[format] || "bg-gray-100 text-gray-800";
	};

	const filteredCups = cups.filter((cup) => {
		const matchesSearch =
			cup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			cup.description?.toLowerCase().includes(searchTerm.toLowerCase());
		return matchesSearch;
	});

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
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold text-gray-900 flex items-center">
								<Trophy className="h-8 w-8 text-blue-600 mr-3" />
								Cup Management
							</h1>
							<p className="text-gray-600 mt-2">
								Manage tournaments and cup competitions
							</p>
						</div>
						<button
							onClick={() => (window.location.href = "/competition-creation")}
							className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
						>
							<Plus className="h-4 w-4 mr-2" />
							Create New Cup
						</button>
					</div>
				</div>

				{/* Filters */}
				<div className="bg-white rounded-lg shadow-md p-6 mb-6">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Search
							</label>
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
								<input
									type="text"
									placeholder="Search cups..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Season
							</label>
							<select
								value={selectedSeason}
								onChange={(e) => setSelectedSeason(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
								<option value="all">All Seasons</option>
								{seasons.map((season) => (
									<option key={season.id} value={season.id}>
										{season.name}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Status
							</label>
							<select
								value={selectedStatus}
								onChange={(e) => setSelectedStatus(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
								<option value="all">All Statuses</option>
								<option value="PLANNING">Planning</option>
								<option value="REGISTRATION">Registration</option>
								<option value="SEEDING">Seeding</option>
								<option value="ACTIVE">Active</option>
								<option value="COMPLETED">Completed</option>
								<option value="CANCELLED">Cancelled</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Format
							</label>
							<select
								value={selectedFormat}
								onChange={(e) => setSelectedFormat(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
								<option value="all">All Formats</option>
								<option value="KNOCKOUT">Single Elimination</option>
								<option value="DOUBLE_KNOCKOUT">Double Elimination</option>
								<option value="GROUP_KNOCKOUT">Group + Knockout</option>
								<option value="ROUND_ROBIN">Round Robin</option>
								<option value="SWISS_SYSTEM">Swiss System</option>
							</select>
						</div>
					</div>
				</div>

				{/* Cups List */}
				<div className="bg-white rounded-lg shadow-md">
					{loading ? (
						<div className="p-8 text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
							<p className="mt-4 text-gray-600">Loading cups...</p>
						</div>
					) : filteredCups.length === 0 ? (
						<div className="p-8 text-center">
							<Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								No cups found
							</h3>
							<p className="text-gray-600">
								{searchTerm ||
								selectedSeason !== "all" ||
								selectedStatus !== "all" ||
								selectedFormat !== "all"
									? "Try adjusting your filters or search terms"
									: "Create your first cup to get started"}
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Cup
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Season
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Teams
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Progress
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Status
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Format
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Dates
										</th>
										<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{filteredCups.map((cup) => (
										<tr key={cup.id} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap">
												<div>
													<div className="text-sm font-medium text-gray-900">
														{cup.name}
													</div>
													{cup.description && (
														<div className="text-sm text-gray-500">
															{cup.description}
														</div>
													)}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-gray-900">
													{cup.season?.name}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center">
													<Users className="h-4 w-4 text-gray-400 mr-2" />
													<span className="text-sm text-gray-900">
														{cup.teamsCount}
													</span>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center">
													<div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
														<div
															className="bg-blue-600 h-2 rounded-full"
															style={{ width: `${cup.progress}%` }}
														></div>
													</div>
													<span className="text-sm text-gray-900">
														{cup.progress}%
													</span>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span
													className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
														cup.status
													)}`}
												>
													{cup.status}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span
													className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFormatColor(
														cup.format
													)}`}
												>
													{cup.format.replace("_", " ")}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-gray-900">
													<div>
														{new Date(cup.startDate).toLocaleDateString()}
													</div>
													<div className="text-gray-500">
														{new Date(cup.endDate).toLocaleDateString()}
													</div>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
												<div className="flex items-center justify-end space-x-2">
													<button
														onClick={() =>
															(window.location.href = `/cups/${cup.id}`)
														}
														className="text-blue-600 hover:text-blue-900 p-1"
														title="View Cup"
													>
														<Eye className="h-4 w-4" />
													</button>
													<button
														onClick={() =>
															(window.location.href = `/cups/${cup.id}/standings`)
														}
														className="text-green-600 hover:text-green-900 p-1"
														title="View Standings"
													>
														<BarChart3 className="h-4 w-4" />
													</button>
													{isCompetitionAdmin() && (
														<>
															<button
																onClick={() =>
																	(window.location.href = `/cups/${cup.id}/edit`)
																}
																className="text-yellow-600 hover:text-yellow-900 p-1"
																title="Edit Cup"
															>
																<Edit className="h-4 w-4" />
															</button>
															<button
																onClick={() => deleteCup(cup.id)}
																className="text-red-600 hover:text-red-900 p-1"
																title="Delete Cup"
															>
																<Trash2 className="h-4 w-4" />
															</button>
														</>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default CupManagement;
