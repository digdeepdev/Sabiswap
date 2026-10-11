import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sideshiftRouter from "./sideshift";
import marketRouter from "./market";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sideshiftRouter);
router.use(marketRouter);

export default router;
