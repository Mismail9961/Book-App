import express from "express";
import "dotenv/config";
import authRoutes from "../src/routes/authRoutes.js";
import bookRoutes from "../src/routes/bookRoutes.js";
import connectDB from "../src/lib/db.js";

const app = express(); // initialize first

// Middleware
app.use(express.json()); // must have () at the end

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3000;

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/book", bookRoutes);

// Start server and connect DB
app.listen(PORT, () => {
  console.log("Server is running at port", PORT);
  connectDB(); // call DB connection here
});
