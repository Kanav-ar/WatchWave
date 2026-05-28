import { wrapAsync } from "../utils/asyncHandler.js";

const registerUser = wrapAsync(async (req, res) => {
  res.status(200).json({
    message: "ok",
  });
});

export { registerUser };
