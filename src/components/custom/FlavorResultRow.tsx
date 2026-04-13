import { ArrowRight, Check, Leaf, Minus } from 'lucide-react';
import type { Flavor } from '@/data/flavors';
import { stores, type StoreId } from '@/data/stores';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getStoresForServingType } from '@/lib/flavor-logic';
import type { ServingType } from '@/lib/flavor-browser';

interface FlavorResultRowProps {
  flavor: Flavor;
  servingType: ServingType;
  onSelect: () => void;
}

const servingTypeLabels: Record<ServingType, string> = {
  scoop: 'Scoop',
  pint: 'Pint',
  sandwich: 'Sandwich',
};

const storeAccentClasses: Record<
  StoreId,
  {
    available: string;
    unavailable: string;
    icon: string;
  }
> = {
  fraser: {
    available: 'border-store-fraser/40 bg-store-fraser/25 text-rose-900 dark:border-store-fraser/35 dark:bg-store-fraser/20 dark:text-rose-100',
    unavailable: 'border-border/60 bg-muted/45 text-muted-foreground',
    icon: 'text-store-fraser',
  },
  quebec: {
    available: 'border-store-quebec/40 bg-store-quebec/25 text-sky-950 dark:border-store-quebec/35 dark:bg-store-quebec/20 dark:text-sky-100',
    unavailable: 'border-border/60 bg-muted/45 text-muted-foreground',
    icon: 'text-store-quebec',
  },
  frances: {
    available: 'border-store-frances/40 bg-store-frances/30 text-amber-950 dark:border-store-frances/35 dark:bg-store-frances/20 dark:text-amber-100',
    unavailable: 'border-border/60 bg-muted/45 text-muted-foreground',
    icon: 'text-store-frances',
  },
  northvan: {
    available: 'border-store-northvan/40 bg-store-northvan/25 text-emerald-950 dark:border-store-northvan/35 dark:bg-store-northvan/20 dark:text-emerald-100',
    unavailable: 'border-border/60 bg-muted/45 text-muted-foreground',
    icon: 'text-store-northvan',
  },
};

export function FlavorResultRow({
  flavor,
  servingType,
  onSelect,
}: FlavorResultRowProps) {
  const availableStoreIds = new Set(getStoresForServingType(flavor, servingType));

  return (
    <article
      data-testid={`flavor-result-${flavor.id}`}
      className="glass-pane rounded-[1.5rem] p-3.5 shadow-soft transition-colors duration-200 hover:border-primary/25 sm:p-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start gap-2">
            <h3 className="min-w-0 text-lg leading-tight text-foreground sm:text-xl">
              {flavor.name}
            </h3>

            {flavor.isVegan ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/70 bg-emerald-100/80 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-700/70 dark:bg-emerald-950/40 dark:text-emerald-100">
                <Leaf className="size-3.5" />
                Vegan
              </span>
            ) : null}
          </div>

          <div
            className="flex flex-wrap gap-1.5"
            aria-label={`${flavor.name} ${servingType} availability by store`}
          >
            {stores.map((store) => {
              const isAvailable = availableStoreIds.has(store.id);
              const accent = storeAccentClasses[store.id];

              return (
                <span
                  key={store.id}
                  data-testid={`availability-${flavor.id}-${store.id}-${servingType}`}
                  aria-label={`${store.name}: ${isAvailable ? servingTypeLabels[servingType].toLowerCase() : `no ${servingTypeLabels[servingType].toLowerCase()}`} availability`}
                  className={cn(
                    'inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium sm:text-sm',
                    isAvailable ? accent.available : accent.unavailable,
                  )}
                >
                  {isAvailable ? (
                    <Check className={cn('size-3.5 shrink-0', accent.icon)} aria-hidden="true" />
                  ) : (
                    <Minus className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  )}
                  <span className="truncate">{store.shortName}</span>
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex lg:shrink-0 lg:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onSelect}
            className="glass-pane rounded-[1.5rem] w-full rounded-xl border-border/70 bg-background/85 px-3 py-2 text-sm font-semibold shadow-xs hover:bg-background sm:w-auto"
          >
            View details
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
