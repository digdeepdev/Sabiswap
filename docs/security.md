# Security and operations

[Documentation home](README.md)

## Credentials and sensitive data

Provider credentials belong only on the API server. Never commit real environment
files, database connection strings, admin passwords, session cookies or tokens.
Do not paste them into GitHub issues or support screenshots.

Order IDs are also sensitive. Public reporting and leaderboards omit them.
The API logger redacts order identifiers in order-lookup paths. Operators must
still review logs, exports and private evidence handling before sharing anything.

If a credential is exposed, revoke or rotate it at its source. Removing it from
the latest commit does not remove it from Git history.

## Visitor IP forwarding

SideShift must receive the **actual visitor's public IP** in `x-user-ip`.
This is not the API server's IP, a sample address or an arbitrary browser header.

The current Express application trusts one proxy hop and validates the resulting
`req.ip` with the public-IP resolver. The edge must sanitize forwarded headers,
and the deployment topology must match that trust policy.

When deploying elsewhere:

1. Identify the real reverse-proxy chain.
2. Configure trusted forwarding at the edge and Express consistently.
3. Prevent direct untrusted access that bypasses the expected proxy.
4. Verify real visitor resolution without storing unnecessary personal data.
5. Confirm private, loopback or invalid IP values fail explicitly.

Do not fix a local-preview IP error by hardcoding a public address, trusting all
forwarded headers or substituting the server IP. That would misrepresent the
visitor and weaken restriction checks.

## Cookies and administrative access

- Campaign ownership uses a server-issued HttpOnly cookie; the browser must keep
  it to associate an order with a later submission.
- Administrator sessions use opaque random tokens with hashed database storage,
  expiration and password-version checks.
- Admin cookies are HttpOnly and secure in production, with a strict SameSite
  policy. State-changing operations include origin checks.
- Login and campaign mutations include application-level rate limits.
- Password configuration requires at least 16 characters.

Use a unique strong password and HTTPS. This is a private maintenance login, not
a complete identity platform with per-operator roles or built-in MFA. Current
in-memory rate limits are process-local; multiple replicas require coordinated
edge or shared-store limiting for consistent enforcement.

## Before publishing

1. Run the build, type checks and relevant tests in the
   [developer guide](development.md).
2. Confirm production secrets and database configuration through secure host tools.
3. Back up the production database and review schema changes before applying them.
4. Keep the frontend and `/api` on the intended same origin.
5. Verify proxy trust and actual public visitor IP forwarding.
6. Serve pre-rendered public HTML, static assets and dynamic pair fallbacks.
7. Check `/api/healthz`, `/robots.txt`, `/sitemap.xml` and key public routes.
8. Confirm anonymous requests cannot read the private admin queue.
9. Check reporting failures are labeled rather than substituted with fake data.
10. Confirm campaign payout features are not advertised as enabled.

Do not run development schema-push or integration tests against production by
accident. Database changes need their own reviewed rollout; restarting the API
does not apply a missing schema.

## Troubleshooting

| Symptom | Checks |
| --- | --- |
| Public IP could not be determined | Trusted proxy chain, forwarded visitor IP, private-preview origin |
| Quote rejected | Provider restrictions, selected network, amount, limits and quote validity |
| Credentials not configured | Server environment contains both required SideShift variables |
| Recent swaps unavailable | Provider reporting compatibility, account match and refresh errors |
| Total volume not visible | Intentionally hidden below $1,000; unknown historical USD is not zero |
| No campaign credit | Review the participation information in the app and contact SabiSwap privately |
| Campaign database error | Connection, schema availability and safe database rollout |
| Admin not configured | Password must be present and at least 16 characters |
| Order missing after refresh | Browser local storage may have been cleared; contact official support privately |

## Reporting problems

For public interface bugs, use a GitHub issue with reproduction steps, browser
details, expected behavior and a sanitized screenshot.

Do not include private order IDs, addresses tied to a person, credentials,
passwords or database exports in a public issue. For a possible security exposure,
contact SabiSwap privately through its official channels instead of publishing an
exploit or sensitive evidence. Order processing and recovery questions belong
with [official SideShift support](https://help.sideshift.ai/en/).

## Provider changes and limitations

Monitor SideShift's documentation for authentication and reporting changes.
The current client uses secret-header authentication; do not assume this remains
supported indefinitely. Any authentication migration needs verification before
release.

The draft terms are not finalized legal advice. Automated reward payouts, automatic
social verification, trustless AMM execution and guaranteed recovery are not
implemented features.
