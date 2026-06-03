import ApiError from "../utils/ApiError.js";
import registerValidationSchema from "../validations/user.validation.js";

const validateRegister = (req, res, next) => {
  const result = registerValidationSchema.safeParse(req.body);

  if (!result.success) {
    console.log(result.error.issues)
    return next(new ApiError(400, "Validation error", result.error.issues));
  }

  next();
};

export default validateRegister;


