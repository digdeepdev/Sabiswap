import type { Request, Response } from "express";
import { CampaignError } from "./campaign-policy";
import { SideShiftApiError } from "./sideshift";

export function campaignHandler(fn: (req: Request, res: Response) => Promise<void>) {
  return async (req: Request, res: Response): Promise<void> => {
    try { await fn(req, res); } catch (error) {
      if (error instanceof CampaignError) { res.status(error.status).json({ error: error.message }); return; }
      if (error instanceof SideShiftApiError) {
        res.status(502).json({ error: "Could not verify the order with SideShift. No approval was saved. Try again later." }); return;
      }
      req.log.error({ errorType: error instanceof Error ? error.name : "unknown" }, "Campaign request failed");
      res.status(503).json({ error: "Campaign data is temporarily unavailable. Please try again." });
    }
  };
}
