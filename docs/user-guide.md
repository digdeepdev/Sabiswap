# User guide

[Documentation home](README.md)

## Before making a swap

- Check that the sending and receiving assets and networks match your wallets.
- Have enough funds for the amount and the sending wallet's network fee.
- Confirm your destination address is valid for the receiving network.
- Include any required memo or destination tag exactly as instructed.
- Review provider restrictions and the quote's amount and expiry.
- Never enter a seed phrase or private key. SabiSwap does not need either.

Availability is live, not a permanent promise that a listed network or asset will
always be supported.

## Make a swap

1. Open the **Swap** tab.
2. Choose the coin and network to send.
3. Choose the coin and network to receive.
4. Enter the amount to send and review the live fixed-rate quote.
5. Enter the receiving wallet address and any requested memo or tag.
6. Select **Confirm Swap** to create the order.
7. Follow the order's deposit instructions, including its address, amount,
   network, memo or tag, and expiry.
8. Send from your own wallet and follow the displayed order updates.

Creating an order does not authorize SabiSwap to take funds from your wallet.
You make the deposit separately. Do not send to an expired quote or reuse a
previous order's deposit instructions for a new swap.

### Rates, fees and timing

Market-card prices are not executable quotes. The SideShift quote and order
instructions determine the swap details. Sending network fees, provider pricing,
minimums, maximums and available routes can affect the outcome.

A fixed quote has a validity period; it is not an indefinite price guarantee.
Network confirmations and provider processing affect timing. No completion time
or recovery outcome is guaranteed.

## Follow or resume an order

The interface remembers the active order ID in browser local storage so an order
can resume after refresh. Clearing storage or changing browsers can remove that
local reference. Keep your own private record.

The provider remains the source of truth for order state. An order waiting for
deposit is not a completed swap. Do not send a second payment simply because an
update is slow.

Order IDs are sensitive. Anyone holding one may gain access to order information
or provider actions. Never post them in a public issue or social message.

## Share a swap pair

Pair routes use `/<from>/<to>`:

```text
/eth/sol
/btc/eth
```

The app validates assets and networks against live SideShift data. Shareable
routes select a pair, not a guaranteed rate or an existing order. Review the
network selectors after opening any link, especially for assets available on
multiple networks. Invalid or unavailable assets cannot create a valid quote.

## Market Pulse and Recent swaps

**Market Pulse** provides informational prices and trends, not settlement
guarantees or investment advice.

**Recent swaps** displays up to five completed swaps attributed to SabiSwap's
configured affiliate account. If fewer than five exist, only real transactions
are shown. This is not the provider's platform-wide activity feed.

- All-time volume uses provider-reported historical USD values.
- The total-volume figure is hidden until it reaches **$1,000**.
- Public rows omit order IDs and wallet addresses.
- Some amounts are withheld for privacy assets.
- Delayed data is labeled; unavailable data is not replaced with invented swaps.

This reporting is separate from the manually approved campaign leaderboard.

## Claim and rewards

The **Claim** area currently hosts the community campaign. It is not an enabled
token payout or an on-chain claim transaction. Campaign participation details are
provided in the app rather than this documentation. For future product plans,
see the [roadmap](roadmap.md).

## Get help

Start with the app's `/faq` and `/help` pages.

For a delayed order, first check the sending transaction in a block explorer.
For a wrong network, missing memo or expired order, stop sending funds and contact
[SideShift support](https://help.sideshift.ai/en/). Recovery is not guaranteed.

Prepare the assets and networks, approximate transfer time, transaction hash and
order ID. Send the order ID only privately through official support. Never send
your wallet credentials or pay someone promising guaranteed recovery.
