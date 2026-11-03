# SabiSwap documentation

SabiSwap is a multi-chain cryptocurrency swap interface powered by SideShift.ai.
It lets users select assets and networks, review a live quote, supply a receiving
address, and follow an order from deposit instructions through provider updates.

This documentation describes the implementation in this repository. It is not a
promise of returns, a guarantee of asset availability, or finalized legal terms.
Provider behavior can change; consult [SideShift's documentation](https://docs.sideshift.ai)
alongside this guide.

## Contents

1. [User guide](user-guide.md) — making a swap, choosing networks, following orders,
   understanding market data, and getting help.
2. [Community campaign](campaign.md) — the 100-day volume campaign, entry rules,
   manual verification, leaderboard and reward allocations.
3. [Developer guide](development.md) — repository layout, environment variables,
   local development, data model, build steps and tests.
4. [API reference](api.md) — the browser-to-server contract, integration boundaries
   and endpoint inventory.
5. [Security and operations](security.md) — visitor IP forwarding, credentials,
   cookies, privacy, production checks and troubleshooting.

## Product boundaries

| Component | Responsibility |
| --- | --- |
| SabiSwap frontend | Asset selection, quote display, receiving-address input, order instructions and public pages |
| SabiSwap API | Validates requests, keeps provider credentials server-side, forwards verified visitor IPs and serves reporting |
| SideShift | Supported assets, quotes, deposit processing, settlement and provider-level order handling |
| Campaign database | Order ownership receipts, submissions, reviews, campaign settings, admin sessions and audit history |
| Market data | Price cards are informational and separate from executable SideShift quotes |

Users do not create a SabiSwap account to swap. They still send funds to the
provider's deposit address. “Direct-to-wallet” describes settlement to the user's
specified address; it does not eliminate provider, network or address-entry risk.

## Public pages

| Route | Purpose |
| --- | --- |
| `/` | Swap interface, market prices, recent swaps and expandable product information |
| `/<from>/<to>` | Preselected swap pair, for example `/eth/sol` |
| `/claim` | Community campaign, entry form and approved leaderboard |
| `/faq` | Common swap questions |
| `/help` | Troubleshooting and support |
| `/brand-assets` | Downloadable icons and brand guidance |
| `/terms` | Draft terms pending legal review; excluded from indexing |

`/campaign-admin` is a private operational screen, not a customer account portal.
It is excluded from indexing, but real authorization is enforced by the API,
not by its indexing status.

## Official references

- [SideShift API](https://docs.sideshift.ai)
- [SideShift support](https://help.sideshift.ai/en/)
- [SabiSwap on X](https://x.com/sabiswap)
- [SabiSwap Telegram community](https://t.me/sabiswap)
- [SabiSwap on CoinMarketCap Community](https://coinmarketcap.com/community/profile/SabiSwap)

For order problems, share sensitive details only through official private support.
Public documentation and GitHub issues must never include real order IDs or secrets.
