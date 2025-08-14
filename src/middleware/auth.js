const jwt = require("jsonwebtoken");
const { prisma } = require("../database/prisma");

const authenticateToken = async (req, res, next) => {
	try {
		const authHeader = req.headers["authorization"];
		const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

		if (!token) {
			return res.status(401).json({
				error: "Access token required",
				message: "Please provide a valid authentication token",
			});
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		// Get user from database to ensure they still exist
		const user = await prisma.user.findUnique({
			where: { id: decoded.userId },
			select: {
				id: true,
				username: true,
				email: true,
				role: true,
				createdAt: true,
			},
		});

		if (!user) {
			return res.status(401).json({
				error: "Invalid token",
				message: "User no longer exists",
			});
		}

		req.user = user;
		next();
	} catch (error) {
		if (error.name === "JsonWebTokenError") {
			return res.status(401).json({
				error: "Invalid token",
				message: "Token is malformed or invalid",
			});
		}

		if (error.name === "TokenExpiredError") {
			return res.status(401).json({
				error: "Token expired",
				message: "Authentication token has expired",
			});
		}

		console.error("Auth middleware error:", error);
		return res.status(500).json({
			error: "Authentication error",
			message: "Internal server error during authentication",
		});
	}
};

const requireRole = (roles) => {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({
				error: "Authentication required",
				message: "Please log in to access this resource",
			});
		}

		if (!roles.includes(req.user.role)) {
			return res.status(403).json({
				error: "Insufficient permissions",
				message: "You do not have permission to access this resource",
			});
		}

		next();
	};
};

const requireAdmin = requireRole(["ADMIN"]);
const requireManager = requireRole(["ADMIN", "MANAGER"]);
const requirePlayer = requireRole(["ADMIN", "MANAGER", "PLAYER"]);

module.exports = {
	authenticateToken,
	requireRole,
	requireAdmin,
	requireManager,
	requirePlayer,
};
