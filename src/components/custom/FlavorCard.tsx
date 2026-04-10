import { Leaf, Info } from 'lucide-react';
import type { Flavor } from '@/data/flavors';
import type { StoreId } from '@/data/stores';
import { stores } from '@/data/stores';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FlavorCardProps {
  flavor: Flavor;
  locationStoreIds?: StoreId[];
  onClick?: () => void;
  showInfoButton?: boolean;
  compact?: boolean;
}

const storeColors: Record<StoreId, string> = {
  fraser: 'bg-store-fraser/20 text-store-fraser',
  quebec: 'bg-store-quebec/20 text-store-quebec',
  frances: 'bg-store-frances/20 text-store-frances',
  northvan: 'bg-store-northvan/20 text-store-northvan',
};

export function FlavorCard({
  flavor,
  locationStoreIds = [],
  onClick,
  showInfoButton = true,
  compact = false,
}: FlavorCardProps) {
  return (
    <TooltipProvider>
      <div
        className={`group relative bg-card rounded-2xl border border-border shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-200 ${
          compact ? 'p-3' : 'p-4'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3
              className={`font-heading font-semibold text-foreground truncate ${
                compact ? 'text-sm' : 'text-base'
              }`}
            >
              {flavor.name}
            </h3>
          </div>
          
          {/* Vegan Badge */}
          {flavor.isVegan && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-1.5 rounded-full bg-mint/20">
                  <Leaf className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Vegan</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Location tags */}
        {!compact && locationStoreIds.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {stores
              .filter((store) => locationStoreIds.includes(store.id))
              .map((store) => (
                <span
                  key={store.id}
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${storeColors[store.id]}`}
                >
                  {store.shortName}
                </span>
              ))}
          </div>
        )}

        {/* Info button */}
        {showInfoButton && onClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            className="mt-3 w-full rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Info className="w-4 h-4 mr-2" />
            Details
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}
