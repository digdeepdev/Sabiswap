import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sideshiftRouter from "./sideshift";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sideshiftRouter);

export default router;
