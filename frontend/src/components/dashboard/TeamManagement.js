import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
	Users,
	Plus,
	Edit,
	Trash2,
	UserPlus,
	Shield,
	Trophy,
} from "lucide-react";
import axios from "axios";
import { API_ENDPOINTS } from "../../utils/api";

const TeamManagement = () => {
	const { user, isTeamAdmin } = useAuth();
	const [teams, setTeams] = useState([]);
	const [players, setPlayers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedTeam, setSelectedTeam] = useState(null);

	useEffect(() => {
		fetchTeams();
		fetchPlayers();
	}, []);

	const fetchTeams = async () => {
		try {
			const response = await axios.get(API_ENDPOINTS.TEAMS);
			setTeams(response.data.data || []);
		} catch (error) {
			console.error("Error fetching teams:", error);
			setTeams([]);
		}
	};

	const fetchPlayers = async () => {
		try {
			const response = await axios.get(API_ENDPOINTS.PLAYERS);
			setPlayers(response.data.data || []);
		} catch (error) {
			console.error("Error fetching players:", error);
			setPlayers([]);
		}
	};

	const getTeamPlayers = () => {
		if (!selectedTeam) return [];
		return players.filter((player) => player.teamId === selectedTeam.id);
	};

	const getPositionColor = (position) => {
		const colors = {
			GK: "bg-red-100 text-red-800",
			CB: "bg-blue-100 text-blue-800",
			LB: "bg-green-100 text-green-800",
			RB: "bg-green-100 text-green-800",
			CDM: "bg-yellow-100 text-yellow-800",
			CM: "bg-purple-100 text-purple-800",
			CAM: "bg-indigo-100 text-indigo-800",
			LM: "bg-pink-100 text-pink-800",
			RM: "bg-pink-100 text-pink-800",
			LW: "bg-orange-100 text-orange-800",
			RW: "bg-orange-100 text-orange-800",
			ST: "bg-gray-100 text-gray-800",
			CF: "bg-gray-100 text-gray-800",
		};
		return colors[position] || "bg-gray-100 text-gray-800";
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
					<p className="mt-1 text-sm text-gray-500">
						Manage team rosters and player assignments
					</p>
				</div>
				{isTeamAdmin() && (
					<button className="btn-primary mt-4 sm:mt-0">
						<Plus className="h-4 w-4 mr-2" />
						Add Player
					</button>
				)}
			</div>

			{/* Team Selection */}
			<div className="card">
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Select Team
				</label>
				<select
					value={selectedTeam?.id || ""}
					onChange={(e) => {
						const team = teams.find((t) => t.id === e.target.value);
						setSelectedTeam(team);
					}}
					className="input-field"
				>
					<option value="">Choose a team...</option>
					{teams.map((team) => (
						<option key={team.id} value={team.id}>
							{team.name}
						</option>
					))}
				</select>
			</div>

			{selectedTeam && (
				<>
					{/* Team Info */}
					<div className="card">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-lg font-semibold text-gray-900">
									{selectedTeam.name}
								</h3>
								<p className="text-sm text-gray-500">
									{getTeamPlayers().length} players • Created{" "}
									{new Date(selectedTeam.createdAt).toLocaleDateString()}
								</p>
							</div>
							{isTeamAdmin() && (
								<button className="btn-secondary">
									<Edit className="h-4 w-4 mr-2" />
									Edit Team
								</button>
							)}
						</div>
					</div>

					{/* Players List */}
					<div className="card">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-medium text-gray-900">Team Roster</h3>
							{isTeamAdmin() && (
								<button className="btn-primary">
									<UserPlus className="h-4 w-4 mr-2" />
									Add Player
								</button>
							)}
						</div>

						{getTeamPlayers().length === 0 ? (
							<div className="text-center py-8">
								<Users className="mx-auto h-12 w-12 text-gray-400" />
								<h3 className="mt-2 text-sm font-medium text-gray-900">
									No players assigned
								</h3>
								<p className="mt-1 text-sm text-gray-500">
									Start building your team by adding players.
								</p>
							</div>
						) : (
							<div className="space-y-3">
								{getTeamPlayers().map((player) => (
									<div
										key={player.id}
										className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
									>
										<div className="flex items-center space-x-3">
											<div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
												<Shield className="h-5 w-5 text-primary-600" />
											</div>
											<div>
												<p className="font-medium text-gray-900">
													{player.gamertag}
												</p>
												<p className="text-sm text-gray-500">
													{player.realName}
												</p>
											</div>
										</div>
										<div className="flex items-center space-x-3">
											<span
												className={`px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(
													player.position
												)}`}
											>
												{player.position}
											</span>
											{isTeamAdmin() && (
												<div className="flex space-x-2">
													<button className="btn-secondary">
														<Edit className="h-3 w-3" />
													</button>
													<button className="btn-danger">
														<Trash2 className="h-3 w-3" />
													</button>
												</div>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Available Players */}
					<div className="card">
						<h3 className="text-lg font-medium text-gray-900 mb-4">
							Available Players
						</h3>
						<div className="space-y-3">
							{players
								.filter((player) => !player.teamId)
								.map((player) => (
									<div
										key={player.id}
										className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
									>
										<div className="flex items-center space-x-3">
											<div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
												<Users className="h-5 w-5 text-gray-500" />
											</div>
											<div>
												<p className="font-medium text-gray-900">
													{player.gamertag}
												</p>
												<p className="text-sm text-gray-500">
													{player.realName}
												</p>
											</div>
										</div>
										<div className="flex items-center space-x-3">
											<span
												className={`px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(
													player.position
												)}`}
											>
												{player.position}
											</span>
											{isTeamAdmin() && (
												<button className="btn-primary">
													<UserPlus className="h-4 w-4 mr-2" />
													Assign
												</button>
											)}
										</div>
									</div>
								))}
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export default TeamManagement;
