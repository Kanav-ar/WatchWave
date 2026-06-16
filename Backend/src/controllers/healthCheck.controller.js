import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { wrapAsync } from "../utils/asyncHandler.js"
import mongoose from "mongoose";

const healthcheck = wrapAsync(async (req, res) => {

  const isDbConnected = mongoose.connection.readyState === 1;

  return res.status(isDbConnected ? 200 : 503).json(
    new ApiResponse(
      isDbConnected ? 200 : 503,
      {
        status: isDbConnected ? "healthy" : "unhealthy",
        database: isDbConnected ? "connected" : "disconnected",
        uptime: process.uptime(),
        timestamp: new Date(),
      },
      isDbConnected
        ? "Server is running properly"
        : "Database connection lost"
    )
  );
});

export { healthcheck };
export { healthcheck };
