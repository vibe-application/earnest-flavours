import { MapPin, Phone, Clock, ExternalLink } from 'lucide-react';
import type { StoreId } from '@/data/stores';
import { getStoreById } from '@/data/stores';
import { getScoopsByStore, getPintsByStore, getSandwichesByStore } from '@/data/flavors';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { FlavorCard } from './FlavorCard';

interface StoreDetailPanelProps {
  storeId: StoreId | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StoreDetailPanel({
  storeId,
  isOpen,
  onClose,
}: StoreDetailPanelProps) {
  const store = storeId ? getStoreById(storeId) : null;
  
  if (!store) return null;

  const scoopFlavors = getScoopsByStore(storeId!);
  const pintFlavors = getPintsByStore(storeId!);
  const exclusiveScoops = scoopFlavors.filter((f) => f.scoopStores.length < 4);
  const sandwiches = getSandwichesByStore(storeId!);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-8">
        <SheetHeader className="pb-6 border-b border-border">
          <div className={`w-14 h-14 rounded-xl ${store.bgColor} flex items-center justify-center mb-4`}>
            <span className="text-3xl">🍦</span>
          </div>
          <SheetTitle className="text-2xl font-heading font-bold">
            {store.name}
          </SheetTitle>
        </SheetHeader>

        <div className="py-8 space-y-8">
          {/* Store Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-muted">
                <MapPin className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{store.address}</p>
              </div>
            </div>
            
            {store.phone && (
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                </div>
                <p>{store.phone}</p>
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-muted">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <p>{store.hours}</p>
            </div>
          </div>

          {/* Description */}
          <div className="p-5 rounded-xl bg-muted/50">
            <p className="text-sm text-foreground leading-relaxed">{store.description}</p>
          </div>

          {/* Flavor Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-3 rounded-xl bg-primary/10 text-center">
              <p className="text-xl font-bold text-primary">{scoopFlavors.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Scoops</p>
            </div>
            <div className="p-3 rounded-xl bg-cereal-cream/30 text-center">
              <p className="text-xl font-bold text-amber-700">{pintFlavors.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Pints</p>
            </div>
            <div className="p-3 rounded-xl bg-accent/20 text-center">
              <p className="text-xl font-bold text-foreground">{exclusiveScoops.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Exclusive</p>
            </div>
            <div className="p-3 rounded-xl bg-chocolate/10 text-center">
              <p className="text-xl font-bold text-chocolate">{sandwiches.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Sammies</p>
            </div>
          </div>

          {/* Exclusive Scoops */}
          {exclusiveScoops.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-4">
                Exclusive Scoop Flavors
              </h4>
              <div className="space-y-3">
                {exclusiveScoops.map((flavor) => (
                  <FlavorCard
                    key={flavor.id}
                    flavor={flavor}
                    onClick={() => {}}
                    showInfoButton={false}
                    compact
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sandwiches */}
          {sandwiches.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-4">
                Ice Cream Sandwiches
              </h4>
              <div className="space-y-3">
                {sandwiches.map((flavor) => (
                  <FlavorCard
                    key={flavor.id}
                    flavor={flavor}
                    onClick={() => {}}
                    showInfoButton={false}
                    compact
                  />
                ))}
              </div>
            </div>
          )}

          {/* External Link */}
          <Button
            variant="outline"
            className="w-full rounded-xl py-5"
            onClick={() => {
              window.open(
                `https://earnesticecream.com/locations/${store.id}/`,
                '_blank'
              );
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Earnest Website
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
