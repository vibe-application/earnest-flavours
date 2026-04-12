import { Leaf, Store, IceCream, Box, Sandwich } from 'lucide-react';
import type { Flavor } from '@/data/flavors';
import { hasSandwich, isScoopAtAllStores, isPintAtAllStores, isSandwichAtAllStores } from '@/data/flavors';
import type { StoreId } from '@/data/stores';
import { stores } from '@/data/stores';
import { getStoreServingAvailability, getStoresForServingType } from '@/lib/flavor-logic';
import type { ServingType } from '@/lib/flavor-browser';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FlavorDetailPanelProps {
  flavor: Flavor | null;
  servingType: ServingType;
  isOpen: boolean;
  onClose: () => void;
}

const servingTypeLabels: Record<ServingType, string> = {
  scoop: 'Scoop',
  pint: 'Pint',
  sandwich: 'Sandwich',
};

const storeColors: Record<StoreId, string> = {
  fraser: 'border-store-fraser/30 bg-store-fraser/10',
  quebec: 'border-store-quebec/30 bg-store-quebec/10',
  frances: 'border-store-frances/30 bg-store-frances/10',
  northvan: 'border-store-northvan/30 bg-store-northvan/10',
};

const storeListFormatter = new Intl.ListFormat('en', {
  style: 'short',
  type: 'conjunction',
});

const getSelectedServingSummary = (flavor: Flavor, servingType: ServingType): string => {
  const selectedStores = stores.filter((store) =>
    getStoresForServingType(flavor, servingType).includes(store.id),
  );
  const servingLabel = servingTypeLabels[servingType];

  if (selectedStores.length === 0) {
    return `${servingLabel} is not currently listed at the four shops.`;
  }

  if (selectedStores.length === stores.length) {
    return `${servingLabel} is currently listed at all four shops.`;
  }

  if (selectedStores.length === 1) {
    return `${servingLabel} is currently listed only at ${selectedStores[0].shortName}.`;
  }

  return `${servingLabel} is currently listed at ${storeListFormatter.format(
    selectedStores.map((store) => store.shortName),
  )}.`;
};

export function FlavorDetailPanel({
  flavor,
  servingType,
  isOpen,
  onClose,
}: FlavorDetailPanelProps) {
  if (!flavor) return null;

  const flavorHasSandwich = hasSandwich(flavor);
  const scoopAtAll = isScoopAtAllStores(flavor);
  const pintAtAll = isPintAtAllStores(flavor);
  const sandwichAtAll = isSandwichAtAllStores(flavor);
  
  const hasScoop = flavor.scoopStores.length > 0;
  const hasPint = flavor.pintStores.length > 0;

  const storeAvailability = getStoreServingAvailability(flavor);
  const selectedServingStores = getStoresForServingType(flavor, servingType);
  const selectedServingStoreIds = new Set(selectedServingStores);
  const selectedServingLabel = servingTypeLabels[servingType];
  const selectedServingAtAllStores = selectedServingStores.length === stores.length;
  const selectedServingSummary = getSelectedServingSummary(flavor, servingType);
  const storeAvailabilityById = new Map(
    storeAvailability.map((availability) => [availability.storeId, availability]),
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <SheetContent
        data-testid="flavor-detail-sheet"
        className="!w-full overflow-y-auto border-l border-border/70 bg-background px-4 py-6 sm:!max-w-lg sm:px-6"
      >
        <SheetHeader className="border-b border-border/70 px-0 pb-6 pt-0">
          <div className="flex items-start justify-between gap-4">
            <SheetTitle className="text-2xl font-heading font-bold leading-tight">
              {flavor.name}
            </SheetTitle>
          </div>
          <SheetDescription className="sr-only">
            Serving details and current store availability for {flavor.name}.
          </SheetDescription>
          
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {hasScoop && (
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${scoopAtAll ? 'bg-primary/10' : 'bg-muted'}`}>
                <IceCream className={`w-4 h-4 ${scoopAtAll ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${scoopAtAll ? 'text-primary' : 'text-muted-foreground'}`}>
                  Scoop
                </span>
              </div>
            )}
            
            {hasPint && (
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${pintAtAll ? 'bg-cereal-cream/30' : 'bg-muted'}`}>
                <Box className={`w-4 h-4 ${pintAtAll ? 'text-amber-700' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${pintAtAll ? 'text-amber-700' : 'text-muted-foreground'}`}>
                  Pint
                </span>
              </div>
            )}
            
            {flavorHasSandwich && (
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${sandwichAtAll ? 'bg-chocolate/10' : 'bg-muted'}`}>
                <Sandwich className={`w-4 h-4 ${sandwichAtAll ? 'text-chocolate' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${sandwichAtAll ? 'text-chocolate' : 'text-muted-foreground'}`}>
                  Sandwich
                </span>
              </div>
            )}

            {flavor.isVegan && (
              <Badge
                variant="outline"
                className="bg-mint/10 text-emerald-700 dark:text-emerald-400 border-emerald-200"
              >
                <Leaf className="w-3 h-3 mr-1" />
                Vegan
              </Badge>
            )}
            
            {selectedServingAtAllStores && (
              <Badge
                variant="outline"
                className="bg-marshmallow-pink/10 text-primary border-primary/30"
              >
                <Store className="w-3 h-3 mr-1" />
                All Locations · {selectedServingLabel}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6 px-0 py-6 sm:space-y-7">
          <div className="rounded-[1.5rem] border border-border/70 bg-card/95 p-5 shadow-soft">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/80">
              Current {selectedServingLabel.toLowerCase()} view
            </p>
            <div className="mt-3 space-y-3">
              <p className="text-base font-medium leading-7 text-foreground sm:text-lg">
                {selectedServingSummary}
              </p>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                {flavor.description}
              </p>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-medium text-muted-foreground">
              Store-by-store availability
            </h4>
            <div className="space-y-3">
              {stores.map((store) => {
                const availability = storeAvailabilityById.get(store.id);
                const hasScoopAtStore = availability?.hasScoop ?? false;
                const hasPintAtStore = availability?.hasPint ?? false;
                const hasSandwichAtStore = availability?.hasSandwich ?? false;
                const hasSelectedServing = selectedServingStoreIds.has(store.id);
                const hasAnyServing = hasScoopAtStore || hasPintAtStore || hasSandwichAtStore;

                return (
                  <div
                    key={store.id}
                    data-testid={`detail-store-${store.id}`}
                    className={cn(
                      'rounded-[1.25rem] border p-4 shadow-xs transition-colors',
                      hasAnyServing ? storeColors[store.id] : 'border-border/70 bg-muted/35',
                    )}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex items-start gap-3">
                        <div className={`mt-1 size-3 shrink-0 rounded-full ${store.bgColor}`} />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{store.name}</p>
                          <p className="text-sm leading-5 text-muted-foreground">{store.address}</p>
                        </div>
                      </div>

                      <span
                        className={cn(
                          'inline-flex self-start rounded-full border px-3 py-1.5 text-xs font-semibold shadow-xs',
                          hasSelectedServing
                            ? 'border-primary/25 bg-primary/10 text-primary'
                            : 'border-border/70 bg-background/85 text-muted-foreground',
                        )}
                      >
                        {hasSelectedServing
                          ? `${selectedServingLabel} available`
                          : `No ${selectedServingLabel.toLowerCase()}`}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {hasScoopAtStore && (
                        <span className="rounded-full bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary">
                          Scoop
                        </span>
                      )}
                      {hasPintAtStore && (
                        <span className="rounded-full bg-cereal-cream/50 px-3 py-1.5 text-xs font-medium text-amber-800">
                          Pint
                        </span>
                      )}
                      {hasSandwichAtStore && (
                        <span className="rounded-full bg-chocolate/20 px-3 py-1.5 text-xs font-medium text-chocolate">
                          Sandwich
                        </span>
                      )}
                      {!hasAnyServing && (
                        <span className="rounded-full border border-border/70 bg-background/85 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                          Not listed currently
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.25rem] bg-muted/50 p-5 text-sm text-muted-foreground">
            <p>
              <strong>Note:</strong> Flavors change throughout the day so we 
              cannot guarantee availability of all flavors listed.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
