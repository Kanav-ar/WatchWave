import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import connectDB from "./db";
import express from "express";

const app = express();

connectDB()
  .then(() => {
    let PORT = process.env.PORT || 8000;
    app.on("error", (error) => {
      console.log("SERVER ERROR: ", error);
      throw error;
    });
    app.listen(PORT, () => {
      console.log("Connection successful! Listening on the port", PORT);
    });
  })
  .catch((err) => {
    console.log("Connection failed", err);
  });
