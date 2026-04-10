import { Leaf, Store, IceCream, Box, Sandwich } from 'lucide-react';
import type { Flavor } from '@/data/flavors';
import { hasSandwich, isScoopAtAllStores, isPintAtAllStores, isSandwichAtAllStores } from '@/data/flavors';
import type { StoreId } from '@/data/stores';
import { stores } from '@/data/stores';
import { getStoreServingAvailability } from '@/lib/flavor-logic';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface FlavorDetailPanelProps {
  flavor: Flavor | null;
  isOpen: boolean;
  onClose: () => void;
}

const storeColors: Record<StoreId, string> = {
  fraser: 'bg-store-fraser/20 text-store-fraser border-store-fraser/30',
  quebec: 'bg-store-quebec/20 text-store-quebec border-store-quebec/30',
  frances: 'bg-store-frances/20 text-store-frances border-store-frances/30',
  northvan: 'bg-store-northvan/20 text-store-northvan border-store-northvan/30',
};

export function FlavorDetailPanel({
  flavor,
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
  const hasIceCream = hasScoop || hasPint;

  const storeAvailability = getStoreServingAvailability(flavor);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-8">
        <SheetHeader className="pb-6 border-b border-border">
          <div className="flex items-start justify-between">
            <SheetTitle className="text-2xl font-heading font-bold leading-tight">
              {flavor.name}
            </SheetTitle>
          </div>
          
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {/* Scoop Badge */}
            {hasScoop && (
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${scoopAtAll ? 'bg-primary/10' : 'bg-muted'}`}>
                <IceCream className={`w-4 h-4 ${scoopAtAll ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${scoopAtAll ? 'text-primary' : 'text-muted-foreground'}`}>
                  Scoop
                </span>
              </div>
            )}
            
            {/* Pint Badge */}
            {hasPint && (
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${pintAtAll ? 'bg-cereal-cream/30' : 'bg-muted'}`}>
                <Box className={`w-4 h-4 ${pintAtAll ? 'text-amber-700' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${pintAtAll ? 'text-amber-700' : 'text-muted-foreground'}`}>
                  Pint
                </span>
              </div>
            )}
            
            {/* Sandwich Badge */}
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
            
            {scoopAtAll && pintAtAll && sandwichAtAll && (
              <Badge
                variant="outline"
                className="bg-marshmallow-pink/10 text-primary border-primary/30"
              >
                <Store className="w-3 h-3 mr-1" />
                All Locations
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="py-8 space-y-8">
          {/* Description */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              About this {hasIceCream ? 'flavor' : 'sandwich'}
            </h4>
            <p className="text-foreground leading-relaxed">{flavor.description}</p>
          </div>

          {/* Availability */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-4">
              Available at
            </h4>
            <div className="space-y-3">
              {storeAvailability.map(({ storeId, hasScoop, hasPint, hasSandwich }) => {
                const store = stores.find((s) => s.id === storeId);
                if (!store) return null;

                return (
                  <div
                    key={storeId}
                    className={`flex items-center justify-between p-4 rounded-xl border ${storeColors[storeId]}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${store.bgColor}`} />
                      <div>
                        <p className="font-medium">{store.name}</p>
                        <p className="text-xs opacity-80">{store.address}</p>
                      </div>
                    </div>
                    
                    {/* Serving type indicators */}
                    <div className="flex items-center gap-2">
                      {hasScoop && (
                        <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary">
                          Scoop
                        </span>
                      )}
                      {hasPint && (
                        <span className="text-xs px-2 py-1 rounded bg-cereal-cream/50 text-amber-800">
                          Pint
                        </span>
                      )}
                      {hasSandwich && (
                        <span className="text-xs px-2 py-1 rounded bg-chocolate/20 text-chocolate">
                          Sandwich
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div className="p-5 rounded-xl bg-muted/50 text-sm text-muted-foreground">
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
