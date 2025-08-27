const errorHandler = (err, req, res, next) => {
	let error = { ...err };
	error.message = err.message;

	// Log error for debugging
	console.error("Error:", {
		message: err.message,
		stack: err.stack,
		url: req.url,
		method: req.method,
		user: req.user?.id || "unauthenticated",
		timestamp: new Date().toISOString(),
	});

	// Prisma errors
	if (err.code === "P2002") {
		const message = "Duplicate field value entered";
		error = { message, statusCode: 400 };
	}

	if (err.code === "P2014") {
		const message = "Invalid ID value";
		error = { message, statusCode: 400 };
	}

	if (err.code === "P2003") {
		const message = "Invalid foreign key reference";
		error = { message, statusCode: 400 };
	}

	if (err.code === "P2025") {
		const message = "Record not found";
		error = { message, statusCode: 404 };
	}

	// Validation errors
	if (err.name === "ValidationError") {
		const message = Object.values(err.errors)
			.map((val) => val.message)
			.join(", ");
		error = { message, statusCode: 400 };
	}

	// JWT errors
	if (err.name === "JsonWebTokenError") {
		const message = "Invalid token";
		error = { message, statusCode: 401 };
	}

	if (err.name === "TokenExpiredError") {
		const message = "Token expired";
		error = { message, statusCode: 401 };
	}

	// Cast errors (invalid ObjectId)
	if (err.name === "CastError") {
		const message = "Invalid ID format";
		error = { message, statusCode: 400 };
	}

	// Default error
	const statusCode = error.statusCode || 500;
	const message = error.message || "Internal Server Error";

	res.status(statusCode).json({
		success: false,
		error: {
			message,
			...(process.env.NODE_ENV === "development" && { stack: err.stack }),
		},
		timestamp: new Date().toISOString(),
	});
};

module.exports = { errorHandler };
