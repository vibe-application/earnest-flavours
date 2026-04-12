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
    <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/95 shadow-soft-lg">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-secondary/35 via-background to-accent/20 dark:from-secondary/15 dark:via-card dark:to-accent/10" />

      <div className="relative space-y-6 px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/80">
              Flavor finder
            </p>
            <div className="space-y-2">
              <h1 className="max-w-2xl text-3xl text-balance text-foreground sm:text-4xl">
                Search first, then narrow the city&apos;s menu in one calm pass.
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                Start with a flavor name, then refine by serving style, neighbourhood, or vegan-only options without opening extra panels.
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
