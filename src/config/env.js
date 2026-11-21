import "dotenv/config";

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: required("MONGODB_URI"),
  dbName: process.env.MONGODB_DB || "pizzahub",
  frontendUrl: required("FRONTEND_URL").replace(/\/+$/, ""),
  stripeSecretKey: required("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: required("STRIPE_WEBHOOK_SECRET"),
  premiumAmount: Number(process.env.PREMIUM_PRICE_AMOUNT) || 999,
  premiumCurrency: (process.env.PREMIUM_PRICE_CURRENCY || "usd").toLowerCase(),
};