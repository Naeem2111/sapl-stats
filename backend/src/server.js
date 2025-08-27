const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

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

// Import middleware
const { errorHandler } = require("./middleware/errorHandler");
const { notFound } = require("./middleware/notFound");

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOrigins =
	process.env.NODE_ENV === "production"
		? [process.env.CORS_ORIGIN || "https://your-frontend-domain.vercel.app"]
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

// Request logging middleware
app.use((req, res, next) => {
	console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
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

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`);
	console.log(`📊 Health check: http://localhost:${PORT}/health`);
	console.log(`🔐 API endpoints: http://localhost:${PORT}/api`);
});

module.exports = app;
