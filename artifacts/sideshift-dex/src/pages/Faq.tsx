import { Link } from 'wouter';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { PageLayout, cardCls, linkCls } from '@/components/PageLayout';

const items: { q: string; a: React.ReactNode }[] = [
  { q: 'What is SabiSwap?', a: <p>SabiSwap is a web interface for swapping crypto between assets and networks. Swaps are routed through SideShift, which handles the exchange. SabiSwap does not ask you to sign in.</p> },
  { q: 'How does a swap work?', a: <ol className="list-decimal space-y-1 pl-5"><li>Choose the deposit coin and network, and the receive coin and network.</li><li>Enter an amount and the destination address.</li><li>Review the quote and select Confirm Swap.</li><li>Send the exact crypto amount to the deposit address shown, including the memo if one is displayed.</li><li>Watch the status on the page as the order progresses.</li></ol> },
  { q: 'Why do networks, addresses and memos matter?', a: <p>The same coin can exist on several networks, and an address valid on one network may be useless on another. Select the network that matches your sending wallet and your destination address. If a deposit memo or tag is displayed, include it exactly. Transfers sent on the wrong network or without a required memo may be hard or impossible to recover.</p> },
  { q: 'Do I need an account, a wallet connection or private keys?', a: <p>No. SabiSwap does not request a login, a wallet connection or private keys. You send funds manually from your own wallet. Never share a seed phrase or private key with anyone claiming to offer support.</p> },
  { q: 'What is a fixed quote and when does it expire?', a: <p>A fixed quote locks the rate for a limited time. Always follow the expiry actually displayed on your order, since this page does not promise any specific duration. Quotes, rates and available assets are dynamic and not guaranteed until an order is created.</p> },
  { q: 'What does it cost?', a: <p>Look at the receive amount in your quote; that is the figure to compare. You will also pay network fees from your sending wallet to make the deposit. This page does not state detailed pricing beyond what the quote shows.</p> },
  { q: 'What happens if I reload or close the page?', a: <p>The active order ID is stored in your browser local storage, so the page can resume tracking after a reload. If you clear browser data, automatic tracking is lost. Choosing Cancel or Return only clears that local tracking. It does not cancel the order with the provider, and any deposit you already sent still belongs to that order.</p> },
  { q: 'Something went wrong or my transfer is late. What now?', a: <p>Transfer times depend on the networks involved and are not guaranteed, and refunds are not guaranteed either. Start with the troubleshooting steps on the <Link href="/help" className={linkCls}>Get Help page</Link>, which also explains how to reach SideShift support safely.</p> },
  { q: 'Are the market cards the price I will get?', a: <p>No. Market cards show informational USD prices from CoinGecko. They are not execution quotes. Only the quote shown in the swap flow applies to an order.</p> },
  { q: 'What is the Claim tab?', a: <p>Claim links to the SabiSwap community campaign (6 Nov 2026 to 14 Feb 2027, Africa/Lagos time). After a completed swap of at least $50, you can privately submit your order ID and X username from the same browser that created the order. Entries are reviewed manually, and only approved entries count toward progress and the public leaderboard. Entering is not a payout: no wallet connection or claim transaction is involved, and any rewards from the pool (80% of actual affiliate fees earned) are announced after a final audit.</p> },
];

export default function Faq() {
  return (
    <PageLayout
      eyebrow="Support"
      heading="Frequently asked questions"
      intro="Short answers about how swaps work here. For anything unresolved, head to Get Help."
    >
      <div className="flex flex-col gap-3" data-testid="accordion-faq">
        {items.map((it, i) => (
          <details key={it.q} className="group overflow-hidden rounded-2xl border border-border bg-card" data-testid={`faq-item-${i}`}>
              <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:text-lg [&::-webkit-details-marker]:hidden">
                {it.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-primary-ink transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
            <div className="px-5 pb-5 text-[15px] leading-relaxed text-muted-foreground">{it.a}</div>
          </details>
        ))}
      </div>
      <div className={`${cardCls} mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
        <div>
          <h2 className="text-lg font-bold">Still stuck?</h2>
          <p className="text-sm text-muted-foreground">Troubleshooting steps and official support routes are on one page.</p>
        </div>
        <Link href="/help" data-testid="link-faq-get-help" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#c9e66a] to-[#8fd94e] px-6 font-bold text-[#11150c] shadow-[0_3px_0_#5f9a2c] hover:brightness-110">
          Get help <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </PageLayout>
  );
}
