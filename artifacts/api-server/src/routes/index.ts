import { Router, type IRouter, type Request, type Response } from "express";
import healthRouter from "./health";
import { simulateGame } from "../game/gameEngine";

const router: IRouter = Router();

router.use(healthRouter);

// Debug-only: game simulation endpoint.
// Access via GET /api/debug/simulate?simulate=true
// Never called from the mobile client; guarded by query param + NODE_ENV check.
router.get("/debug/simulate", (req: Request, res: Response) => {
  if (process.env["NODE_ENV"] === "production") {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (req.query["simulate"] !== "true") {
    res.status(400).json({ error: "Pass ?simulate=true to run" });
    return;
  }
  const result = simulateGame();
  res.json(result);
});

export default router;
