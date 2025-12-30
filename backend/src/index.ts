import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { healthRouter } from "./routes/health.js";
import { synthesizeRouter } from "./routes/synthesize.js";
import { runsRouter } from "./routes/runs.js";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" })); 

app.use("/api/health", healthRouter);
app.use("/api/synthesize", synthesizeRouter);
app.use("/api/runs", runsRouter);


app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`[backend] listening on http://localhost:${port}`);
});

console.log("GEMINI_MODEL=", process.env.GEMINI_MODEL);
console.log("GEMINI_API_KEY present=", Boolean(process.env.GEMINI_API_KEY));
