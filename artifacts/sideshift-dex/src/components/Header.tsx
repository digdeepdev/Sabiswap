import { Moon, Sun, TrendingUp, ArrowLeftRight } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onMarket: () => void;
  onSwap: () => void;
}

export function Header({ isDark, onToggleTheme, onMarket, onSwap }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#35333f] bg-[#27262c] text-[#e9e4f5]">
      <nav aria-label="Primary" className="flex h-16 items-center justify-between gap-2 px-3 sm:px-6">
        <span className="flex items-center">
          <img
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-[25%]"
          />
          <span className="sr-only">SabiSwap</span>
        </span>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            data-testid="button-theme-toggle"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl bg-[#18171c] text-[#a78bfa] shadow-[0_2px_0_#35333f] transition hover:bg-[#222029] hover:text-[#c4b5fd] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa] focus-visible:ring-offset-2 focus-visible:ring-offset-[#27262c]"
          >
            {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
          </button>
          <button
            type="button"
            data-testid="button-market"
            onClick={onMarket}
            className="flex h-10 sm:h-11 items-center gap-2 rounded-2xl bg-[#372f4d] px-3 sm:px-4 text-sm sm:text-base font-semibold text-[#c9bdf0] shadow-[0_2px_0_#2d2640] transition hover:bg-[#443a5e] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa] focus-visible:ring-offset-2 focus-visible:ring-offset-[#27262c]"
          >
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            Market
          </button>
          <button
            type="button"
            data-testid="button-swap"
            onClick={onSwap}
            className="flex h-10 sm:h-11 items-center gap-2 rounded-full bg-[#2bff7a] px-4 sm:px-6 text-sm sm:text-base font-bold text-[#0f1f16] shadow-[0_3px_0_#16a84e] transition hover:bg-[#5cffa0] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2bff7a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#27262c]"
          >
            <ArrowLeftRight className="h-4 w-4 hidden min-[380px]:block" aria-hidden="true" />
            Swap
          </button>
        </div>
      </nav>
    </header>
  );
}
