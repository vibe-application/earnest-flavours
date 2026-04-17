import { Search, Leaf, IceCream, Cylinder, Sandwich, RotateCcw } from 'lucide-react';
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
  { value: 'pint', label: 'Pint', icon: Cylinder },
  { value: 'sandwich', label: 'Sandwich', icon: Sandwich },
];

const locationOptions: Array<{
  value: StoreId | 'all';
  label: string;
}> = [
  { value: 'all', label: 'All locations' },
  ...stores.map((store) => ({ value: store.id, label: store.shortName })),
];

const controlPanelClass = 'glass-pane rounded-xl p-2.5 shadow-xs sm:rounded-2xl sm:p-4';
const sectionLabelClass = 'text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-[11px] sm:tracking-[0.24em]';

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
    <div className="space-y-3 sm:space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={filters.searchQuery}
          onChange={(event) => updateFilter('searchQuery', event.target.value)}
          placeholder="Search vanilla, strawberry, mango…"
          data-testid="hero-search-input"
          className="h-11 rounded-xl border-border/70 bg-background/90 pl-12 text-sm shadow-xs placeholder:text-muted-foreground/80 focus-visible:ring-primary/20 sm:h-14 sm:rounded-2xl sm:text-lg"
        />
      </div>

      <div className="grid gap-2.5 sm:gap-3 xl:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="space-y-2.5 sm:space-y-3">
          <div data-testid="serving-filter" className={controlPanelClass}>
            <div className="flex items-center justify-between gap-2">
              <Label className={sectionLabelClass}>Serving type</Label>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-1.5 sm:mt-3 sm:gap-2">
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
                      'h-9 rounded-lg px-2 text-xs shadow-none sm:h-11 sm:rounded-xl sm:px-3 sm:text-sm',
                      isSelected
                        ? 'border-primary/80 shadow-xs'
                        : 'border-border/70 bg-background/80 text-muted-foreground hover:border-border hover:bg-background hover:text-foreground',
                    )}
                  >
                    <Icon className="size-3.5 sm:mr-1.5 sm:size-4" />
                    <span className="truncate">{label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div data-testid="location-filter" className={controlPanelClass}>
            <div className="flex items-center justify-between gap-2">
              <Label className={sectionLabelClass}>Location</Label>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1.5 sm:mt-3 sm:grid-cols-5 sm:gap-2">
              {locationOptions.map(({ value, label }) => {
                const isSelected = filters.location === value;
                const compactLabel =
                  value === 'all'
                    ? 'All'
                    : label.replace(' Street', '').replace(' St', '').replace('North Vancouver', 'North Van');

                return (
                  <Button
                    key={value}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    aria-pressed={isSelected}
                    onClick={() => updateFilter('location', value)}
                    className={cn(
                      'h-9 rounded-lg px-2 text-[11px] shadow-none sm:h-11 sm:rounded-xl sm:px-3 sm:text-sm',
                      isSelected
                        ? 'border-primary/80 shadow-xs'
                        : 'border-border/70 bg-background/80 text-muted-foreground hover:border-border hover:bg-background hover:text-foreground',
                    )}
                  >
                    <span className="truncate sm:hidden">{compactLabel}</span>
                    <span className="hidden truncate sm:inline">{label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-1">
          <div className="h-11 sm:h-14 rounded-xl border border-emerald-300/70 bg-emerald-100/80 p-2.5 shadow-xs dark:border-emerald-700/70 dark:bg-emerald-950/40 sm:rounded-2xl sm:p-3.5">
            <div className="flex items-center justify-between gap-2.5 sm:gap-3">
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                <div className="rounded-full bg-background/80 p-1.5 text-emerald-700 shadow-xs dark:bg-emerald-900/70 dark:text-emerald-200">
                  <Leaf className="size-3.5 sm:size-4" />
                </div>

                <div className="min-w-0">
                  <Label htmlFor="vegan-only" className="text-sm font-semibold leading-none text-foreground sm:text-[15px]">
                    Vegan only
                  </Label>
                </div>
              </div>

              <Switch
                id="vegan-only"
                checked={filters.veganOnly}
                onCheckedChange={(checked) => updateFilter('veganOnly', checked)}
                data-testid="vegan-toggle"
                className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-emerald-200 dark:data-[state=checked]:bg-emerald-500 dark:data-[state=unchecked]:bg-emerald-900"
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            disabled={!hasChanges}
            data-testid="clear-filters"
            className="min-w-0 h-11 sm:h-14 items-center justify-start gap-2 rounded-xl border-border/70 bg-background/80 px-3 text-left shadow-xs hover:bg-background disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-55 sm:rounded-2xl sm:px-3"
          >
            <span className="shrink-0 rounded-full bg-muted p-1 text-muted-foreground">
              <RotateCcw className="size-4" />
            </span>

            <span className="min-w-0">
              <span className="block whitespace-normal text-sm font-semibold leading-5 text-foreground sm:text-[15px]">
                Clear filters
              </span>
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
