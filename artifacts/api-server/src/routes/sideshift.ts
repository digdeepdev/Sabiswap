import {
  Router,
  type IRouter,
  type Request,
  type Response,
} from "express";
import {
  CreateSideShiftFixedShiftBody,
  CreateSideShiftFixedShiftResponse,
  CreateSideShiftQuoteBody,
  CreateSideShiftQuoteResponse,
  GetSideShiftShiftParams,
  GetSideShiftShiftResponse,
  ListSideShiftCoinsResponse,
} from "@workspace/api-zod";
import {
  getSideShiftAffiliateId,
  SideShiftApiError,
  sideShiftRequest,
} from "../lib/sideshift";
import { publicUserIp } from "../lib/user-ip";
import { recordCampaignOrder } from "../lib/campaign-security";

const router: IRouter = Router();

function getUserIp(req: Request): string {
  // req.ip applies Express's trust-proxy policy to X-Forwarded-For.
  // Never prefer arbitrary client-supplied IP headers or fall back to server IP.
  const ip = publicUserIp(req.ip);
  if (!ip) {
    throw new SideShiftApiError(
      "Your public IP could not be determined. Live swaps require a valid visitor IP forwarded by the app proxy.",
      400,
    );
  }
  return ip;
}

function sendSideShiftError(
  req: Request,
  res: Response,
  error: unknown,
  fallbackStatus = 502,
): void {
  if (error instanceof SideShiftApiError) {
    const status =
      error.status >= 400 && error.status < 500 ? error.status : fallbackStatus;
    const message = error.message.toLowerCase().includes("x-user-ip")
      ? "Live quotes require a public visitor IP. Publish the app to enable them."
      : error.message;
    req.log.warn(
      { upstreamStatus: error.status },
      "SideShift API request failed",
    );
    res.status(status).json({
      error: message,
      details: error.details,
    });
    return;
  }

  req.log.error({ err: error }, "Unexpected SideShift API error");
  res.status(502).json({
    error: "SideShift is temporarily unavailable. Please try again.",
    details: null,
  });
}

router.get("/sideshift/coins", async (req, res): Promise<void> => {
  try {
    const coins = await sideShiftRequest<unknown>("/coins");
    res.json(ListSideShiftCoinsResponse.parse(coins));
  } catch (error) {
    sendSideShiftError(req, res, error);
  }
});

router.post("/sideshift/quote", async (req, res): Promise<void> => {
  const parsed = CreateSideShiftQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message, details: null });
    return;
  }

  const amount = Number(parsed.data.depositAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({
      error: "Deposit amount must be greater than zero",
      details: null,
    });
    return;
  }

  try {
    const quote = await sideShiftRequest<unknown>("/quotes", {
      method: "POST",
      authenticated: true,
      userIp: getUserIp(req),
      body: {
        ...parsed.data,
        affiliateId: getSideShiftAffiliateId(),
        settleAmount: null,
      },
    });
    res.json(CreateSideShiftQuoteResponse.parse(quote));
  } catch (error) {
    sendSideShiftError(req, res, error);
  }
});

router.post("/sideshift/shifts/fixed", async (req, res): Promise<void> => {
  const parsed = CreateSideShiftFixedShiftBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message, details: null });
    return;
  }

  try {
    const shift = await sideShiftRequest<unknown>("/shifts/fixed", {
      method: "POST",
      authenticated: true,
      userIp: getUserIp(req),
      body: {
        ...parsed.data,
        affiliateId: getSideShiftAffiliateId(),
      },
    });
    const result = CreateSideShiftFixedShiftResponse.parse(shift);
    let campaignTracked = true;
    try {
      await recordCampaignOrder(req, res, result.id);
    } catch {
      campaignTracked = false;
      // A campaign persistence problem must never hide an already-created swap.
      req.log.error("Created swap could not be registered for campaign verification");
    }
    res.status(201).json({ ...result, campaignTracked });
  } catch (error) {
    sendSideShiftError(req, res, error);
  }
});

router.get("/sideshift/shifts/:shiftId", async (req, res): Promise<void> => {
  const parsed = GetSideShiftShiftParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message, details: null });
    return;
  }

  try {
    const shift = await sideShiftRequest<unknown>(
      `/shifts/${encodeURIComponent(parsed.data.shiftId)}`,
      { authenticated: true, userIp: getUserIp(req) },
    );
    res.json(GetSideShiftShiftResponse.parse(shift));
  } catch (error) {
    if (error instanceof SideShiftApiError && error.status === 404) {
      res.status(404).json({ error: "Shift not found", details: null });
      return;
    }
    sendSideShiftError(req, res, error);
  }
});

export default router;