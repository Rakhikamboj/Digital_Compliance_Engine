  import express from "express";
  import mongoose from "mongoose";
  import cors from "cors";
  import dotenv from "dotenv";
  dotenv.config();
  import authRoutes from "./routes/auth.js"
  import reportingPeriod from "./routes/reporting.js"
  import wasteEntry from "./routes/waste.js"
  import adminRoutes from "./routes/admin.js"
  import auditorRoutes from "./routes/auditor.js"
  const app = express();
  const PORT = process.env.PORT;
  const MONGODB_URI = process.env.MONGODB_URI;

  app.use(cors());
  app.use(express.json());

  // Routes
  app.use("/api/auth", authRoutes)
  app.use("/api/admin", adminRoutes)
  app.use("/api/auditor", auditorRoutes)
  app.use("/api/reporting-period", reportingPeriod)
  app.use("/api/waste-entries", wasteEntry)
  // Database Connection
  mongoose.connect(MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Could not connect to MongoDB", err));

  // ================= Server =================
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
