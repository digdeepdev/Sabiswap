import { Router, type IRouter } from "express";
import { GetAffiliateActivityResponse } from "@workspace/api-zod";
import { getAffiliateActivity } from "../lib/affiliate-activity";
import { publicUserIp } from "../lib/user-ip";

const router: IRouter = Router();
router.get("/affiliate/activity", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const activity = await getAffiliateActivity(publicUserIp(req.ip));
    res.json(GetAffiliateActivityResponse.parse(activity));
  } catch {
    req.log.warn("Affiliate reporting unavailable; no partial or platform-wide data returned");
    res.status(503).json({ error: "Affiliate activity is temporarily unavailable. Please try again shortly." });
  }
});
export default router;
