import { Link } from 'wouter';
import { ArrowUpRight } from 'lucide-react';
import { SiCoinmarketcap, SiGithub, SiX } from 'react-icons/si';

const X_URL = 'https://x.com/sabiswap';
const GITHUB_URL = 'https://github.com/digdeepdev/Sabiswap';
const DOCS_URL = `${GITHUB_URL}/blob/main/docs/README.md`;
const CMC_URL = 'https://coinmarketcap.com/community/profile/SabiSwap';
const ICON_URL = `${import.meta.env.BASE_URL}app-icon.png`;

interface FooterProps {
  onSwap?: () => void;
}

const linkCls =
  'group inline-flex items-center gap-1 rounded-md py-1 text-sm text-[#c9d2bb] transition-colors hover:text-[#d2f58a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7e35a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1d19]';

function Ext({ href, children, id }: { href: string; children: React.ReactNode; id: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" data-testid={`link-footer-${id}`} className={linkCls}>
      {children}
      <ArrowUpRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
    </a>
  );
}

function Int({ href, id, children }: { href: string; id: string; children: React.ReactNode }) {
  return (
    <Link href={href} data-testid={`link-footer-${id}`} className={linkCls}>
      {children}
    </Link>
  );
}

export function Footer({ onSwap }: FooterProps) {
  const heading = 'mb-3 font-mono text-xs font-bold uppercase tracking-widest text-[#b7e35a]';
  return (
    <footer className="w-full border-t border-[#2c3027] bg-[#1b1d19] text-[#eef3e4]" data-testid="footer">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-6 md:py-14">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img src={ICON_URL} alt="" width={40} height={40} className="h-10 w-10 object-contain" />
            <div>
              <p className="text-lg font-bold">SabiSwap</p>
              <p className="font-mono text-[11px] uppercase tracking-widest text-[#c9d2bb]">No Accounts. No Custody. 200+ Assets.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={X_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="SabiSwap on X (opens in a new tab)"
              data-testid="link-footer-social-x"
              className="grid h-11 w-11 place-items-center rounded-2xl bg-[#10110e] text-[#b7e35a] shadow-[0_2px_0_#2c3027] transition hover:bg-[#242820] hover:text-[#d2f58a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7e35a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1d19]"
            >
              <SiX className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="SabiSwap on GitHub (opens in a new tab)"
              data-testid="link-footer-social-github"
              className="grid h-11 w-11 place-items-center rounded-2xl bg-[#10110e] text-[#b7e35a] shadow-[0_2px_0_#2c3027] transition hover:bg-[#242820] hover:text-[#d2f58a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7e35a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1d19]"
            >
              <SiGithub className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href={CMC_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="SabiSwap on CoinMarketCap Community (opens in a new tab)"
              title="CoinMarketCap Community"
              data-testid="link-footer-social-cmc"
              className="grid h-11 w-11 place-items-center rounded-2xl bg-[#10110e] text-[#b7e35a] shadow-[0_2px_0_#2c3027] transition hover:bg-[#242820] hover:text-[#d2f58a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7e35a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1d19]"
            >
              <SiCoinmarketcap className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
          <div>
            <h2 className={heading}>Products</h2>
            <ul className="flex flex-col">
              <li>
                {onSwap ? (
                <a
                  href="#swap"
                  data-testid="link-footer-swap"
                  onClick={(e) => {
                    if (onSwap) {
                      e.preventDefault();
                      onSwap();
                    }
                  }}
                  className={linkCls}
                >
                  Swap
                </a>
                ) : (
                  <Int href="/#swap" id="swap">Swap</Int>
                )}
              </li>
              <li>
                <span className="block text-xs text-[#9aa58b]">Powered by</span>
                <Ext href="https://sideshift.ai" id="sideshift">sideshift.ai</Ext>
              </li>
            </ul>
          </div>
          <div>
            <h2 className={heading}>About</h2>
            <ul className="flex flex-col">
              <li><Ext href={DOCS_URL} id="docs">Documentation</Ext></li>
              <li><Int href="/terms" id="terms">Terms of service</Int></li>
            </ul>
          </div>
          <div>
            <h2 className={heading}>Support</h2>
            <ul className="flex flex-col">
              <li><Int href="/faq" id="faq">FAQ</Int></li>
              <li><Int href="/help" id="help">Get help</Int></li>
              <li><Int href="/claim" id="campaign">Community campaign</Int></li>
            </ul>
          </div>
          <div>
            <h2 className={heading}>Resources</h2>
            <ul className="flex flex-col">
              <li><Ext href={X_URL} id="blog">Blog</Ext></li>
              <li><Ext href={GITHUB_URL} id="github">GitHub</Ext></li>
              <li>
                <Int href="/brand-assets" id="brand-assets">Brand assets</Int>
              </li>
            </ul>
          </div>
        </nav>

        <p className="mt-10 border-t border-[#2c3027] pt-5 text-xs text-[#9aa58b]" data-testid="text-footer-note">
          Documentation is available on GitHub. Blog updates are shared on our X profile.
        </p>
      </div>
    </footer>
  );
}
