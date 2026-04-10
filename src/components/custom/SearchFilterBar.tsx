import { Search, X, Leaf, IceCream, Box, Sandwich } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { stores } from '@/data/stores';
import type { StoreId } from '@/data/stores';

export type ServingType = 'scoop' | 'pint' | 'sandwich';

export interface FilterState {
  searchQuery: string;
  location: StoreId | 'all';
  servingType: ServingType;
  veganOnly: boolean;
}

interface SearchFilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function SearchFilterBar({ filters, onFiltersChange }: SearchFilterBarProps) {
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchQuery: '',
      location: 'all',
      servingType: 'scoop',
      veganOnly: false,
    });
  };

  const hasActiveFilters = filters.location !== 'all' || filters.servingType !== 'scoop' || filters.veganOnly;
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
  const segmentedButtonClass = 'h-9 rounded-lg px-2 text-xs sm:text-sm';
  const filterLabelClass = 'w-24 shrink-0 text-sm font-medium text-muted-foreground';

  return (
    <div className="bg-background/80 backdrop-blur-lg border border-border rounded-2xl p-4 space-y-3">
      {/* Search and Vegan Toggle Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search flavors..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            className="pl-10 pr-10 rounded-xl border-border bg-card focus:ring-2 focus:ring-primary/20"
          />
          {filters.searchQuery && (
            <button
              onClick={() => updateFilter('searchQuery', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Vegan Toggle */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-100 dark:border-emerald-700/70">
          <Leaf className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
          <div className="flex items-center gap-2">
            <Switch
              id="vegan-only"
              checked={filters.veganOnly}
              onCheckedChange={(checked) => updateFilter('veganOnly', checked)}
              className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-emerald-200 dark:data-[state=checked]:bg-emerald-500 dark:data-[state=unchecked]:bg-emerald-900"
            />
            <Label htmlFor="vegan-only" className="text-sm font-medium cursor-pointer">
              Vegan only
            </Label>
          </div>
        </div>
      </div>

      {/* Serving Type Filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Label className={filterLabelClass}>
          Serving type
        </Label>
        <div className="grid flex-1 grid-cols-3 gap-2 rounded-xl bg-muted p-1">
          {servingOptions.map(({ value, label, icon: Icon }) => {
            const isSelected = filters.servingType === value;

            return (
              <Button
                key={value}
                type="button"
                variant={isSelected ? 'default' : 'ghost'}
                aria-pressed={isSelected}
                onClick={() => updateFilter('servingType', value)}
                className={segmentedButtonClass}
              >
                <Icon className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Location Filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Label className={filterLabelClass}>
          Location
        </Label>
        <div className="grid flex-1 grid-cols-2 gap-2 rounded-xl bg-muted p-1 sm:grid-cols-5">
          {locationOptions.map(({ value, label }) => {
            const isSelected = filters.location === value;

            return (
              <Button
                key={value}
                type="button"
                variant={isSelected ? 'default' : 'ghost'}
                aria-pressed={isSelected}
                onClick={() => updateFilter('location', value)}
                className={segmentedButtonClass}
              >
                {label}
              </Button>
            );
          })}
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 rounded-xl text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
