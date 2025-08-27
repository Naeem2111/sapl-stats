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
import "./index.css";

function App() {
	return (
		<AuthProvider>
			<Router>
				<div className="min-h-screen bg-gray-50">
					<Routes>
						<Route path="/login" element={<Login />} />
						<Route
							path="/dashboard/*"
							element={
								<ProtectedRoute>
									<Dashboard />
								</ProtectedRoute>
							}
						/>
						<Route path="/" element={<Navigate to="/dashboard" replace />} />
					</Routes>
				</div>
			</Router>
		</AuthProvider>
	);
}

export default App;
