import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import projectsRoutes from "./routes/projects.routes.js";
import statsRoutes from "./routes/stats.routes.js";

import { notFound, errorHandler } from "./middleware/error.js";

export function buildApp() {
  const app = express();

  app.set("trust proxy", 1);

  const origins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: origins.length ? origins : true,
      credentials: true,
    })
  );

  app.use(helmet());
  app.use(morgan("dev"));

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 120,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    })
  );

  app.get("/health", (req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/projects", projectsRoutes);
  app.use("/api/stats", statsRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
