import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
	Calendar,
	Users,
	BarChart3,
	Trophy,
	Settings,
	LogOut,
	Shield,
	X,
	Menu,
} from "lucide-react";

const Sidebar = ({ isOpen, onClose, user, onLogout }) => {
	const { isTeamAdmin, isLeagueAdmin } = useAuth();
	const location = useLocation();

	console.log("Sidebar rendering:", {
		isOpen,
		user,
		isTeamAdmin: isTeamAdmin(),
		isLeagueAdmin: isLeagueAdmin(),
	});

	const navigation = [
		{
			name: "Fixtures",
			href: "/dashboard/fixtures",
			icon: Calendar,
			current: location.pathname.includes("/fixtures"),
		},
		{
			name: "Team Management",
			href: "/dashboard/team",
			icon: Users,
			current: location.pathname.includes("/team"),
		},
		{
			name: "Players",
			href: "/dashboard/players",
			icon: Users,
			current: location.pathname.includes("/players"),
		},
		{
			name: "Player Stats",
			href: "/dashboard/player-stats",
			icon: BarChart3,
			current: location.pathname.includes("/player-stats"),
		},
		...(isLeagueAdmin()
			? [
					{
						name: "League Stats",
						href: "/dashboard/league",
						icon: Trophy,
						current: location.pathname.includes("/league"),
					},
					{
						name: "Competition Creation",
						href: "/dashboard/competition",
						icon: Trophy,
						current: location.pathname.includes("/competition"),
					},
			  ]
			: []),
		{
			name: "Settings",
			href: "/dashboard/settings",
			icon: Settings,
			current: location.pathname.includes("/settings"),
		},
	];

	console.log("Navigation array:", navigation);

	return (
		<>
			{/* Mobile sidebar */}
			<div
				className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
					<div className="flex items-center">
						<Shield className="h-8 w-8 text-primary-600" />
						<span className="ml-2 text-lg font-semibold text-gray-900">
							Pro Clubs
						</span>
					</div>
					<button
						onClick={onClose}
						className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
					>
						<X className="h-6 w-6" />
					</button>
				</div>

				<div className="px-4 py-6">
					<SidebarContent
						navigation={navigation}
						user={user}
						onLogout={onLogout}
					/>
				</div>
			</div>

			{/* Desktop sidebar */}
			<div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
				<div className="flex items-center justify-center h-16 px-6 border-b border-gray-200">
					<div className="flex items-center">
						<Shield className="h-8 w-8 text-primary-600" />
						<span className="ml-2 text-lg font-semibold text-gray-900">
							Pro Clubs
						</span>
					</div>
				</div>

				<div className="px-4 py-6">
					<SidebarContent
						navigation={navigation}
						user={user}
						onLogout={onLogout}
					/>
				</div>
			</div>
		</>
	);
};

const SidebarContent = ({ navigation, user, onLogout }) => {
	return (
		<div className="space-y-6">
			{/* User Info */}
			<div className="bg-gray-50 rounded-lg p-4">
				<div className="flex items-center">
					<div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center">
						<span className="text-white font-semibold text-sm">
							{user?.user?.username?.charAt(0).toUpperCase()}
						</span>
					</div>
					<div className="ml-3">
						<p className="text-sm font-medium text-gray-900">
							{user?.user?.username}
						</p>
						<p className="text-xs text-gray-500 capitalize">
							{user?.user?.role?.toLowerCase().replace("_", " ")}
						</p>
					</div>
				</div>
			</div>

			{/* Navigation */}
			<nav className="space-y-2">
				{navigation.map((item) => (
					<NavLink
						key={item.name}
						to={item.href}
						className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
					>
						<item.icon className="mr-3 h-5 w-5" />
						{item.name}
					</NavLink>
				))}
			</nav>

			{/* Logout */}
			<div className="pt-6 border-t border-gray-200">
				<button
					onClick={onLogout}
					className="nav-link w-full text-red-600 hover:text-red-700 hover:bg-red-50"
				>
					<LogOut className="mr-3 h-5 w-5" />
					Sign Out
				</button>
			</div>
		</div>
	);
};

export default Sidebar;
