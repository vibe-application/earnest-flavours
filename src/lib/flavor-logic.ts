import type { Flavor } from '../data/flavors.js';
import type { StoreId } from '../data/stores.js';

export type ServingType = 'scoop' | 'pint' | 'sandwich';

export interface FlavorVisualizationFilters {
  searchQuery: string;
  location: StoreId | 'all';
  servingType: ServingType;
  veganOnly: boolean;
}

export interface StoreServingAvailability {
  storeId: StoreId;
  hasScoop: boolean;
  hasPint: boolean;
  hasSandwich: boolean;
}

export const normalizeFlavorSearchText = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const getStoresForServingType = (
  flavor: Flavor,
  servingType: ServingType,
): StoreId[] => {
  if (servingType === 'scoop') {
    return flavor.scoopStores;
  }

  if (servingType === 'pint') {
    return flavor.pintStores;
  }

  return flavor.sandwichStores;
};

export const getStoreServingAvailability = (
  flavor: Flavor,
): StoreServingAvailability[] => {
  const allStoreIds = Array.from(
    new Set([...flavor.scoopStores, ...flavor.pintStores, ...flavor.sandwichStores]),
  );

  return allStoreIds.map((storeId) => ({
    storeId,
    hasScoop: flavor.scoopStores.includes(storeId),
    hasPint: flavor.pintStores.includes(storeId),
    hasSandwich: flavor.sandwichStores.includes(storeId),
  }));
};

export const flavorMatchesVisualizationFilters = (
  flavor: Flavor,
  filters: FlavorVisualizationFilters,
): boolean => {
  const servingStores = getStoresForServingType(flavor, filters.servingType);

  if (servingStores.length === 0) {
    return false;
  }

  if (filters.searchQuery) {
    const normalizedName = normalizeFlavorSearchText(flavor.name);
    const queryTokens = normalizeFlavorSearchText(filters.searchQuery)
      .split(' ')
      .filter(Boolean);

    if (!queryTokens.every((token) => normalizedName.includes(token))) {
      return false;
    }
  }

  if (filters.location !== 'all' && !servingStores.includes(filters.location)) {
    return false;
  }

  if (filters.veganOnly && !flavor.isVegan) {
    return false;
  }

  return true;
};
