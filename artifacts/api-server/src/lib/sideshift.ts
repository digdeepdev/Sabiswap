const SIDESHIFT_API_BASE = "https://sideshift.ai/api/v2";

export class SideShiftApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string | null = null,
  ) {
    super(message);
    this.name = "SideShiftApiError";
  }
}

function getCredentials(): { secret: string; affiliateId: string } {
  const secret = process.env.SIDESHIFT_SECRET;
  const affiliateId = process.env.SIDESHIFT_AFFILIATE_ID;

  if (!secret || !affiliateId) {
    throw new SideShiftApiError(
      "SideShift credentials are not configured",
      500,
    );
  }

  return { secret, affiliateId };
}

function extractErrorMessage(payload: unknown): string {
  if (typeof payload === "string") return payload;
  if (!payload || typeof payload !== "object") return "SideShift request failed";

  const value = payload as Record<string, unknown>;
  if (typeof value.message === "string") return value.message;
  if (typeof value.error === "string") return value.error;
  if (
    value.error &&
    typeof value.error === "object" &&
    typeof (value.error as Record<string, unknown>).message === "string"
  ) {
    return (value.error as Record<string, string>).message;
  }

  return "SideShift request failed";
}

export function getSideShiftAffiliateId(): string {
  return getCredentials().affiliateId;
}

export async function sideShiftRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: Record<string, unknown>;
    userIp?: string;
    authenticated?: boolean;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body) headers["Content-Type"] = "application/json";

  if (options.method === "POST" && !options.userIp) {
    throw new SideShiftApiError(
      "A verified visitor IP is required to create a SideShift quote or shift.",
      400,
    );
  }

  if (options.authenticated) {
    headers["x-sideshift-secret"] = getCredentials().secret;
  }

  if (options.userIp) headers["x-user-ip"] = options.userIp;

  let response: Response;
  try {
    response = await fetch(`${SIDESHIFT_API_BASE}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : null;
    throw new SideShiftApiError(
      "Could not reach SideShift. Please try again.",
      502,
      details,
    );
  }

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    throw new SideShiftApiError(
      extractErrorMessage(payload),
      response.status,
      typeof payload === "string" ? payload : null,
    );
  }

  return payload as T;
}