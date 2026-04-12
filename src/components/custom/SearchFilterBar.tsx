import { Search, Leaf, IceCream, Box, Sandwich, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { stores } from '@/data/stores';
import type { StoreId } from '@/data/stores';
import { DEFAULT_BROWSE_FILTERS, type FilterState, type ServingType } from '@/lib/flavor-browser';

export type { FilterState, ServingType } from '@/lib/flavor-browser';

interface SearchFilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const servingOptions: Array<{
  value: ServingType;
  label: string;
  icon: typeof IceCream;
}> = [
  { value: 'scoop', label: 'Scoop', icon: IceCream },
  { value: 'pint', label: 'Pint', icon: Box },
  { value: 'sandwich', label: 'Sandwich', icon: Sandwich },
];

const locationOptions: Array<{
  value: StoreId | 'all';
  label: string;
}> = [
  { value: 'all', label: 'All locations' },
  ...stores.map((store) => ({ value: store.id, label: store.shortName })),
];

const controlPanelClass = 'rounded-2xl border border-border/70 bg-background/70 p-3 shadow-xs sm:p-4';
const sectionLabelClass = 'text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground';

export function SearchFilterBar({ filters, onFiltersChange }: SearchFilterBarProps) {
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange(DEFAULT_BROWSE_FILTERS);
  };

  const hasChanges =
    filters.searchQuery !== DEFAULT_BROWSE_FILTERS.searchQuery ||
    filters.location !== DEFAULT_BROWSE_FILTERS.location ||
    filters.servingType !== DEFAULT_BROWSE_FILTERS.servingType ||
    filters.veganOnly !== DEFAULT_BROWSE_FILTERS.veganOnly;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={filters.searchQuery}
          onChange={(event) => updateFilter('searchQuery', event.target.value)}
          placeholder="Search vanilla, strawberry, mango…"
          data-testid="hero-search-input"
          className="h-12 rounded-2xl border-border/70 bg-background/90 pl-12 text-base shadow-xs placeholder:text-muted-foreground/80 focus-visible:ring-primary/20 sm:h-14 sm:text-lg"
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="space-y-3">
          <div data-testid="serving-filter" className={controlPanelClass}>
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between">
              <Label className={sectionLabelClass}>Serving type</Label>
              <p className="text-sm text-muted-foreground">Choose how you want to browse the menu.</p>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {servingOptions.map(({ value, label, icon: Icon }) => {
                const isSelected = filters.servingType === value;

                return (
                  <Button
                    key={value}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    aria-pressed={isSelected}
                    onClick={() => updateFilter('servingType', value)}
                    className={cn(
                      'h-11 rounded-xl px-3 text-sm shadow-none',
                      isSelected
                        ? 'border-primary/80 shadow-xs'
                        : 'border-border/70 bg-background/80 text-muted-foreground hover:border-border hover:bg-background hover:text-foreground',
                    )}
                  >
                    <Icon className="size-4 sm:mr-1.5" />
                    <span className="truncate">{label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div data-testid="location-filter" className={controlPanelClass}>
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between">
              <Label className={sectionLabelClass}>Location</Label>
              <p className="text-sm text-muted-foreground">Keep every neighbourhood visible or zoom into one shop.</p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {locationOptions.map(({ value, label }) => {
                const isSelected = filters.location === value;

                return (
                  <Button
                    key={value}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    aria-pressed={isSelected}
                    onClick={() => updateFilter('location', value)}
                    className={cn(
                      'h-11 rounded-xl px-3 text-sm shadow-none',
                      isSelected
                        ? 'border-primary/80 shadow-xs'
                        : 'border-border/70 bg-background/80 text-muted-foreground hover:border-border hover:bg-background hover:text-foreground',
                    )}
                  >
                    <span className="truncate">{label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl border border-emerald-300/70 bg-emerald-100/80 p-4 shadow-xs dark:border-emerald-700/70 dark:bg-emerald-950/40">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-background/80 p-2 text-emerald-700 shadow-xs dark:bg-emerald-900/70 dark:text-emerald-200">
                <Leaf className="size-4" />
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <Label htmlFor="vegan-only" className="text-sm font-semibold text-foreground">
                    Vegan only
                  </Label>
                  <p className="text-sm text-emerald-900/80 dark:text-emerald-100/80">
                    Surface the dairy-free options first.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-800/75 dark:text-emerald-100/70">
                    Filter
                  </span>
                  <Switch
                    id="vegan-only"
                    checked={filters.veganOnly}
                    onCheckedChange={(checked) => updateFilter('veganOnly', checked)}
                    data-testid="vegan-toggle"
                    className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-emerald-200 dark:data-[state=checked]:bg-emerald-500 dark:data-[state=unchecked]:bg-emerald-900"
                  />
                </div>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            disabled={!hasChanges}
            data-testid="clear-filters"
            className="h-auto min-h-[5.25rem] items-start justify-start gap-3 rounded-2xl border-border/70 bg-background/80 px-4 py-4 text-left shadow-xs hover:bg-background disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-55"
          >
            <span className="rounded-full bg-muted p-2 text-muted-foreground">
              <RotateCcw className="size-4" />
            </span>

            <span className="space-y-1">
              <span className="block text-sm font-semibold text-foreground">Clear filters</span>
              <span className="block text-sm font-normal text-muted-foreground">
                Reset the browser to the default scoop view.
              </span>
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
