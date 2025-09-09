import React, { useState } from "react";
import { Users, Eye, EyeOff, Copy, Check } from "lucide-react";

const TestCredentials = () => {
	const [showPasswords, setShowPasswords] = useState(false);
	const [copiedIndex, setCopiedIndex] = useState(null);

	const testAccounts = [
		{
			email: "admin@proclubs.com",
			password: "admin123",
			role: "COMPETITION_ADMIN",
			name: "Admin User",
			description: "Main administrator account",
		},
		{
			email: "league_admin@proclubs.com",
			password: "league_admin123",
			role: "LEAGUE_ADMIN",
			name: "League Administrator",
			description: "League administrator account",
		},
		{
			email: "team_admin@proclubs.com",
			password: "team_admin123",
			role: "TEAM_ADMIN",
			name: "Team Administrator",
			description: "Team administrator account",
		},
		{
			email: "naeem2111@gmail.com",
			password: "player123",
			role: "PLAYER",
			name: "Naeem Thomas",
			description: "Player account",
		},
	];

	const copyToClipboard = async (text, index) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedIndex(index);
			setTimeout(() => setCopiedIndex(null), 2000);
		} catch (err) {
			console.error("Failed to copy: ", err);
		}
	};

	const getRoleColor = (role) => {
		switch (role) {
			case "COMPETITION_ADMIN":
				return "bg-purple-100 text-purple-800 border-purple-200";
			case "LEAGUE_ADMIN":
				return "bg-blue-100 text-blue-800 border-blue-200";
			case "TEAM_ADMIN":
				return "bg-green-100 text-green-800 border-green-200";
			case "PLAYER":
				return "bg-orange-100 text-orange-800 border-orange-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
		}
	};

	return (
		<div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
			<div className="flex items-center justify-between mb-3">
				<h3 className="text-sm font-medium text-blue-800 flex items-center">
					<Users className="h-4 w-4 mr-2" />
					Test Account Credentials
				</h3>
				<button
					onClick={() => setShowPasswords(!showPasswords)}
					className="flex items-center text-xs text-blue-600 hover:text-blue-800"
				>
					{showPasswords ? (
						<EyeOff className="h-3 w-3 mr-1" />
					) : (
						<Eye className="h-3 w-3 mr-1" />
					)}
					{showPasswords ? "Hide" : "Show"} Passwords
				</button>
			</div>

			<div className="space-y-2 text-xs">
				{testAccounts.map((account, index) => (
					<div
						key={index}
						className="p-3 bg-white rounded border hover:shadow-sm transition-shadow"
					>
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-medium text-gray-900">
										{account.name}
									</span>
									<span
										className={`px-2 py-1 rounded-full text-xs border ${getRoleColor(
											account.role
										)}`}
									>
										{account.role.replace("_", " ")}
									</span>
								</div>
								<p className="text-gray-600 mb-2">{account.description}</p>
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<span className="text-gray-500 w-16">Email:</span>
										<span className="font-mono text-gray-900">
											{account.email}
										</span>
										<button
											onClick={() =>
												copyToClipboard(account.email, `email-${index}`)
											}
											className="text-blue-600 hover:text-blue-800"
										>
											{copiedIndex === `email-${index}` ? (
												<Check className="h-3 w-3" />
											) : (
												<Copy className="h-3 w-3" />
											)}
										</button>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-gray-500 w-16">Password:</span>
										<span className="font-mono text-gray-900">
											{showPasswords ? account.password : "••••••••"}
										</span>
										<button
											onClick={() =>
												copyToClipboard(account.password, `password-${index}`)
											}
											className="text-blue-600 hover:text-blue-800"
										>
											{copiedIndex === `password-${index}` ? (
												<Check className="h-3 w-3" />
											) : (
												<Copy className="h-3 w-3" />
											)}
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>

			<div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
				<strong>💡 Tip:</strong> Click the copy icons to copy email/password to
				clipboard. These are the essential test accounts for development.
			</div>
		</div>
	);
};

export default TestCredentials;
