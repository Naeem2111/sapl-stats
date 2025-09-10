import React from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/auth/Login";
import Dashboard from "./components/dashboard/Dashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PositionSelection from "./components/auth/PositionSelection";
import PublicStats from "./components/public/PublicStats";
import Register from "./components/public/Register";
import HomePage from "./components/public/HomePage";
import "./index.css";

function App() {
	return (
		<AuthProvider>
			<Router>
				<div className="min-h-screen bg-gray-50">
					<Routes>
						<Route path="/" element={<HomePage />} />
						<Route path="/stats" element={<PublicStats />} />
						<Route path="/register" element={<Register />} />
						<Route path="/login" element={<Login />} />
						<Route
							path="/position-selection"
							element={
								<ProtectedRoute>
									<PositionSelection />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/dashboard/*"
							element={
								<ProtectedRoute>
									<Dashboard />
								</ProtectedRoute>
							}
						/>
					</Routes>
				</div>
			</Router>
		</AuthProvider>
	);
}

export default App;
