# Community swap campaign

[Documentation home](README.md)

## Goal and dates

The campaign aims for **$100,000 in approved swap volume over 100 days**.
This is a transaction-volume target, **not a funded $100,000 prize pool**.

| Setting | Value |
| --- | --- |
| Start | 6 November 2026, 00:00 Africa/Lagos (UTC+1) |
| End, exclusive | 14 February 2027, 00:00 Africa/Lagos (UTC+1) |
| Last eligible calendar day | 13 February 2027, Africa/Lagos |
| Qualifying order minimum | $50 verified USD value |
| Community share | 80% of actual earned SabiSwap affiliate fees |
| Verification | Manual review before inclusion |

The configured window is 100 consecutive 24-hour days. An eligible order must be
created and completed within the campaign window. A pending or refunded order is
not a completed qualifying swap.

## Enter

1. Follow [SabiSwap on X](https://x.com/sabiswap).
2. Join [the Telegram community](https://t.me/sabiswap).
3. Complete a qualifying SabiSwap swap worth at least $50.
4. Open `/claim` in the same browser used to create the order.
5. Submit the order ID privately and your X username.
6. Confirm the social requirements and consent to public leaderboard inclusion.
7. Wait for manual review.

An ownership receipt is associated with the browser when a SabiSwap order is
created. Possessing an order ID alone does not establish eligibility. Clearing
cookies, using another browser or submitting an order created outside SabiSwap
can prevent verification.

Duplicate order submissions are blocked. Self-declared social participation does
not mean the entry is automatically approved.

## Progress and leaderboard

Only approved entries contribute to campaign progress and rankings. Rankings
aggregate approved volume by username; public results omit sensitive order IDs,
wallet addresses, private evidence and review notes.

The public affiliate activity report includes account-attributed completed swaps
across all time. The campaign includes only qualifying, approved entries in its
window. Their totals should not be expected to match.

## Reward pool

The intended community pool is:

```text
community reward pool = actual earned affiliate fees × 80%
```

It is not calculated from a guessed commission rate, the volume target, deposits,
or total provider-wide fees.

Default allocation:

| Rank | Share of community pool |
| --- | --- |
| 1 | 30% |
| 2 | 20% |
| 3 | 15% |
| Each rank from 4 through 10 | 5% |

The final group receives 35% in total, distributed equally across seven rank
positions. The shares total 100%.

Fee earnings are currently reconciled manually from actual provider reporting,
with private source evidence. An unknown fee balance is **Pending**, not a
verified zero. Published estimates are not proof of payment.

**Automated payouts and token claims are not implemented.** The operator must
finalize settlement currency, payout method, participant contact and verification,
ties, unfilled ranks, rounding and any applicable compliance requirements before
distributing rewards. The interface must not be treated as a promise that a
wallet transaction is ready to claim.

## Operator review

Authorized operators use `/campaign-admin`:

1. Sign in with the configured administrator password.
2. Review the private entry queue.
3. Check the provider order for settled status and campaign-window eligibility.
4. Verify ownership, X following and Telegram participation.
5. Verify the order's historical USD value using provider evidence.
6. Record the evidence and approve or reject with a private review note.
7. Reconcile actual earned fees with source evidence when updating the pool.

Approval and settings changes are audited. Competing reviews are protected by
transactional checks. Allocation changes are restricted to before the campaign
starts; do not bypass policy checks by editing database records directly.

The application does not automatically verify social memberships. Do not approve
entries solely on a self-attestation or an unverified screenshot.
