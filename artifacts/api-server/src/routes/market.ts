import { Router, type IRouter } from "express";
import { marketPrices } from "../lib/market";

const router: IRouter = Router();

router.get("/market/prices", async (_req, res): Promise<void> => {
  try {
    const data = await marketPrices.get();
    res.setHeader("Cache-Control", "no-store");
    res.json(data);
  } catch {
    res.status(502).json({ error: "Market prices are temporarily unavailable. Please try again shortly." });
  }
});

export default router;
