import React from "react";
import { useLocation } from "react-router-dom";
import { Menu, Bell, Search } from "lucide-react";

const Header = ({ onMenuClick, user }) => {
	const location = useLocation();

	const getPageTitle = () => {
		const path = location.pathname;
		if (path.includes("/fixtures")) return "Fixtures";
		if (path.includes("/team")) return "Team Management";
		if (path.includes("/players")) return "Player Statistics";
		if (path.includes("/league")) return "League Statistics";
		if (path.includes("/settings")) return "Settings";
		return "Dashboard";
	};

	const getBreadcrumb = () => {
		const path = location.pathname;
		if (path.includes("/fixtures")) return "Manage match schedules and results";
		if (path.includes("/team")) return "Manage team roster and settings";
		if (path.includes("/players")) return "View and analyze player performance";
		if (path.includes("/league")) return "League-wide statistics and standings";
		if (path.includes("/settings")) return "Account and system preferences";
		return "Welcome to your dashboard";
	};

	return (
		<header className="bg-white shadow-sm border-b border-gray-200">
			<div className="px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					{/* Left side */}
					<div className="flex items-center">
						<button
							onClick={onMenuClick}
							className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
						>
							<Menu className="h-6 w-6" />
						</button>

						<div className="ml-4 lg:ml-0">
							<h1 className="text-xl font-semibold text-gray-900">
								{getPageTitle()}
							</h1>
							<p className="text-sm text-gray-500">{getBreadcrumb()}</p>
						</div>
					</div>

					{/* Right side */}
					<div className="flex items-center space-x-4">
						{/* Search */}
						<div className="hidden sm:block">
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Search className="h-5 w-5 text-gray-400" />
								</div>
								<input
									type="text"
									placeholder="Search..."
									className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
								/>
							</div>
						</div>

						{/* Notifications */}
						<button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg">
							<Bell className="h-6 w-6" />
						</button>

						{/* User menu */}
						<div className="flex items-center space-x-3">
							<div className="hidden sm:block text-right">
								<p className="text-sm font-medium text-gray-900">
									{user?.username}
								</p>
								<p className="text-xs text-gray-500 capitalize">
									{user?.role?.toLowerCase().replace("_", " ")}
								</p>
							</div>
							<div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
								<span className="text-white font-semibold text-sm">
									{user?.username?.charAt(0).toUpperCase()}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
};

export default Header;
