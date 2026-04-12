import { useState, useEffect } from 'react';
import { CalendarDays, IceCream, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRuntimeMetadata } from '@/data/runtime-data';

const metadata = getRuntimeMetadata();

interface NavigationProps {
  isDark: boolean;
  toggleTheme: () => void;
}

const lastUpdatedDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'America/Vancouver',
}).format(new Date(metadata.lastUpdatedAt));

export function Navigation({ isDark, toggleTheme }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-lg transition-shadow duration-300 ${
        isScrolled ? 'shadow-soft' : ''
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center gap-2 group"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="rounded-xl bg-primary/10 p-2 transition-colors group-hover:bg-primary/20">
              <IceCream className="w-5 h-5 text-primary" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">
              Earnest Flavors
            </span>
          </a>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-xl hover:bg-muted transition-all duration-300 [&_svg]:size-5"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <div className="relative flex size-5 items-center justify-center">
                <Sun
                  className={`absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 text-amber-500 transition-all duration-300 ${
                    isDark ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'
                  }`}
                />
                <Moon
                  className={`absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 text-lavender transition-all duration-300 ${
                    isDark ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
                  }`}
                />
              </div>
            </Button>
          </div>
        </div>

        <div className="border-t border-border/60 py-2.5">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted-foreground sm:text-xs">
            <span className="inline-flex items-center rounded-full bg-muted/70 px-3 py-1.5 shadow-xs">
              Fan-made, unofficial
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5 shadow-xs">
              <CalendarDays className="size-3.5" />
              <span>Updated {lastUpdatedDate} · Vancouver time</span>
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
