import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sideshiftRouter from "./sideshift";
import marketRouter from "./market";
import campaignRouter from "./campaign";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sideshiftRouter);
router.use(marketRouter);
router.use(campaignRouter);

export default router;
