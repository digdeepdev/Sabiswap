# API reference

[Documentation home](README.md)

## Scope and source of truth

The browser uses the SabiSwap API under the same-origin **`/api`** prefix.
The complete schemas, required fields and response types are maintained in
[`lib/api-spec/openapi.yaml`](../lib/api-spec/openapi.yaml). This guide is an
overview, not a substitute for the contract.

These are application endpoints, not a general-purpose public exchange API with
a guaranteed service-level agreement. State-changing campaign endpoints enforce
ownership, origin checks and, where applicable, administrator sessions.

## Swap and market endpoints

| Method | Path, including `/api` | Purpose |
| --- | --- | --- |
| GET | `/api/healthz` | Service health |
| GET | `/api/sideshift/coins` | Provider-supported assets and networks |
| POST | `/api/sideshift/quote` | Fixed quote for a selected asset/network pair and deposit amount |
| POST | `/api/sideshift/shifts/fixed` | Create an order using a quote and receiving address |
| GET | `/api/sideshift/shifts/{shiftId}` | Read provider order status |
| GET | `/api/market/prices` | Informational market-card data |
| GET | `/api/affiliate/activity` | Safe account-scoped recent swaps and all-time volume |

A quote request selects `depositCoin`, `depositNetwork`, `settleCoin`,
`settleNetwork` and `depositAmount`. Order creation requires `quoteId` and
`settleAddress`; consult the contract for memo and refund fields.

The server supplies affiliate attribution. Browser input cannot select the
provider secret or override the verified visitor IP.

Order creation returns HTTP 201. The `campaignTracked` indicator reports whether
the campaign ownership receipt was persisted; failure to persist a receipt must
not hide a successfully created provider order.

### Safe read-only health check

```sh
curl https://YOUR_APP_ORIGIN/api/healthz
```

Replace `YOUR_APP_ORIGIN` with the real host. Do not include secret headers in
browser-facing examples. Quote and order calls are intentionally omitted from
copy-and-paste shell examples because they depend on a verified visitor request
and may create real provider resources.

## Campaign endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/campaign` | Campaign phase, progress, rewards and approved leaderboard |
| POST | `/api/campaign/entries` | Submit an owned order and participation details |
| GET | `/api/campaign/entries/mine` | Entries associated with the browser's ownership cookie |
| GET | `/api/campaign/admin/session` | Admin configuration/authentication state |
| POST | `/api/campaign/admin/login` | Start an authenticated admin session |
| POST | `/api/campaign/admin/logout` | End the admin session |
| GET | `/api/campaign/admin/entries` | Private review queue |
| POST | `/api/campaign/admin/entries/{id}/check` | Read provider status for review |
| POST | `/api/campaign/admin/entries/{id}/review` | Approve, reject or return an entry to pending |
| GET | `/api/campaign/admin/settings` | Private campaign settings |
| PUT | `/api/campaign/admin/settings` | Update allowed settings with evidence |

Admin endpoints other than configuration/session checks and login require a valid
admin session. A public leaderboard response does not contain private submission
evidence. Use generated types for the exact request structures rather than
constructing guessed request bodies.

## Provider integration

Swap requests use SideShift's REST API at `https://sideshift.ai/api/v2`.
Authenticated calls include server-side `x-sideshift-secret`. Calls with a
verified visitor address include `x-user-ip`; quotes, order creation and order
lookup reject requests without a valid public visitor IP.

Affiliate history uses SideShift's account-scoped dashboard GraphQL reporting at
`https://sideshift.ai/graphql`. This is distinct from its documented platform-wide
recent-shifts REST feed. Because dashboard reporting is a provider-dependent
surface, monitor compatibility rather than assuming it is a permanent API contract.

The reporting service:

- Checks the authenticated account against the configured affiliate account.
- Paginates historical records and validates completeness.
- Counts only settled transactions and uses provider-reported historical USD.
- Returns up to five recent completed records.
- Withholds sensitive identifiers, wallet addresses and selected privacy amounts.
- Caches results and labels an older snapshot stale after a refresh failure.
- Returns an unavailable response if there is no reliable snapshot.

When a historical USD value is missing, aggregate USD can be `null`; this must
not be converted into a fabricated zero or partial all-time total.

## Errors

| Status | Typical interpretation |
| --- | --- |
| 400 | Invalid request, amount, visitor IP or policy input |
| 401 / 403 | Missing authorization, invalid credentials, origin restriction or provider restriction |
| 404 | Requested order or record not found |
| 409 | Duplicate submission or conflicting review |
| 429 | Application rate limit; respect `Retry-After` when provided |
| 502 / 503 | Provider/reporting failure or unavailable service |

Exact status behavior depends on the endpoint and upstream response. Display a
useful failure state; do not silently replace an error with mock prices,
fabricated activity or a successful order state.
