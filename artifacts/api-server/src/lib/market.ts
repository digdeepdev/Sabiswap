import { GetMarketPricesResponse } from "@workspace/api-zod";
import { logger } from "./logger";

const MARKET_URL = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=12&page=1&sparkline=true&price_change_percentage=24h";
const CACHE_MS = 60_000;
const MAX_STALE_MS = 15 * 60_000;
type MarketPrices = ReturnType<typeof GetMarketPricesResponse.parse>;

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** A shared cache prevents every visitor from making a separate provider request. */
export class MarketPriceService {
  private cache: MarketPrices | undefined;
  private fetchedAtMs = 0;
  private retryAfterMs = 0;
  private pending: Promise<MarketPrices> | undefined;

  constructor(
    private readonly fetcher: typeof fetch = fetch,
    private readonly now: () => number = Date.now,
  ) {}

  async get(): Promise<MarketPrices> {
    const age = this.now() - this.fetchedAtMs;
    if (this.cache && age < CACHE_MS) return this.cache;
    if (this.now() < this.retryAfterMs) return this.staleOrThrow();
    if (!this.pending) {
      this.pending = this.refresh().finally(() => { this.pending = undefined; });
    }
    return this.pending;
  }

  private staleOrThrow(): MarketPrices {
    if (this.cache && this.now() - this.fetchedAtMs < MAX_STALE_MS) {
      return { ...this.cache, stale: true };
    }
    throw new Error("Market prices are temporarily unavailable");
  }

  private async refresh(): Promise<MarketPrices> {
    try {
      const response = await this.fetcher(MARKET_URL, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`CoinGecko returned HTTP ${response.status}`);
      const raw: unknown = await response.json();
      if (!Array.isArray(raw) || raw.length === 0) throw new Error("Empty market response");
      const coins = raw.map((item: unknown) => {
        if (!item || typeof item !== "object") throw new Error("Invalid market data");
        const coin = item as Record<string, unknown>;
        const history = coin.sparkline_in_7d as { price?: unknown } | undefined;
        return {
          id: coin.id,
          symbol: coin.symbol,
          name: coin.name,
          image: coin.image,
          priceUsd: coin.current_price,
          change24h: finiteNumber(coin.price_change_percentage_24h) ? coin.price_change_percentage_24h : null,
          rank: finiteNumber(coin.market_cap_rank) ? coin.market_cap_rank : null,
          sparkline: Array.isArray(history?.price) ? history.price.filter(finiteNumber) : [],
          lastUpdated: typeof coin.last_updated === "string" ? coin.last_updated : null,
        };
      });
      const data = GetMarketPricesResponse.parse({
        coins,
        fetchedAt: new Date(this.now()).toISOString(),
        source: "CoinGecko",
        stale: false,
      });
      this.cache = data;
      this.fetchedAtMs = this.now();
      this.retryAfterMs = 0;
      return data;
    } catch (err) {
      this.retryAfterMs = this.now() + 30_000;
      logger.warn({ err }, "Unable to refresh cryptocurrency market data");
      return this.staleOrThrow();
    }
  }
}

export const marketPrices = new MarketPriceService();
