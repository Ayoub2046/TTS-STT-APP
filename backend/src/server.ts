import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import translationRoutes from "./routes/translation.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import datasetRoutes from "./routes/dataset.routes.js";
import huggingfaceRoutes from "./routes/huggingface.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGINS.split(",").map((o) => o.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(pinoHttp({ level: env.NODE_ENV === "test" ? "silent" : "info" }));

const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ success: true, status: "ok", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/translations", translationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/datasets", datasetRoutes);
app.use("/api/huggingface", huggingfaceRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

if (env.NODE_ENV !== "test") {
  app.listen(env.PORT, () => {
    console.log(`🚀 MaayMaxaa DataHub API listening on http://localhost:${env.PORT}`);
  });
}

export default app;