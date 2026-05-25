import mongooose from "mongoose";
import { DB_NAME } from "../constants";
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`,
    );
  } catch (error) {
    console.log("ERROR:", error);
    process.exit(1);
  }
};
