import type { Flavor } from '../data/flavors.js';
import { stores, type StoreId } from '../data/stores.js';
import { flavorMatchesVisualizationFilters, getStoresForServingType } from './flavor-logic.js';

export type ServingType = 'scoop' | 'pint' | 'sandwich';

export interface FilterState {
  searchQuery: string;
  location: StoreId | 'all';
  servingType: ServingType;
  veganOnly: boolean;
}

export type FlavorHighlightBucketId = 'all-locations' | 'vegan' | 'single-location';

export interface FlavorHighlightBucket {
  id: FlavorHighlightBucketId;
  flavors: Flavor[];
}

export const DEFAULT_BROWSE_FILTERS: FilterState = {
  searchQuery: '',
  location: 'all',
  servingType: 'scoop',
  veganOnly: false,
};

const VANCOUVER_TIME_ZONE = 'America/Vancouver';

const vancouverDayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: VANCOUVER_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const vancouverDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: VANCOUVER_TIME_ZONE,
});

const allStoreIds = new Set(stores.map((store) => store.id));

export const isDefaultBrowseState = (filters: FilterState): boolean => {
  return (
    filters.searchQuery === DEFAULT_BROWSE_FILTERS.searchQuery &&
    filters.location === DEFAULT_BROWSE_FILTERS.location &&
    filters.servingType === DEFAULT_BROWSE_FILTERS.servingType &&
    filters.veganOnly === DEFAULT_BROWSE_FILTERS.veganOnly
  );
};

export const getVancouverDayKey = (value: Date | string | number): string => {
  return vancouverDayFormatter.format(new Date(value));
};

export const isSameVancouverDay = (
  left: Date | string | number,
  right: Date | string | number,
): boolean => {
  return getVancouverDayKey(left) === getVancouverDayKey(right);
};

export const formatVancouverDate = (value: Date | string | number): string => {
  return vancouverDateFormatter.format(new Date(value));
};

export const getFreshnessLabel = (
  lastUpdatedAt: Date | string | number,
  now: Date | string | number,
): string => {
  if (isSameVancouverDay(lastUpdatedAt, now)) {
    return 'Updated today';
  }

  return `Updated ${formatVancouverDate(lastUpdatedAt)}`;
};

export const sortFlavorsAlphabetically = (items: readonly Flavor[]): Flavor[] => {
  return [...items].sort((left, right) => left.name.localeCompare(right.name));
};

export const getBrowseResults = (
  items: readonly Flavor[],
  filters: FilterState,
): Flavor[] => {
  return sortFlavorsAlphabetically(
    items.filter((flavor) => flavorMatchesVisualizationFilters(flavor, filters)),
  );
};

export const deriveObjectiveHighlightBuckets = (
  items: readonly Flavor[],
  servingType: ServingType,
): FlavorHighlightBucket[] => {
  const availableItems = items.filter(
    (flavor) => getStoresForServingType(flavor, servingType).length > 0,
  );

  const buckets: FlavorHighlightBucket[] = [
    {
      id: 'all-locations',
      flavors: sortFlavorsAlphabetically(
        availableItems.filter((flavor) => {
          const servingStores = new Set(getStoresForServingType(flavor, servingType));

          return servingStores.size === allStoreIds.size && [...allStoreIds].every((storeId) => servingStores.has(storeId));
        }),
      ),
    },
    {
      id: 'vegan',
      flavors: sortFlavorsAlphabetically(
        availableItems.filter((flavor) => flavor.isVegan),
      ),
    },
    {
      id: 'single-location',
      flavors: sortFlavorsAlphabetically(
        availableItems.filter(
          (flavor) => getStoresForServingType(flavor, servingType).length === 1,
        ),
      ),
    },
  ];

  return buckets.filter((bucket) => bucket.flavors.length > 0);
};
