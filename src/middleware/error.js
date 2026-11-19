import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export const notFound = (req, _res, next) =>
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message, ...(err.details && { errors: err.details }) });
  }
  if (err.type === "entity.parse.failed") return res.status(400).json({ message: "Invalid JSON body" });
  if (err.type === "entity.too.large") return res.status(413).json({ message: "Request body too large" });
  if (err.code === 11000) return res.status(409).json({ message: "Duplicate record" });

  console.error(err);
  res.status(500).json({
    message: env.nodeEnv === "production" ? "Internal server error" : err.message,
  });
};