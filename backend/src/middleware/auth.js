const jwt = require("jsonwebtoken");
const { prisma } = require("../database/prisma");

const authenticateToken = async (req, res, next) => {
	try {
		const authHeader = req.headers["authorization"];
		const token = authHeader && authHeader.split(" ")[1];

		if (!token) {
			return res.status(401).json({
				success: false,
				error: {
					message: "Access token required",
				},
			});
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await prisma.user.findUnique({
			where: { id: decoded.userId },
			select: {
				id: true,
				username: true,
				email: true,
				role: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		if (!user) {
			return res.status(401).json({
				success: false,
				error: {
					message: "Invalid token",
				},
			});
		}

		req.user = user;
		next();
	} catch (error) {
		if (error.name === "TokenExpiredError") {
			return res.status(401).json({
				success: false,
				error: {
					message: "Token expired",
				},
			});
		}

		return res.status(401).json({
			success: false,
			error: {
				message: "Invalid token",
			},
		});
	}
};

const requireRole = (roles) => {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({
				success: false,
				error: {
					message: "Authentication required",
				},
			});
		}

		if (!roles.includes(req.user.role)) {
			return res.status(403).json({
				success: false,
				error: {
					message: "Insufficient permissions",
				},
			});
		}

		next();
	};
};

// Role hierarchy: COMPETITION_ADMIN > LEAGUE_ADMIN > TEAM_ADMIN > PLAYER
const requireCompetitionAdmin = requireRole(["COMPETITION_ADMIN"]);
const requireLeagueAdmin = requireRole(["COMPETITION_ADMIN", "LEAGUE_ADMIN"]);
const requireTeamAdmin = requireRole([
	"COMPETITION_ADMIN",
	"LEAGUE_ADMIN",
	"TEAM_ADMIN",
]);
const requirePlayer = requireRole([
	"COMPETITION_ADMIN",
	"LEAGUE_ADMIN",
	"TEAM_ADMIN",
	"PLAYER",
]);

// Legacy aliases for backward compatibility
const requireAdmin = requireLeagueAdmin;
const requireManager = requireTeamAdmin;

module.exports = {
	authenticateToken,
	requireRole,
	requireCompetitionAdmin,
	requireLeagueAdmin,
	requireTeamAdmin,
	requirePlayer,
	// Legacy exports for backward compatibility
	requireAdmin,
	requireManager,
};
