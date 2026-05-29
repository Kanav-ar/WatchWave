import ApiError from "../utils/ApiError";
import registerValidationSchema from "../validations/user.validation";

const validate = (req, res, next) => {
  const result = registerValidationSchema.safeParse(req.body);

  if (!result.success) {
    return next(new ApiError(400, "Validation error", result.error.issues));
  }

  next();
};

export default validate;

// Doubts
// - structure
// - what does this parse method return and how can i send the direct (exact) message at frontend
