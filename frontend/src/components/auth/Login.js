import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Eye, EyeOff, Shield } from "lucide-react";
import TestCredentials from "./TestCredentials";

const Login = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const { login } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		const result = await login(email, password);

		if (result.success) {
			navigate("/dashboard");
		} else {
			setError(result.error);
		}

		setLoading(false);
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				{/* Header */}
				<div className="text-center">
					<div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
						<Shield className="h-8 w-8 text-white" />
					</div>
					<h2 className="text-3xl font-bold text-gray-900 font-display">
						Pro Clubs Stats Hub
					</h2>
					<p className="mt-2 text-sm text-gray-600">
						Sign in to access your dashboard
					</p>
				</div>

				{/* Login Form */}
				<div className="card">
					<form className="space-y-6" onSubmit={handleSubmit}>
						{error && (
							<div className="bg-red-50 border border-red-200 rounded-lg p-3">
								<p className="text-sm text-red-600">{error}</p>
							</div>
						)}

						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-gray-700 mb-2"
							>
								Email Address
							</label>
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="input-field"
								placeholder="Enter your email"
							/>
						</div>

						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-gray-700 mb-2"
							>
								Password
							</label>
							<div className="relative">
								<input
									id="password"
									name="password"
									type={showPassword ? "text" : "password"}
									autoComplete="current-password"
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="input-field pr-10"
									placeholder="Enter your password"
								/>
								<button
									type="button"
									className="absolute inset-y-0 right-0 pr-3 flex items-center"
									onClick={() => setShowPassword(!showPassword)}
								>
									{showPassword ? (
										<EyeOff className="h-5 w-5 text-gray-400" />
									) : (
										<Eye className="h-5 w-5 text-gray-400" />
									)}
								</button>
							</div>
						</div>

						<div>
							<button
								type="submit"
								disabled={loading}
								className="btn-primary w-full flex justify-center items-center"
							>
								{loading ? (
									<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
								) : (
									"Sign In"
								)}
							</button>
						</div>
					</form>

					{/* Test Credentials Component */}
					<TestCredentials />

					{/* Navigation Links */}
					<div className="mt-6 pt-6 border-t border-gray-200">
						<div className="text-center space-y-3">
							<p className="text-sm text-gray-600">
								Don't have an account?{" "}
								<Link
									to="/register"
									className="font-medium text-primary-600 hover:text-primary-500"
								>
									Register here
								</Link>
							</p>
							<p className="text-sm text-gray-600">
								Want to see public statistics?{" "}
								<Link
									to="/stats"
									className="font-medium text-primary-600 hover:text-primary-500"
								>
									View Stats
								</Link>
							</p>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="text-center">
					<p className="text-xs text-gray-500">
						© 2024 Pro Clubs Stats Hub. All rights reserved.
					</p>
				</div>
			</div>
		</div>
	);
};

export default Login;
