import { stores } from '@/data/stores';
import { SearchFilterBar, type FilterState } from '@/components/custom/SearchFilterBar';

interface FlavorFinderHeroProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  resultCount: number;
}

const servingTypeLabels = {
  scoop: 'Scoops',
  pint: 'Pints',
  sandwich: 'Sandwiches',
} as const;

export function FlavorFinderHero({
  filters,
  onFiltersChange,
  resultCount,
}: FlavorFinderHeroProps) {
  const locationLabel =
    filters.location === 'all'
      ? 'All locations'
      : stores.find((store) => store.id === filters.location)?.shortName ?? 'Selected location';

  return (
    <div className="glass-pane relative overflow-hidden rounded-[1.75rem] shadow-soft-lg sm:rounded-[2rem]">
      <div className="pointer-events-none absolute left-4 top-4 h-24 w-[calc(100%-2rem)] max-w-3xl rounded-[1.5rem] bg-gradient-to-r from-secondary/45 via-background/85 to-accent/30 opacity-90 blur-2xl dark:from-secondary/20 dark:via-card/95 dark:to-accent/15 sm:left-8 sm:top-6 sm:h-32 sm:w-[36rem]" />

      <div className="relative space-y-4 px-4 py-5 sm:space-y-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-2 sm:space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/80">
              Flavor finder
            </p>
            <div className="space-y-2">
              <h1 className="max-w-2xl text-2xl text-balance text-foreground sm:text-4xl">
                Search flavors, then narrow the list.
              </h1>
              <p className="hidden max-w-2xl text-sm text-muted-foreground sm:block sm:text-base">
                Filter by serving type, location, or vegan-only flavors.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground" aria-live="polite">
            <span className="inline-flex items-center rounded-full border border-border/70 bg-background/85 px-3 py-1.5 shadow-xs">
              {resultCount} item{resultCount === 1 ? '' : 's'} showing
            </span>
            <span className="inline-flex items-center rounded-full bg-muted/80 px-3 py-1.5 shadow-xs">
              {servingTypeLabels[filters.servingType]}
            </span>
            <span className="inline-flex items-center rounded-full bg-muted/80 px-3 py-1.5 shadow-xs">
              {locationLabel}
            </span>
          </div>
        </div>

        <SearchFilterBar filters={filters} onFiltersChange={onFiltersChange} />
      </div>
    </div>
  );
}
