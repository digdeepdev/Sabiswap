import { Moon, Sun, TrendingUp, ArrowLeftRight } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onMarket: () => void;
  onSwap: () => void;
}

export function Header({ isDark, onToggleTheme, onMarket, onSwap }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#2c3027] bg-[#1b1d19] text-[#eef3e4]">
      <nav aria-label="Primary" className="flex h-16 items-center justify-between gap-2 px-3 sm:px-6">
        <span className="flex items-center">
          <img
            src={`${import.meta.env.BASE_URL}app-icon.png`}
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 sm:h-10 sm:w-10 object-contain"
          />
          <span className="sr-only">SabiSwap</span>
        </span>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            data-testid="button-theme-toggle"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl bg-[#10110e] text-[#b7e35a] shadow-[0_2px_0_#2c3027] transition hover:bg-[#242820] hover:text-[#d2f58a] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7e35a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1d19]"
          >
            {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
          </button>
          <button
            type="button"
            data-testid="button-market"
            onClick={onMarket}
            className="flex h-10 sm:h-11 items-center gap-2 rounded-2xl bg-[#2a3022] px-3 sm:px-4 text-sm sm:text-base font-semibold text-[#d2f58a] shadow-[0_2px_0_#1f2419] transition hover:bg-[#363f2b] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7e35a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1d19]"
          >
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            Market
          </button>
          <button
            type="button"
            data-testid="button-swap"
            onClick={onSwap}
            className="flex h-10 sm:h-11 items-center gap-2 rounded-full bg-gradient-to-br from-[#c9e66a] to-[#8fd94e] px-4 sm:px-6 text-sm sm:text-base font-bold text-[#11150c] shadow-[0_3px_0_#5f9a2c] transition hover:brightness-110 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7e35a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1d19]"
          >
            <ArrowLeftRight className="h-4 w-4 hidden min-[380px]:block" aria-hidden="true" />
            Swap
          </button>
        </div>
      </nav>
    </header>
  );
}
