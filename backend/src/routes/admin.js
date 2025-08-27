const express = require("express");
const { prisma } = require("../database/prisma");
const {
	authenticateToken,
	requireCompetitionAdmin,
} = require("../middleware/auth");

const router = express.Router();

// All routes require COMPETITION_ADMIN role
router.use(authenticateToken, requireCompetitionAdmin);

// Get system overview and health
router.get("/system-overview", async (req, res) => {
	try {
		// Get database statistics
		const [
			totalUsers,
			totalTeams,
			totalPlayers,
			totalMatches,
			totalSeasons,
			totalBadges,
			activeUsers,
			recentMatches,
		] = await Promise.all([
			prisma.user.count(),
			prisma.team.count(),
			prisma.player.count(),
			prisma.match.count(),
			prisma.season.count(),
			prisma.badge.count(),
			prisma.user.count({
				where: {
					updatedAt: {
						gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
					},
				},
			}),
			prisma.match.count({
				where: {
					createdAt: {
						gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
					},
				},
			}),
		]);

		// Get role distribution
		const roleDistribution = await prisma.user.groupBy({
			by: ["role"],
			_count: {
				role: true,
			},
		});

		// Get match status distribution
		const matchStatusDistribution = await prisma.match.groupBy({
			by: ["status"],
			_count: {
				status: true,
			},
		});

		// Get recent activity
		const recentActivity = await prisma.user.findMany({
			select: {
				id: true,
				username: true,
				role: true,
				updatedAt: true,
			},
			orderBy: {
				updatedAt: "desc",
			},
			take: 10,
		});

		const systemOverview = {
			statistics: {
				totalUsers,
				totalTeams,
				totalPlayers,
				totalMatches,
				totalSeasons,
				totalBadges,
				activeUsers,
				recentMatches,
			},
			roleDistribution: roleDistribution.map((item) => ({
				role: item.role,
				count: item._count.role,
			})),
			matchStatusDistribution: matchStatusDistribution.map((item) => ({
				status: item.status,
				count: item._count.status,
			})),
			recentActivity,
			systemHealth: {
				status: "healthy",
				lastChecked: new Date().toISOString(),
				database: "connected",
				uptime: process.uptime(),
			},
		};

		res.json({
			success: true,
			data: systemOverview,
		});
	} catch (error) {
		console.error("Error fetching system overview:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Get database health and performance metrics
router.get("/database-health", async (req, res) => {
	try {
		// Test database connection
		const startTime = Date.now();
		await prisma.$queryRaw`SELECT 1`;
		const responseTime = Date.now() - startTime;

		// Get table sizes (approximate)
		const tableSizes = await prisma.$queryRaw`
			SELECT 
				schemaname,
				tablename,
				n_tup_ins as inserts,
				n_tup_upd as updates,
				n_tup_del as deletes,
				n_live_tup as live_tuples,
				n_dead_tup as dead_tuples
			FROM pg_stat_user_tables 
			WHERE schemaname = 'public'
			ORDER BY n_live_tup DESC
		`;

		// Get connection info
		const connectionInfo = await prisma.$queryRaw`
			SELECT 
				count(*) as active_connections,
				state,
				query_start
			FROM pg_stat_activity 
			WHERE state = 'active'
			GROUP BY state, query_start
		`;

		const databaseHealth = {
			status: "healthy",
			responseTime: `${responseTime}ms`,
			connection: "stable",
			tables: tableSizes,
			connections: connectionInfo,
			lastChecked: new Date().toISOString(),
		};

		res.json({
			success: true,
			data: databaseHealth,
		});
	} catch (error) {
		console.error("Error checking database health:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Database health check failed",
			},
		});
	}
});

// Get system logs and audit trail
router.get("/audit-logs", async (req, res) => {
	try {
		const {
			page = 1,
			limit = 50,
			action,
			userId,
			startDate,
			endDate,
		} = req.query;
		const skip = (parseInt(page) - 1) * parseInt(limit);

		// Build where clause for filtering
		const where = {};
		if (action) where.action = action;
		if (userId) where.userId = userId;
		if (startDate || endDate) {
			where.timestamp = {};
			if (startDate) where.timestamp.gte = new Date(startDate);
			if (endDate) where.timestamp.lte = new Date(endDate);
		}

		// For now, we'll return a mock audit log since we don't have audit logging implemented yet
		// In a real implementation, you would query an audit_logs table
		const mockAuditLogs = [
			{
				id: "1",
				action: "USER_LOGIN",
				userId: "user1",
				username: "admin",
				timestamp: new Date(),
				details: "User logged in successfully",
				ipAddress: "192.168.1.1",
			},
			{
				id: "2",
				action: "USER_CREATED",
				userId: "user2",
				username: "admin",
				timestamp: new Date(Date.now() - 3600000),
				details: "Created new user: john_doe",
				ipAddress: "192.168.1.1",
			},
			{
				id: "3",
				action: "TEAM_CREATED",
				userId: "user1",
				username: "admin",
				timestamp: new Date(Date.now() - 7200000),
				details: "Created new team: Arsenal FC",
				ipAddress: "192.168.1.1",
			},
		];

		const auditLogs = {
			logs: mockAuditLogs,
			pagination: {
				currentPage: parseInt(page),
				totalPages: 1,
				totalLogs: mockAuditLogs.length,
				hasNextPage: false,
				hasPrevPage: false,
				limit: parseInt(limit),
			},
		};

		res.json({
			success: true,
			data: auditLogs,
		});
	} catch (error) {
		console.error("Error fetching audit logs:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Get system configuration
router.get("/configuration", async (req, res) => {
	try {
		const configuration = {
			environment: process.env.NODE_ENV || "development",
			port: process.env.PORT || 3000,
			database: {
				provider: "postgresql",
				url: process.env.DATABASE_URL ? "configured" : "not configured",
			},
			security: {
				jwtSecret: process.env.JWT_SECRET ? "configured" : "not configured",
				jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
				rateLimit: {
					windowMs: process.env.RATE_LIMIT_WINDOW_MS || "15 minutes",
					maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
				},
			},
			cors: {
				origins: ["http://localhost:3001", "http://127.0.0.1:3001"],
				credentials: true,
			},
			features: {
				badgeSystem: true,
				playerStats: true,
				teamManagement: true,
				seasonManagement: true,
				competitionManagement: true,
				userManagement: true,
			},
		};

		res.json({
			success: true,
			data: configuration,
		});
	} catch (error) {
		console.error("Error fetching configuration:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Update system configuration
router.put("/configuration", async (req, res) => {
	try {
		const { feature, enabled, value } = req.body;

		if (!feature) {
			return res.status(400).json({
				success: false,
				error: {
					message: "Feature name is required",
				},
			});
		}

		// In a real implementation, you would update configuration in database or environment
		// For now, we'll return a success response
		res.json({
			success: true,
			message: `Configuration updated for feature: ${feature}`,
			data: {
				feature,
				enabled,
				value,
				updatedAt: new Date().toISOString(),
			},
		});
	} catch (error) {
		console.error("Error updating configuration:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Get backup and maintenance information
router.get("/maintenance", async (req, res) => {
	try {
		const maintenance = {
			lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Mock: 24 hours ago
			nextBackup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Mock: 24 hours from now
			backupSize: "2.5 GB",
			maintenanceWindow: "Sunday 2:00 AM - 4:00 AM UTC",
			scheduledTasks: [
				{
					name: "Database Backup",
					schedule: "Daily at 2:00 AM",
					lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
					nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
					status: "completed",
				},
				{
					name: "Log Cleanup",
					schedule: "Weekly on Sunday",
					lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
					nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
					status: "completed",
				},
				{
					name: "Statistics Update",
					schedule: "Every 6 hours",
					lastRun: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
					nextRun: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
					status: "scheduled",
				},
			],
		};

		res.json({
			success: true,
			data: maintenance,
		});
	} catch (error) {
		console.error("Error fetching maintenance info:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Trigger manual backup
router.post("/maintenance/backup", async (req, res) => {
	try {
		// In a real implementation, you would trigger a database backup
		// For now, we'll return a success response
		res.json({
			success: true,
			message: "Backup initiated successfully",
			data: {
				backupId: `backup_${Date.now()}`,
				startedAt: new Date().toISOString(),
				status: "in_progress",
			},
		});
	} catch (error) {
		console.error("Error initiating backup:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Get system performance metrics
router.get("/performance", async (req, res) => {
	try {
		const { timeframe = "24h" } = req.query;

		// Calculate time range
		const now = new Date();
		let startTime;
		switch (timeframe) {
			case "1h":
				startTime = new Date(now.getTime() - 60 * 60 * 1000);
				break;
			case "6h":
				startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
				break;
			case "24h":
			default:
				startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
				break;
		}

		// Get performance metrics
		const [totalRequests, activeUsers, newUsers, newMatches, completedMatches] =
			await Promise.all([
				// In a real implementation, you would query request logs
				Promise.resolve(1500), // Mock data
				prisma.user.count({
					where: {
						updatedAt: { gte: startTime },
					},
				}),
				prisma.user.count({
					where: {
						createdAt: { gte: startTime },
					},
				}),
				prisma.match.count({
					where: {
						createdAt: { gte: startTime },
					},
				}),
				prisma.match.count({
					where: {
						status: "COMPLETED",
						updatedAt: { gte: startTime },
					},
				}),
			]);

		const performance = {
			timeframe,
			startTime: startTime.toISOString(),
			endTime: now.toISOString(),
			metrics: {
				totalRequests,
				activeUsers,
				newUsers,
				newMatches,
				completedMatches,
				completionRate:
					newMatches > 0
						? Math.round((completedMatches / newMatches) * 100)
						: 0,
			},
			system: {
				memoryUsage: process.memoryUsage(),
				uptime: process.uptime(),
				cpuUsage: process.cpuUsage(),
			},
		};

		res.json({
			success: true,
			data: performance,
		});
	} catch (error) {
		console.error("Error fetching performance metrics:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

// Get security and access information
router.get("/security", async (req, res) => {
	try {
		const security = {
			authentication: {
				jwtEnabled: true,
				sessionTimeout: process.env.JWT_EXPIRES_IN || "24h",
				passwordPolicy: {
					minLength: 6,
					requireSpecialChars: false,
					requireNumbers: false,
					requireUppercase: false,
				},
			},
			authorization: {
				roleBasedAccess: true,
				roles: ["COMPETITION_ADMIN", "LEAGUE_ADMIN", "TEAM_ADMIN", "PLAYER"],
				permissionHierarchy: {
					COMPETITION_ADMIN: ["full_access"],
					LEAGUE_ADMIN: [
						"user_management",
						"team_management",
						"season_management",
					],
					TEAM_ADMIN: ["team_management", "player_management"],
					PLAYER: ["view_own_stats", "view_team_info"],
				},
			},
			rateLimiting: {
				enabled: true,
				windowMs: process.env.RATE_LIMIT_WINDOW_MS || "15 minutes",
				maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
			},
			securityHeaders: {
				helmet: true,
				cors: true,
				compression: true,
			},
			lastSecurityAudit: new Date(
				Date.now() - 7 * 24 * 60 * 60 * 1000
			).toISOString(), // Mock: 7 days ago
			nextSecurityAudit: new Date(
				Date.now() + 7 * 24 * 60 * 60 * 1000
			).toISOString(), // Mock: 7 days from now
		};

		res.json({
			success: true,
			data: security,
		});
	} catch (error) {
		console.error("Error fetching security info:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Internal server error",
			},
		});
	}
});

module.exports = router;


