# SabiSwap

A direct-to-wallet, multi-chain crypto swap interface powered by SideShift.ai.

**[Read the documentation](docs/README.md)** · [SideShift API documentation](https://docs.sideshift.ai)

## Features

- Live assets, networks and fixed-rate quotes from SideShift.
- Deposit instructions and order tracking with browser-based active-order recovery.
- Shareable swap-pair routes such as `/eth/sol`.
- Live market cards and account-scoped recent affiliate swaps.
- A manually reviewed community campaign with a public leaderboard.
- Pre-rendered public pages, search metadata and a sitemap.

SabiSwap supplies the interface; SideShift processes exchanges. SabiSwap does not
ask for wallet seed phrases or private keys. SideShift receives deposits to execute
orders, so this is not an on-chain AMM or a guarantee of trustless execution.
Asset availability, regional restrictions, fees and transaction risks still apply.

## Documentation

| Guide | Contents |
| --- | --- |
| [Documentation home](docs/README.md) | Overview and reading paths |
| [User guide](docs/user-guide.md) | Swaps, networks, tracking, market data and support |
| [Roadmap](docs/roadmap.md) | Short-term development and growth; long-term ecosystem plans |
| [Developer guide](docs/development.md) | Architecture, configuration, setup and checks |
| [API reference](docs/api.md) | Application endpoints and provider integration |
| [Security and operations](docs/security.md) | Visitor IPs, sensitive data, deployment and troubleshooting |

## Technology

React, Vite, TypeScript, Tailwind CSS, Express, PostgreSQL, Drizzle ORM, Zod,
TanStack Query and an OpenAPI-generated API client in a pnpm workspace.

## Official channels

- [X](https://x.com/sabiswap)
- [Telegram](https://t.me/sabiswap)
- [CoinMarketCap Community](https://coinmarketcap.com/community/profile/SabiSwap)
- [Source code](https://github.com/digdeepdev/Sabiswap)

Never publish order IDs, credentials, wallet seed phrases or private keys in
GitHub issues, pull requests or social posts. See the
[support and security guidance](docs/security.md).
