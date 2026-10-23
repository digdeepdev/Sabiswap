import { useEffect, type ReactNode } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface PageLayoutProps {
  eyebrow: string;
  heading: string;
  intro: ReactNode;
  children: ReactNode;
}

export function PageLayout({ eyebrow, heading, intro, children }: PageLayoutProps) {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('sabiswap-theme', 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background">
      <Header isDark={theme === 'dark'} onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
      <main className="relative flex-1 px-4 py-10 md:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative mx-auto w-full max-w-3xl">
          <p className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-primary-ink">{eyebrow}</p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{heading}</h1>
          <div className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">{intro}</div>
          <div className="mt-10">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export const cardCls = 'rounded-2xl border border-border bg-card p-5 md:p-6';
export const linkCls =
  'font-semibold text-primary-ink underline underline-offset-4 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm';
