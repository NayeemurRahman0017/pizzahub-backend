import { ApiError } from "../utils/ApiError.js";

export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(
      new ApiError(
        400,
        "Validation failed",
        result.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      )
    );
  }
  req.body = result.data;
  next();
};