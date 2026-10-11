import { Link } from 'wouter';
import { FileWarning } from 'lucide-react';
import { PageLayout, cardCls, linkCls } from '@/components/PageLayout';

const sections: { h: string; p: string[] }[] = [
  { h: 'Service', p: ['SabiSwap is proposed to be a free public web interface that lets visitors request crypto swaps. Exchanges are carried out by a third-party provider, SideShift. The interface does not ask visitors to sign in, connect a wallet or share private keys.', 'The Claim tab is a coming-soon placeholder. No rewards eligibility or claim transactions are offered.'] },
  { h: 'Responsible use', p: ['Visitors would be expected to use the interface lawfully, only with assets and addresses they are entitled to use, and without attempting to interfere with the service or bypass app or provider checks. IP address and region checks are not to be circumvented.', 'Eligibility and any restricted uses are pending review.'] },
  { h: 'Third-party services', p: ['Swaps are fulfilled by SideShift under its own terms and policies, which visitors should read. Market cards show informational USD prices from CoinGecko; they are not execution quotes. Blockchains and wallets are also independent third parties.'] },
  { h: 'Transaction risks and fees', p: ['Quotes, rates and available assets are dynamic and not guaranteed. Fixed quotes expire at the time displayed on the order. Visitors pay network fees from their sending wallet and receive the quoted receive amount.', 'Crypto transfers are generally irreversible. Sending the wrong amount, to the wrong network or without a required memo may lead to loss. No execution time and no refund is guaranteed. Cancel or Return in the interface only clears local tracking and does not cancel an order.'] },
  { h: 'Privacy and security', p: ['The interface relays the visitor IP address to the provider for eligibility checks. The selected networks, amounts and destination address are sent to the provider to create an order. The color theme and the active order ID are stored in the browser local storage; clearing browser data loses automatic tracking.', 'Order IDs are sensitive and should be shared only privately with official provider support. A full privacy policy is pending review.'] },
  { h: 'Availability and disclaimers', p: ['The interface is proposed to be provided as is and as available, and may change or be unavailable at any time, including because of provider outages. Disclaimer wording and any limitation of liability are pending review.'] },
];

const pending = ['Operator identity', 'Eligibility and restricted jurisdictions', 'Dispute resolution and governing jurisdiction', 'Liability terms', 'Effective date', 'Formal legal notice address'];

export default function Terms() {
  return (
    <PageLayout
      title="Terms of Service (Draft) | SabiSwap"
      description="Draft terms of service for the SabiSwap swap interface. Pending legal review; general information only, not legal advice."
      eyebrow="Legal"
      heading="Terms of service"
      intro="A readable draft of proposed terms for this free swap interface."
    >
      <div role="note" className="mb-8 flex gap-3 rounded-2xl border-2 border-primary-ink bg-accent p-5 text-accent-foreground" data-testid="notice-terms-draft">
        <FileWarning className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="text-[15px] leading-relaxed">
          <p className="font-bold">Draft — pending legal review</p>
          <p>This page is template and general information. It is not legal advice and not an approved agreement. Have a qualified lawyer review it before anyone relies on it.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {sections.map((s, i) => (
          <section key={s.h} className={cardCls} data-testid={`section-terms-${i}`}>
            <h2 className="mb-2 text-xl font-bold">{s.h}</h2>
            <div className="space-y-3 text-[15px] leading-relaxed text-muted-foreground">{s.p.map((t) => <p key={t}>{t}</p>)}</div>
          </section>
        ))}
        <section className={cardCls}>
          <h2 className="mb-2 text-xl font-bold">Legal details pending review</h2>
          <p className="mb-3 text-[15px] text-muted-foreground">These items are intentionally not filled in and need review:</p>
          <ul className="list-disc space-y-1 pl-5 text-[15px] text-muted-foreground">{pending.map((p) => <li key={p}>{p}</li>)}</ul>
        </section>
        <section className={cardCls}>
          <h2 className="mb-2 text-xl font-bold">Contact</h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground">No legal contact has been set. For support, see <Link href="/help" className={linkCls}>Get Help</Link>.</p>
        </section>
      </div>

      <p className="mt-8 text-sm leading-relaxed text-muted-foreground" data-testid="text-terms-attribution">
        Draft structure informed by{' '}
        <a href="https://commonpaper.com/standards/cloud-service-agreement/2.1/" target="_blank" rel="noopener noreferrer" className={linkCls}>Common Paper Cloud Service Agreement v2.1</a>{' '}
        (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className={linkCls}>CC BY 4.0</a>), adapted for this interface; not endorsed by Common Paper.
      </p>
    </PageLayout>
  );
}
