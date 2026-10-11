import { Link } from 'wouter';
import { ArrowUpRight, ShieldAlert } from 'lucide-react';
import { PageLayout, cardCls, linkCls } from '@/components/PageLayout';

const cards = [
  { id: 'quote', t: 'Quote unavailable', b: 'Quotes depend on live provider data, so a pair, network or amount may be unavailable at a given moment. Try a different amount, pair or network, or try again later. IP address or region errors reflect app or provider eligibility checks. Do not try to bypass them; contact support if you believe a check is incorrect.' },
  { id: 'delay', t: 'Transfer seems delayed', b: 'Confirmation time depends on the sending network and the receiving network, and no timing is guaranteed. Check your sending transaction in a block explorer first, then watch the order status. If it stays stuck, contact SideShift support with the details in the checklist below.' },
  { id: 'wrong', t: 'Wrong network or missing memo', b: 'If you sent on a different network than the order, or left out a required memo or tag, stop and do not send more funds. Collect your transaction hash and contact SideShift support. Recovery is not guaranteed.' },
  { id: 'expired', t: 'Order expired', b: 'Follow the expiry displayed on your order. If you have not sent anything, create a new order with a fresh quote. If you already sent funds, contact SideShift support rather than sending again.' },
];

const checklist = ['The coin and network you sent, and the coin and network you expected to receive', 'Approximate time of the transfer', 'Your transaction hash', 'A screenshot with all secrets cropped out', 'Your order ID, shared only privately through official SideShift support'];

export default function Help() {
  return (
    <PageLayout
      title="Get Help | SabiSwap"
      description="Troubleshooting for unavailable quotes, delayed transfers, wrong networks or memos and expired orders, plus official SideShift support and SabiSwap on X."
      eyebrow="Support"
      heading="Get help"
      intro="Find the closest match below. Most swap problems come down to the quote, the network or the memo."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <section key={c.id} className={cardCls} data-testid={`card-help-${c.id}`}>
            <h2 className="mb-2 text-lg font-bold">{c.t}</h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground">{c.b}</p>
          </section>
        ))}
      </div>

      <section className={`${cardCls} mt-6`}>
        <h2 className="mb-3 text-lg font-bold">Before you contact support</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-[15px] text-muted-foreground">
          {checklist.map((c) => <li key={c}>{c}</li>)}
        </ul>
      </section>

      <section role="note" className="mt-6 flex gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-5" data-testid="notice-order-id">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
        <p className="text-[15px] leading-relaxed">
          <strong>Keep your order ID private.</strong> SideShift documentation warns that the order ID is sensitive and that anyone holding it may get access to the order, including possible refund or cancel actions. Never post it on X or in any public place. Share it only privately with official SideShift support.
        </p>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className={cardCls}>
          <h2 className="mb-2 text-lg font-bold">Order or provider issues</h2>
          <p className="mb-3 text-[15px] text-muted-foreground">SideShift handles the exchange, so order-level problems go to their help center.</p>
          <a href="https://help.sideshift.ai/en/" target="_blank" rel="noopener noreferrer" data-testid="link-help-sideshift" className={`${linkCls} inline-flex items-center gap-1`}>SideShift help center <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a>
        </section>
        <section className={cardCls}>
          <h2 className="mb-2 text-lg font-bold">Questions about this app</h2>
          <p className="mb-3 text-[15px] text-muted-foreground">Message SabiSwap on X about the interface. Replies are not guaranteed. Do not post order IDs, seed phrases or private keys.</p>
          <a href="https://x.com/sabiswap" target="_blank" rel="noopener noreferrer" data-testid="link-help-x" className={`${linkCls} inline-flex items-center gap-1`}>@sabiswap on X <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a>
        </section>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">Looking for general answers first? Read the <Link href="/faq" className={linkCls}>FAQ</Link>.</p>
    </PageLayout>
  );
}
