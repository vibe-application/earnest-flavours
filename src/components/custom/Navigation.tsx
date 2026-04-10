import { useState, useEffect } from 'react';
import { CalendarDays, IceCream, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import metadata from '@/data/metadata.json';

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/80 backdrop-blur-lg shadow-soft'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center gap-2 group"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <IceCream className="w-5 h-5 text-primary" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">
              Earnest Flavors
            </span>
          </a>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <div className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-background/70 px-3 text-xs font-medium text-muted-foreground shadow-xs sm:inline-flex">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Updated {lastUpdatedDate}</span>
            </div>

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
      </div>
    </nav>
  );
}
