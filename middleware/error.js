class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";

  if (error.code === 11000) {
    statusCode = 409;
    message = `A record with the same ${Object.keys(error.keyValue || {}).join(", ")} already exists.`;
  } else if (error.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(error.errors)
      .map((item) => item.message)
      .join("; ");
  } else if (error.name === "CastError") {
    statusCode = 400;
    message = "One or more request values are invalid.";
  } else if (error.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Request body contains invalid JSON.";
  } else if (statusCode >= 500) {
    message = "Internal server error";
    console.error(error);
  }

  res.status(statusCode).json({ success: false, message });
}

module.exports = { AppError, asyncHandler, notFound, errorHandler };
