import "dotenv/config";
import express from "express";
import cors from "cors";

import { healthRouter } from "./routes/health.js";
import { synthesizeRouter } from "./routes/synthesize.js";
import { runsRouter } from "./routes/runs.js";


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

app.listen(port, "0.0.0.0", () => {
  console.log(`[backend] listening on http://0.0.0.0:${port}`);
});

console.log("GEMINI_MODEL=", process.env.GEMINI_MODEL);
console.log("GEMINI_API_KEY present=", Boolean(process.env.GEMINI_API_KEY));
