const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const teamRoutes = require("./routes/teams");
const playerRoutes = require("./routes/players");
const matchRoutes = require("./routes/matches");
const statsRoutes = require("./routes/stats");
const seasonRoutes = require("./routes/seasons");

const { errorHandler } = require("./middleware/errorHandler");
const { notFound } = require("./middleware/notFound");

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // limit each IP to 100 requests per windowMs
	message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// CORS configuration
app.use(
	cors({
		origin: process.env.FRONTEND_URL || "http://localhost:3000",
		credentials: true,
	})
);

// Logging middleware
app.use(morgan("combined"));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
	res.status(200).json({
		status: "OK",
		message: "FC 26 Pro Clubs Stats Hub API is running",
		timestamp: new Date().toISOString(),
		version: "1.0.0",
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

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
	console.log(`🚀 FC 26 Pro Clubs Stats Hub API running on port ${PORT}`);
	console.log(
		`📊 Database: ${process.env.DATABASE_URL ? "Configured" : "Not configured"}`
	);
	console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
