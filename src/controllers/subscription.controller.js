import { FREE_PLAN_LIMIT } from "../constants.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { stripe } from "../services/stripe.js";
import { countActiveItems } from "../services/subscription.js";

export const createCheckoutSession = asyncHandler(async (req, res) => {
  if (req.user.subscriptionPlan === "premium") throw new ApiError(409, "You are already on the Premium plan");

  const vendorId = String(req.user._id);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: env.premiumCurrency,
          unit_amount: env.premiumAmount,
          recurring: { interval: "month" },
          product_data: { name: "PizzaHub Premium Vendor" },
        },
      },
    ],
    customer_email: req.user.email,
    client_reference_id: vendorId,
    metadata: { vendorId },
    subscription_data: { metadata: { vendorId } },
    success_url: `${env.frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.frontendUrl}/payment-cancel`,
  });
  res.status(201).json({ url: session.url });
});

export const mySubscription = asyncHandler(async (req, res) => {
  const premium = req.user.subscriptionPlan === "premium";
  res.json({
    plan: req.user.subscriptionPlan ?? "free",
    expiresAt: req.user.subscriptionExpiresAt ?? null,
    activeItems: await countActiveItems(req.user._id),
    activeItemLimit: premium ? null : FREE_PLAN_LIMIT,
  });
});