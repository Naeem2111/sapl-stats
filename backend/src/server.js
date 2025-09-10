const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const multer = require("multer");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const teamRoutes = require("./routes/teams");
const playerRoutes = require("./routes/players");
const matchRoutes = require("./routes/matches");
const statsRoutes = require("./routes/stats");
const seasonRoutes = require("./routes/seasons");
const badgeRoutes = require("./routes/badges");
const competitionRoutes = require("./routes/competitions");
const adminRoutes = require("./routes/admin");
const saplRoutes = require("./routes/sapl");
const cupRoutes = require("./routes/cups");
const playerPositionRoutes = require("./routes/playerPositions");
const playerStatsRoutes = require("./routes/playerStats");
const statsFieldsRoutes = require("./routes/statsFields");
const leagueRoutes = require("./routes/leagues");
const ocrRoutes = require("./routes/ocr");
const competitionManagementRoutes = require("./routes/competitionManagement");
const ratingCalculatorRoutes = require("./routes/ratingCalculator");

// Import middleware
const { errorHandler } = require("./middleware/errorHandler");
const { notFound } = require("./middleware/notFound");

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOrigins =
	process.env.NODE_ENV === "production"
		? [
				process.env.CORS_ORIGIN || "https://your-frontend-domain.vercel.app",
				// Add additional production domains if needed
				process.env.CORS_ORIGIN_ALT,
		  ].filter(Boolean)
		: ["http://localhost:3001", "http://127.0.0.1:3001"];

app.use(
	cors({
		origin: corsOrigins,
		credentials: true,
	})
);

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Multer configuration for file uploads
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB limit
	},
});

// Apply multer middleware to auth routes for file uploads
app.use("/api/auth", upload.any());

// Request logging middleware
app.use((req, res, next) => {
	const timestamp = new Date().toISOString();
	const method = req.method;
	const path = req.path;
	const userAgent = req.get("User-Agent") || "Unknown";
	const ip = req.ip || req.connection.remoteAddress;

	console.log(`${timestamp} - ${method} ${path} - ${ip} - ${userAgent}`);
	next();
});

// Health check endpoint
app.get("/health", (req, res) => {
	res.json({
		status: "healthy",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/seasons", seasonRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/competitions", competitionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/sapl", saplRoutes);
app.use("/api/cups", cupRoutes);
app.use("/api/player-positions", playerPositionRoutes);
app.use("/api/player-stats", playerStatsRoutes);
app.use("/api/stats-fields", statsFieldsRoutes);
app.use("/api/leagues", leagueRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/competition-management", competitionManagementRoutes);
app.use("/api/rating-calculator", ratingCalculatorRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
	console.log(`🚀 Server running on port ${PORT}`);
	console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
	console.log(`🔐 API endpoints: http://0.0.0.0:${PORT}/api`);
});

module.exports = app;
