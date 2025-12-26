import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { healthRouter } from "./routes/health.js";
import { synthesizeRouter } from "./routes/synthesize.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" })); // company-ish guardrail

app.use("/api/health", healthRouter);
app.use("/api/synthesize", synthesizeRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`[backend] listening on http://localhost:${port}`);
});
