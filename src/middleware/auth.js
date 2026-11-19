import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env.js";
import { collections as db } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { userIdFilter } from "../utils/helpers.js";
import { expireSubscriptionIfNeeded } from "../services/subscription.js";

// Better Auth (jwt plugin) publishes its public keys here.
const JWKS = createRemoteJWKSet(new URL("/api/auth/jwks", env.frontendUrl));

/**
 * 1. Read "Authorization: Bearer <jwt>"
 * 2. Verify signature, expiry, issuer and audience (invalid/expired -> 401)
 * 3. Load the user from the DB and take the ROLE FROM THE DB, never from the client/token
 * 4. Blocked users -> 403
 */
export const verifyJWT = asyncHandler(async (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "Missing or malformed Authorization header");
  }

  let payload;
  try {
    ({ payload } = await jwtVerify(token, JWKS, {
      issuer: env.frontendUrl,
      audience: env.frontendUrl,
      algorithms: ["EdDSA", "RS256", "ES256"],
    }));
  } catch (err) {
    throw new ApiError(401, err?.code === "ERR_JWT_EXPIRED" ? "Token expired" : "Invalid token");
  }
  if (!payload.sub) throw new ApiError(401, "Invalid token");

  const user = await db.users().findOne(userIdFilter(payload.sub));
  if (!user) throw new ApiError(401, "User not found");
  if (user.isBlocked) throw new ApiError(403, "Your account has been blocked");

  await expireSubscriptionIfNeeded(user);
  req.user = user;
  next();
});

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, "You do not have permission to perform this action"));
  }
  next();
};