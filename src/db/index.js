import dotenv from 'dotenv'
dotenv.config({path:"../../.env"})
import mongooose from "mongoose";
import { DB_NAME } from "../constants.js";
import mongoose from "mongoose";
import express from "express";
const app = express();


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
connectDB()
export default connectDB;
