import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";

import { errorHandler, notFound } from "./middleware/error.js";
import { stripeWebhook } from "./controllers/webhook.controller.js";

import menuRoutes from "./routes/menu.routes.js";
import vendorRoutes from "./routes/vendor.routes.js";
import orderRoutes from "./routes/order.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import profileRoutes from "./routes/profile.routes.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Ensure MongoDB connection before handling requests
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// Root route
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "PizzaHub Backend API is running!",
  });
});

// Stripe webhook - raw body required
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// JSON body parser
app.use(express.json({ limit: "100kb" }));

// API rate limiter
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Health check
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "PizzaHub API is healthy",
  });
});

// API routes
app.use("/api/menu", menuRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/profile", profileRoutes);

// 404 and error handling
app.use(notFound);
app.use(errorHandler);

export default app;