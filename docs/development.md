# Developer guide

[Documentation home](README.md)

## Repository layout

```text
artifacts/sideshift-dex/       React/Vite frontend and static pre-rendering
artifacts/api-server/          Express API, provider clients and campaign services
artifacts/mockup-sandbox/      Design previews; not the production swap app
lib/api-spec/openapi.yaml      Application API source of truth
lib/api-client-react/          Generated client and React Query hooks
lib/api-zod/                   Generated request/response validation
lib/db/                        PostgreSQL connection and Drizzle schemas
docs/                          Public documentation
```

Use pnpm and the committed lockfile. The project targets modern Node.js
(the workspace uses Node.js 24). Do not introduce npm or Yarn lockfiles.

## Configuration

Set configuration securely in the host environment. Do not place real credentials
in source code, screenshots, documentation, command history or committed files.
Never expose secrets using frontend `VITE_*` variables.

| Variable | Purpose |
| --- | --- |
| `SIDESHIFT_SECRET` | Server-only provider authentication |
| `SIDESHIFT_AFFILIATE_ID` | Server-side swap attribution and account reporting validation |
| `DATABASE_URL` | PostgreSQL connection for campaign records and admin sessions |
| `CAMPAIGN_ADMIN_PASSWORD` | Enables admin access when at least 16 characters long |
| `PORT` | Required listening port for each service |
| `BASE_PATH` | Required Vite base path; `/` for the root-mounted frontend |
| `NODE_ENV` | Runtime/build environment; use production for production serving |

The current campaign admin implementation uses opaque, database-backed session
tokens; it does not depend on `SESSION_SECRET`. A secret with that name may exist
in the host but is not a replacement for the admin password.

## Install and start

```sh
pnpm install --frozen-lockfile
```

Configure a **development** PostgreSQL database, then review and apply the schema:

```sh
pnpm --filter @workspace/db run push
```

This command changes the selected database. Confirm it is not production and
review Drizzle's proposed operations before approving them.

In separate terminals:

```sh
PORT=8080 pnpm --filter @workspace/api-server run dev
PORT=20613 BASE_PATH=/ pnpm --filter @workspace/sideshift-dex run dev
```

The browser calls `/api` on the same origin. Running both ports does not by itself
provide same-origin routing: use the managed workspace proxy or configure a
trusted reverse proxy that routes `/api` to the API service and the other public
paths to Vite. Do not hardcode a backend localhost address in browser code.

Valid live quotes also require a verified public visitor IP. Direct localhost or
private-preview traffic can intentionally fail this check. See
[visitor IP forwarding](security.md#visitor-ip-forwarding).

## Data flow

```text
Browser → same-origin /api → validation → server-side SideShift client → SideShift
Browser ← safe API response ← provider result / reporting cache
Campaign services ↔ PostgreSQL
```

SideShift owns order status. PostgreSQL stores campaign order receipts,
submissions, settings, audit history and administrator sessions; it is not an
independent exchange ledger.

Order creation and campaign persistence are deliberately separated: an already
created swap must remain visible even if recording its campaign receipt fails.
The response's `campaignTracked` flag communicates that condition.

## Change the API contract

1. Edit `lib/api-spec/openapi.yaml`.
2. Regenerate client and validation packages:

   ```sh
   pnpm --filter @workspace/api-spec run codegen
   ```

3. Implement the Express route and validation.
4. Update the consuming UI, loading states, errors and cache invalidation.
5. Typecheck and run the relevant tests.

Do not hand-edit generated client files as the source of truth.

## Build and verify

```sh
pnpm run typecheck
PORT=20613 BASE_PATH=/ pnpm --filter @workspace/sideshift-dex run build
pnpm --filter @workspace/sideshift-dex run check:seo
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run test:affiliate
pnpm --filter @workspace/api-server run test:campaign
```

Campaign integration tests require the configured development database and use
test fixtures. Never point test runs at a production database.

Affiliate tests cover aggregation, historical USD values, privacy, pagination,
account matching and safe errors. Campaign tests exercise policy and the
submission/review lifecycle. Automated tests must not create real provider orders
or send funds; SideShift has no staging API in this integration.

Frontend output is `artifacts/sideshift-dex/dist/public`; the API bundle is in
`artifacts/api-server/dist`. Build outputs and dependencies are ignored by Git.

## SEO and routing

The frontend build pre-renders public routes and injects titles, descriptions,
canonical links, social cards and JSON-LD. The expandable homepage description
exists in the initial HTML and is available to both users and crawlers.

Deploy static route outputs along with the API. Preserve the configured dynamic
pair fallback and the special `/claim` and `/campaign-admin` route handling.
The private admin page and unapproved terms remain `noindex`; the public sitemap
excludes them. A `noindex` directive is not access control.

The canonical origin is configured in `src/lib/seo.ts`. If the published domain
changes, update and verify canonical URLs, generated sitemap, robots file, social
images and routing together.
