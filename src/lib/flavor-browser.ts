import type { Flavor } from '../data/flavors.js';
import type { FlavorMetadata } from '../data/runtime-data.js';
import { stores, type StoreId } from '../data/stores.js';
import { flavorMatchesVisualizationFilters, getStoresForServingType } from './flavor-logic.js';

export type ServingType = 'scoop' | 'pint' | 'sandwich';

export interface FilterState {
  searchQuery: string;
  location: StoreId | 'all';
  servingType: ServingType;
  veganOnly: boolean;
}

export type FlavorHighlightBucketId = string;

export type FlavorHighlightStoreIdsByFlavorId = Partial<Record<Flavor['id'], StoreId[]>>;

export interface FlavorHighlightBucket {
  id: FlavorHighlightBucketId;
  flavors: Flavor[];
  storeIdsByFlavorId: FlavorHighlightStoreIdsByFlavorId;
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
    filters.veganOnly === DEFAULT_BROWSE_FILTERS.veganOnly
  );
};

export const getVancouverDayKey = (value: Date | string | number): string => {
  return vancouverDayFormatter.format(new Date(value));
};

export const getPreviousVancouverDayKey = (value: Date | string | number): string => {
  const formatterParts = vancouverDayFormatter.formatToParts(new Date(value));
  const year = Number(formatterParts.find((part) => part.type === 'year')?.value);
  const month = Number(formatterParts.find((part) => part.type === 'month')?.value);
  const day = Number(formatterParts.find((part) => part.type === 'day')?.value);

  return getVancouverDayKey(new Date(Date.UTC(year, month - 1, day - 1, 12)));
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

export const hasCurrentPreviousDayAvailabilityDiff = (
  metadata: FlavorMetadata | undefined,
  now: Date | string | number = Date.now(),
): boolean => {
  const diff = metadata?.previousDayAvailabilityDiff;

  if (!diff) {
    return false;
  }

  return diff.currentDay === getVancouverDayKey(now) && diff.previousDay === getPreviousVancouverDayKey(now);
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

const getNewTodayStoreIdsForFlavor = (
  flavor: Flavor,
  servingType: ServingType,
  metadata?: FlavorMetadata,
  now: Date | string | number = Date.now(),
): StoreId[] => {
  if (!metadata || !hasCurrentPreviousDayAvailabilityDiff(metadata, now)) {
    return [];
  }

  const previousDayAvailabilityDiff = metadata.previousDayAvailabilityDiff!;
  const currentlyAvailableStoreIds = new Set(getStoresForServingType(flavor, servingType));
  const addedStoreIds = previousDayAvailabilityDiff.servingTypes[servingType].added[flavor.id] ?? [];

  return addedStoreIds.filter((storeId): storeId is StoreId => currentlyAvailableStoreIds.has(storeId as StoreId));
};

const createEmptyFlavorStoreIds = (): FlavorHighlightStoreIdsByFlavorId => {
  return {};
};

const createStoreIdsByFlavorId = (
  flavors: readonly Flavor[],
  getStoreIds: (flavor: Flavor) => StoreId[],
): FlavorHighlightStoreIdsByFlavorId => {
  const storeIdsByFlavorId: FlavorHighlightStoreIdsByFlavorId = {};

  for (const flavor of flavors) {
    const storeIds = getStoreIds(flavor);

    if (storeIds.length > 0) {
      storeIdsByFlavorId[flavor.id] = storeIds;
    }
  }

  return storeIdsByFlavorId;
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
  metadata?: FlavorMetadata,
  now: Date | string | number = Date.now(),
): FlavorHighlightBucket[] => {
  const availableItems = items.filter(
    (flavor) => getStoresForServingType(flavor, servingType).length > 0,
  );
  const newTodayFlavors = sortFlavorsAlphabetically(
    availableItems.filter(
      (flavor) => getNewTodayStoreIdsForFlavor(flavor, servingType, metadata, now).length > 0,
    ),
  );

  const buckets: FlavorHighlightBucket[] = [
    {
      id: 'new-today',
      flavors: newTodayFlavors,
      storeIdsByFlavorId: createStoreIdsByFlavorId(
        newTodayFlavors,
        (flavor) => getNewTodayStoreIdsForFlavor(flavor, servingType, metadata, now),
      ),
    },
    {
      id: 'all-locations',
      flavors: sortFlavorsAlphabetically(
        availableItems.filter((flavor) => {
          const servingStores = new Set(getStoresForServingType(flavor, servingType));

          return servingStores.size === allStoreIds.size && [...allStoreIds].every((storeId) => servingStores.has(storeId));
        }),
      ),
      storeIdsByFlavorId: createEmptyFlavorStoreIds(),
    },
    {
      id: 'vegan',
      flavors: sortFlavorsAlphabetically(
        availableItems.filter((flavor) => flavor.isVegan),
      ),
      storeIdsByFlavorId: createEmptyFlavorStoreIds(),
    },
    {
      id: 'single-location',
      flavors: sortFlavorsAlphabetically(
        availableItems.filter(
          (flavor) => getStoresForServingType(flavor, servingType).length === 1,
        ),
      ),
      storeIdsByFlavorId: createEmptyFlavorStoreIds(),
    },
  ];

  return buckets.filter((bucket) => bucket.flavors.length > 0);
};
