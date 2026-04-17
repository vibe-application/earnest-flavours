import { useState, useMemo } from 'react';
import { SearchX } from 'lucide-react';
import { flavors } from '@/data/flavors';
import { getRuntimeMetadata, getRuntimeNow } from '@/data/runtime-data';
import { stores, type StoreId } from '@/data/stores';
import type { Flavor } from '@/data/flavors';
import { Button } from '@/components/ui/button';
import { FlavorResultRow } from '@/components/custom/FlavorResultRow';
import { FlavorBrowseHighlights } from '@/components/custom/FlavorBrowseHighlights';
import { FlavorDetailPanel } from '@/components/custom/FlavorDetailPanel';
import { FlavorFinderHero } from '@/components/custom/FlavorFinderHero';
import {
  DEFAULT_BROWSE_FILTERS,
  deriveObjectiveHighlightBuckets,
  getBrowseResults,
  hasCurrentPreviousDayAvailabilityDiff,
  isDefaultBrowseState,
  type FilterState,
} from '@/lib/flavor-browser';
import { motion, AnimatePresence } from 'framer-motion';

const servingTypeLabels = {
  scoop: 'Scoops',
  pint: 'Pints',
  sandwich: 'Sandwiches',
} as const;

const storeIds = new Set(stores.map((store) => store.id));

export function CoreFlavors() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_BROWSE_FILTERS);
  const [selectedFlavor, setSelectedFlavor] = useState<Flavor | null>(null);
  const runtimeMetadata = useMemo(() => getRuntimeMetadata(), []);
  const runtimeNow = useMemo(() => getRuntimeNow(), []);

  const browseResults = useMemo(() => {
    return getBrowseResults(flavors, filters);
  }, [filters]);

  const highlightBuckets = useMemo(() => {
    return deriveObjectiveHighlightBuckets(
      flavors,
      filters.servingType,
      runtimeMetadata,
      runtimeNow,
    );
  }, [filters.servingType, runtimeMetadata, runtimeNow]);

  const removedSinceYesterday = useMemo<Array<{ id: string; name: string; storeIds: StoreId[] }>>(() => {
    const previousDayAvailabilityDiff = runtimeMetadata.previousDayAvailabilityDiff;

    if (!previousDayAvailabilityDiff || !hasCurrentPreviousDayAvailabilityDiff(runtimeMetadata, runtimeNow)) {
      return [];
    }

    return Object.entries(previousDayAvailabilityDiff.servingTypes[filters.servingType].removed)
      .map(([id, entry]) => ({
        id,
        name: entry.name,
        storeIds: entry.storeIds.filter((storeId): storeId is StoreId => storeIds.has(storeId as StoreId)),
      }))
      .filter((entry) => entry.name.length > 0 && entry.storeIds.length > 0)
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [filters.servingType, runtimeMetadata, runtimeNow]);

  const defaultBrowseState = isDefaultBrowseState(filters);
  const selectedLocation =
    filters.location === 'all'
      ? null
      : stores.find((store) => store.id === filters.location) ?? null;
  const activeFilters = [
    servingTypeLabels[filters.servingType],
    ...(filters.searchQuery.trim() ? [`Search: “${filters.searchQuery.trim()}”`] : []),
    ...(selectedLocation ? [selectedLocation.shortName] : []),
    ...(filters.veganOnly ? ['Vegan only'] : []),
  ];

  const listHeading = defaultBrowseState
    ? `Alphabetical ${servingTypeLabels[filters.servingType].toLowerCase()} list`
    : `Matching ${servingTypeLabels[filters.servingType].toLowerCase()}`;
  const listDescription = defaultBrowseState
    ? 'Every currently listed option for the selected serving type, sorted A–Z.'
    : 'Matching options sorted alphabetically for the current filters.';

  return (
    <section id="core-flavors" className="min-h-screen bg-muted/30 py-4 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <FlavorFinderHero
            filters={filters}
            onFiltersChange={setFilters}
            resultCount={browseResults.length}
          />
        </div>

        <div className="space-y-6 sm:space-y-8">
          {defaultBrowseState ? (
            <FlavorBrowseHighlights
              buckets={highlightBuckets}
              removedSinceYesterday={removedSinceYesterday}
              servingType={filters.servingType}
            />
          ) : (
            <section
              data-testid="browse-results-summary"
              className="glass-pane rounded-[1.75rem] p-5 shadow-soft sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/80">
                    Filtered results
                  </p>
                  <div className="space-y-1">
                    <h2 className="text-2xl text-balance text-foreground sm:text-3xl">
                      {browseResults.length} matching{' '}
                      {servingTypeLabels[filters.servingType].toLowerCase()}
                    </h2>
                    <p className="text-sm text-muted-foreground sm:text-base">
                      Highlights stay hidden while search, location, or vegan filters are active.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center rounded-full border border-border/70 bg-background/85 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {browseResults.length > 0 ? (
            <section data-testid="flavor-result-list" className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    {defaultBrowseState ? 'Full list' : 'Results list'}
                  </p>
                  <h2 className="text-2xl text-balance text-foreground sm:text-3xl">
                    {listHeading}
                  </h2>
                  <p className="text-sm text-muted-foreground sm:text-base">
                    {listDescription}
                  </p>
                </div>

                <span className="inline-flex items-center self-start rounded-full bg-secondary/45 px-3 py-1.5 text-sm font-medium text-foreground shadow-xs">
                  {browseResults.length} item{browseResults.length === 1 ? '' : 's'}
                </span>
              </div>

              <motion.div
                layout
                className="space-y-3"
              >
                <AnimatePresence mode="popLayout">
                  {browseResults.map((flavor) => (
                    <motion.div
                      key={flavor.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FlavorResultRow
                        flavor={flavor}
                        servingType={filters.servingType}
                        onSelect={() => setSelectedFlavor(flavor)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>
          ) : (
            <section
              data-testid="flavor-empty-state"
              className="glass-pane rounded-[1.75rem] border-dashed px-6 py-12 text-center shadow-soft"
            >
              <div className="mx-auto max-w-xl space-y-4">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground shadow-xs">
                  <SearchX className="size-6" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl text-foreground">No flavors match this combination.</h2>
                  <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                    Keep the search and filters visible above, then broaden the query or reset back to
                    the default browse state to see the full alphabetical scoop list again.
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button
                    type="button"
                    onClick={() => setFilters(DEFAULT_BROWSE_FILTERS)}
                    data-testid="empty-state-reset"
                    className="rounded-xl px-5"
                  >
                    Reset to default browse
                  </Button>
                  <span className="inline-flex items-center rounded-full bg-muted/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs">
                    Scoop · All locations · Vegan off
                  </span>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Flavor Detail Panel */}
      <FlavorDetailPanel
        flavor={selectedFlavor}
        servingType={filters.servingType}
        isOpen={!!selectedFlavor}
        onClose={() => setSelectedFlavor(null)}
      />
    </section>
  );
}
