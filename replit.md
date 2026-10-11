# SabiSwap

A direct-to-wallet crypto swap app powered by the SideShift.ai REST API.

The user-facing website brand is SabiSwap. SideShift.ai remains the swap API provider.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required secrets: `SIDESHIFT_SECRET`, `SIDESHIFT_AFFILIATE_ID`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/sideshift-dex/` — React swap interface and active-shift tracker
- `artifacts/api-server/src/routes/sideshift.ts` — server-side SideShift proxy routes
- `artifacts/api-server/src/lib/sideshift.ts` — SideShift API client and credential boundary
- `lib/api-spec/openapi.yaml` — shared API contract and generated-client source

## Architecture decisions

- SideShift credentials and affiliate ID are injected only by the API server; the browser never receives them.
- The server must forward the actual user's public IP as `x-user-ip`. Use Express's trusted-proxy resolution, never arbitrary client IP headers, placeholder addresses, or the server IP. Fail explicitly if no public visitor IP is available.
- The MVP uses fixed-rate shifts: quote first, then create a shift, then poll the shift ID.
- No app database is needed; SideShift remains the source of truth for order state.

## Product

- Browse live SideShift-supported assets and networks.
- Request live fixed-rate quotes.
- Create a direct-to-wallet shift with a destination address.
- Copy deposit instructions and track the order until completion.
- Resume an active order after refreshing the browser.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- SideShift requires a real end-user IP for quotes and shift creation. Local preview traffic may not have a public client IP, while published traffic should supply one through the platform proxy.
- SideShift has no staging API; avoid creating real shifts during automated checks.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
