import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Save, X, ArrowLeft, AlertCircle } from "lucide-react";
import api from "../../utils/api";

const FixtureEdit = () => {
	const { fixtureId } = useParams();
	const navigate = useNavigate();
	const { isTeamAdmin } = useAuth();

	const [fixture, setFixture] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);
	const [teams, setTeams] = useState([]);
	const [seasons, setSeasons] = useState([]);

	// Form state
	const [formData, setFormData] = useState({
		homeTeamId: "",
		awayTeamId: "",
		seasonId: "",
		date: "",
		time: "",
		homeScore: "",
		awayScore: "",
		competitionType: "LEAGUE",
		status: "SCHEDULED",
	});

	const fetchFixtureDetails = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await api.get(`/matches/${fixtureId}`);
			const fixtureData = response.data.data;
			setFixture(fixtureData);

			// Set form data
			const fixtureDate = new Date(fixtureData.date);
			setFormData({
				homeTeamId: fixtureData.homeTeamId || "",
				awayTeamId: fixtureData.awayTeamId || "",
				seasonId: fixtureData.seasonId || "",
				date: fixtureDate.toISOString().split("T")[0],
				time: fixtureDate.toTimeString().slice(0, 5),
				homeScore: fixtureData.homeScore?.toString() || "",
				awayScore: fixtureData.awayScore?.toString() || "",
				competitionType: fixtureData.competitionType || "LEAGUE",
				status: fixtureData.status || "SCHEDULED",
			});
		} catch (error) {
			console.error("Error fetching fixture details:", error);
			setError("Failed to load fixture details. Please try again.");
		} finally {
			setLoading(false);
		}
	}, [fixtureId]);

	useEffect(() => {
		fetchFixtureDetails();
		fetchTeams();
		fetchSeasons();
	}, [fetchFixtureDetails]);

	const fetchTeams = async () => {
		try {
			const response = await api.get("/teams");
			setTeams(response.data.data || []);
		} catch (error) {
			console.error("Error fetching teams:", error);
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

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!isTeamAdmin()) {
			setError("You don't have permission to edit fixtures.");
			return;
		}

		try {
			setSaving(true);
			setError(null);

			// Combine date and time
			const dateTime = new Date(`${formData.date}T${formData.time}`);

			const updateData = {
				homeTeamId: formData.homeTeamId,
				awayTeamId: formData.awayTeamId,
				seasonId: formData.seasonId,
				date: dateTime.toISOString(),
				homeScore: formData.homeScore ? parseInt(formData.homeScore) : null,
				awayScore: formData.awayScore ? parseInt(formData.awayScore) : null,
				competitionType: formData.competitionType,
				status: formData.status,
			};

			await api.put(`/matches/${fixtureId}`, updateData);

			// Navigate back to fixture detail
			navigate(`/dashboard/fixture/${fixtureId}`);
		} catch (error) {
			console.error("Error updating fixture:", error);
			setError("Failed to update fixture. Please try again.");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
			</div>
		);
	}

	if (error && !fixture) {
		return (
			<div className="text-center py-12">
				<div className="text-red-600 mb-4">
					<X className="mx-auto h-12 w-12" />
				</div>
				<h3 className="text-lg font-medium text-gray-900 mb-2">
					Error Loading Fixture
				</h3>
				<p className="text-gray-500 mb-4">{error}</p>
				<Link to="/dashboard/fixtures" className="btn-primary">
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back to Fixtures
				</Link>
			</div>
		);
	}

	if (!isTeamAdmin()) {
		return (
			<div className="text-center py-12">
				<div className="text-red-600 mb-4">
					<AlertCircle className="mx-auto h-12 w-12" />
				</div>
				<h3 className="text-lg font-medium text-gray-900 mb-2">
					Access Denied
				</h3>
				<p className="text-gray-500 mb-4">
					You don't have permission to edit fixtures.
				</p>
				<Link to="/dashboard/fixtures" className="btn-primary">
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back to Fixtures
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<Link
						to={`/dashboard/fixture/${fixtureId}`}
						className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
					>
						<ArrowLeft className="h-4 w-4" />
						<span>Back to Fixture</span>
					</Link>
					<div className="h-6 w-px bg-gray-300"></div>
					<h2 className="text-2xl font-bold text-gray-900">Edit Fixture</h2>
				</div>
			</div>

			{/* Error Message */}
			{error && (
				<div className="bg-red-50 border border-red-200 rounded-md p-4">
					<div className="flex">
						<AlertCircle className="h-5 w-5 text-red-400" />
						<div className="ml-3">
							<h3 className="text-sm font-medium text-red-800">Error</h3>
							<div className="mt-2 text-sm text-red-700">{error}</div>
						</div>
					</div>
				</div>
			)}

			{/* Edit Form */}
			<div className="card">
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Teams */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Home Team
							</label>
							<select
								name="homeTeamId"
								value={formData.homeTeamId}
								onChange={handleInputChange}
								className="input-field"
								required
							>
								<option value="">Select Home Team</option>
								{teams.map((team) => (
									<option key={team.id} value={team.id}>
										{team.name}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Away Team
							</label>
							<select
								name="awayTeamId"
								value={formData.awayTeamId}
								onChange={handleInputChange}
								className="input-field"
								required
							>
								<option value="">Select Away Team</option>
								{teams.map((team) => (
									<option key={team.id} value={team.id}>
										{team.name}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Season */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Season
						</label>
						<select
							name="seasonId"
							value={formData.seasonId}
							onChange={handleInputChange}
							className="input-field"
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

					{/* Date and Time */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Date
							</label>
							<input
								type="date"
								name="date"
								value={formData.date}
								onChange={handleInputChange}
								className="input-field"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Time
							</label>
							<input
								type="time"
								name="time"
								value={formData.time}
								onChange={handleInputChange}
								className="input-field"
								required
							/>
						</div>
					</div>

					{/* Scores */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Home Score
							</label>
							<input
								type="number"
								name="homeScore"
								value={formData.homeScore}
								onChange={handleInputChange}
								className="input-field"
								min="0"
								placeholder="Leave empty if not played"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Away Score
							</label>
							<input
								type="number"
								name="awayScore"
								value={formData.awayScore}
								onChange={handleInputChange}
								className="input-field"
								min="0"
								placeholder="Leave empty if not played"
							/>
						</div>
					</div>

					{/* Competition Type and Status */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Competition Type
							</label>
							<select
								name="competitionType"
								value={formData.competitionType}
								onChange={handleInputChange}
								className="input-field"
								required
							>
								<option value="LEAGUE">League</option>
								<option value="CUP">Cup</option>
								<option value="FRIENDLY">Friendly</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Status
							</label>
							<select
								name="status"
								value={formData.status}
								onChange={handleInputChange}
								className="input-field"
								required
							>
								<option value="SCHEDULED">Scheduled</option>
								<option value="IN_PROGRESS">In Progress</option>
								<option value="COMPLETED">Completed</option>
								<option value="CANCELLED">Cancelled</option>
								<option value="POSTPONED">Postponed</option>
							</select>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
						<Link
							to={`/dashboard/fixture/${fixtureId}`}
							className="btn-secondary"
						>
							Cancel
						</Link>
						<button type="submit" disabled={saving} className="btn-primary">
							{saving ? (
								<>
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
									Saving...
								</>
							) : (
								<>
									<Save className="h-4 w-4 mr-2" />
									Save Changes
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default FixtureEdit;
