import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "notes-synthesizer-backend",
    time: new Date().toISOString()
  });
});
