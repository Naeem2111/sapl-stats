import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { User, Shield, Bell, Key, Save } from "lucide-react";

const Settings = () => {
	const { user } = useAuth();
	const [activeTab, setActiveTab] = useState("profile");
	const [loading, setLoading] = useState(false);

	const tabs = [
		{ id: "profile", name: "Profile", icon: User },
		{ id: "security", name: "Security", icon: Shield },
		{ id: "notifications", name: "Notifications", icon: Bell },
	];

	const ProfileTab = () => (
		<div className="space-y-6">
			<div className="card">
				<h3 className="text-lg font-medium text-gray-900 mb-4">
					Personal Information
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Username
						</label>
						<input
							type="text"
							defaultValue={user?.username}
							className="input-field"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Email
						</label>
						<input
							type="email"
							defaultValue={user?.email}
							className="input-field"
							disabled
						/>
						<p className="text-xs text-gray-500 mt-1">
							Email cannot be changed
						</p>
					</div>
				</div>
			</div>

			<div className="card">
				<h3 className="text-lg font-medium text-gray-900 mb-4">
					Role Information
				</h3>
				<div className="bg-gray-50 rounded-lg p-4">
					<div className="flex items-center space-x-3">
						<Shield className="h-5 w-5 text-primary-600" />
						<div>
							<p className="text-sm font-medium text-gray-900">Current Role</p>
							<p className="text-sm text-gray-500 capitalize">
								{user?.role?.toLowerCase().replace("_", " ")}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);

	const SecurityTab = () => (
		<div className="space-y-6">
			<div className="card">
				<h3 className="text-lg font-medium text-gray-900 mb-4">
					Change Password
				</h3>
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Current Password
						</label>
						<input
							type="password"
							className="input-field"
							placeholder="Enter current password"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							New Password
						</label>
						<input
							type="password"
							className="input-field"
							placeholder="Enter new password"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Confirm New Password
						</label>
						<input
							type="password"
							className="input-field"
							placeholder="Confirm new password"
						/>
					</div>
					<button className="btn-primary">
						<Key className="h-4 w-4 mr-2" />
						Update Password
					</button>
				</div>
			</div>

			<div className="card">
				<h3 className="text-lg font-medium text-gray-900 mb-4">
					Two-Factor Authentication
				</h3>
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm font-medium text-gray-900">2FA Status</p>
						<p className="text-sm text-gray-500">
							Add an extra layer of security to your account
						</p>
					</div>
					<button className="btn-secondary">Enable 2FA</button>
				</div>
			</div>
		</div>
	);

	const NotificationsTab = () => (
		<div className="space-y-6">
			<div className="card">
				<h3 className="text-lg font-medium text-gray-900 mb-4">
					Email Notifications
				</h3>
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-900">
								Match Reminders
							</p>
							<p className="text-sm text-gray-500">
								Get notified before upcoming matches
							</p>
						</div>
						<label className="relative inline-flex items-center cursor-pointer">
							<input type="checkbox" defaultChecked className="sr-only peer" />
							<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
						</label>
					</div>

					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-900">Team Updates</p>
							<p className="text-sm text-gray-500">
								Receive notifications about team changes
							</p>
						</div>
						<label className="relative inline-flex items-center cursor-pointer">
							<input type="checkbox" defaultChecked className="sr-only peer" />
							<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
						</label>
					</div>

					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-900">
								League Announcements
							</p>
							<p className="text-sm text-gray-500">
								Important updates from league administrators
							</p>
						</div>
						<label className="relative inline-flex items-center cursor-pointer">
							<input type="checkbox" className="sr-only peer" />
							<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
						</label>
					</div>
				</div>
			</div>

			<div className="card">
				<h3 className="text-lg font-medium text-gray-900 mb-4">
					Push Notifications
				</h3>
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm font-medium text-gray-900">
							Mobile Notifications
						</p>
						<p className="text-sm text-gray-500">
							Receive push notifications on your device
						</p>
					</div>
					<button className="btn-secondary">Configure</button>
				</div>
			</div>
		</div>
	);

	const renderTabContent = () => {
		switch (activeTab) {
			case "profile":
				return <ProfileTab />;
			case "security":
				return <SecurityTab />;
			case "notifications":
				return <NotificationsTab />;
			default:
				return <ProfileTab />;
		}
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">Settings</h2>
					<p className="mt-1 text-sm text-gray-500">
						Manage your account preferences and security settings
					</p>
				</div>
			</div>

			{/* Settings Tabs */}
			<div className="card">
				<div className="border-b border-gray-200">
					<nav className="-mb-px flex space-x-8">
						{tabs.map((tab) => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`py-2 px-1 border-b-2 font-medium text-sm ${
									activeTab === tab.id
										? "border-primary-500 text-primary-600"
										: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
								}`}
							>
								<tab.icon className="h-4 w-4 inline mr-2" />
								{tab.name}
							</button>
						))}
					</nav>
				</div>

				<div className="mt-6">{renderTabContent()}</div>
			</div>
		</div>
	);
};

export default Settings;
