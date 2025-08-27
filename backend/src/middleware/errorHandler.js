const errorHandler = (err, req, res, next) => {
	let statusCode = 500;
	let message = "Internal Server Error";

	// Prisma errors
	if (err.code === "P2002") {
		statusCode = 400;
		message = "Duplicate field value";
	} else if (err.code === "P2025") {
		statusCode = 404;
		message = "Record not found";
	} else if (err.code === "P2003") {
		statusCode = 400;
		message = "Foreign key constraint failed";
	}

	// Joi validation errors
	if (err.isJoi) {
		statusCode = 400;
		message = err.details[0].message;
	}

	// JWT errors
	if (err.name === "JsonWebTokenError") {
		statusCode = 401;
		message = "Invalid token";
	} else if (err.name === "TokenExpiredError") {
		statusCode = 401;
		message = "Token expired";
	}

	// Cast errors (usually from MongoDB, but keeping for compatibility)
	if (err.name === "CastError") {
		statusCode = 400;
		message = "Invalid ID format";
	}

	// Log error for debugging
	console.error("Error:", {
		message: err.message,
		stack: err.stack,
		url: req.originalUrl,
		method: req.method,
		timestamp: new Date().toISOString(),
	});

	res.status(statusCode).json({
		success: false,
		error: {
			message: message || err.message,
		},
		timestamp: new Date().toISOString(),
	});
};

module.exports = { errorHandler };
