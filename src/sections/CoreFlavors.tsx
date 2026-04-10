import { useState, useMemo } from 'react';
import { IceCream } from 'lucide-react';
import { flavors } from '@/data/flavors';
import type { Flavor } from '@/data/flavors';
import { FlavorCard } from '@/components/custom/FlavorCard';
import { FlavorDetailPanel } from '@/components/custom/FlavorDetailPanel';
import { FlavorDataNotice, SearchFilterBar } from '@/components/custom/SearchFilterBar';
import type { FilterState } from '@/components/custom/SearchFilterBar';
import {
  flavorMatchesVisualizationFilters,
  getStoresForServingType,
} from '@/lib/flavor-logic';
import { motion, AnimatePresence } from 'framer-motion';

export function CoreFlavors() {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    location: 'all',
    servingType: 'scoop',
    veganOnly: false,
  });
  const [selectedFlavor, setSelectedFlavor] = useState<Flavor | null>(null);

  const filteredFlavors = useMemo(() => {
    return [...flavors]
      .filter((flavor) => flavorMatchesVisualizationFilters(flavor, filters))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filters]);

  return (
    <section id="core-flavors" className="py-8 bg-muted/30 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="mb-6 space-y-3">
          <FlavorDataNotice />
          <SearchFilterBar
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredFlavors.length} item{filteredFlavors.length !== 1 ? 's' : ''}
        </div>

        {/* Flavor Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredFlavors.map((flavor) => (
              <motion.div
                key={flavor.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <FlavorCard
                  flavor={flavor}
                  locationStoreIds={getStoresForServingType(flavor, filters.servingType)}
                  onClick={() => setSelectedFlavor(flavor)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty state */}
        {filteredFlavors.length === 0 && (
          <div className="text-center py-16">
            <IceCream className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No flavors found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Flavor Detail Panel */}
      <FlavorDetailPanel
        flavor={selectedFlavor}
        isOpen={!!selectedFlavor}
        onClose={() => setSelectedFlavor(null)}
      />
    </section>
  );
}
