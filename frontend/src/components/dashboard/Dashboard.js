import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Fixtures from "./Fixtures";
import FixtureDetail from "./FixtureDetail";
import FixtureEdit from "./FixtureEdit";
import TeamManagement from "./TeamManagement";
import Players from "./Players";
import PlayerStats from "./PlayerStats";
import LeagueStats from "./LeagueStats";
import Settings from "./Settings";
import PlayerProfile from "./PlayerProfile";
import CompetitionCreation from "./CompetitionCreation";
import CompetitionManagement from "./CompetitionManagement";
import SeasonManagement from "./SeasonManagement";
import OCRTrainer from "./OCRTrainer";
import RatingCalculator from "./RatingCalculator";
import EnhancedRatingCalculator from "./EnhancedRatingCalculator";

const Dashboard = () => {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Mobile sidebar overlay */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<Sidebar
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
				user={user}
				onLogout={handleLogout}
			/>

			{/* Main content */}
			<div className="lg:pl-64">
				{/* Header */}
				<Header
					onMenuClick={() => setSidebarOpen(true)}
					user={user}
					onLogout={handleLogout}
				/>

				{/* Page content */}
				<main className="py-6">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<Routes>
							<Route path="/" element={<Fixtures />} />
							<Route path="/fixtures" element={<Fixtures />} />
							<Route path="/fixture/:fixtureId" element={<FixtureDetail />} />
							<Route
								path="/fixture/:fixtureId/edit"
								element={<FixtureEdit />}
							/>
							<Route path="/team" element={<TeamManagement />} />
							<Route path="/players" element={<Players />} />
							<Route path="/player-stats" element={<PlayerStats />} />
							<Route path="/player/:playerId" element={<PlayerProfile />} />
							<Route path="/league" element={<LeagueStats />} />
							<Route path="/competition" element={<CompetitionCreation />} />
							<Route
								path="/competition-management"
								element={<CompetitionManagement />}
							/>
							<Route path="/season-management" element={<SeasonManagement />} />
							<Route path="/ocr-trainer" element={<OCRTrainer />} />
							<Route
								path="/rating-calculator"
								element={<EnhancedRatingCalculator />}
							/>
							<Route path="/settings" element={<Settings />} />
						</Routes>
					</div>
				</main>
			</div>
		</div>
	);
};

export default Dashboard;
