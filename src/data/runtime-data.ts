import bundledFlavors from './flavors.json' with { type: 'json' };
import bundledMetadata from './metadata.json' with { type: 'json' };
import type { Flavor } from './flavors.js';

export type AvailabilityServingType = 'scoop' | 'pint' | 'sandwich';

export type AvailabilitySnapshotByServingType = Record<AvailabilityServingType, Record<string, string[]>>;

export interface PreviousDayRemovedAvailabilityDiffEntry {
  name: string;
  storeIds: string[];
}

export interface PreviousDayAvailabilityDiffEntry {
  added: Record<string, string[]>;
  removed: Record<string, PreviousDayRemovedAvailabilityDiffEntry>;
}

export interface PreviousDayAvailabilityDiff {
  currentDay: string;
  previousDay: string;
  servingTypes: Record<AvailabilityServingType, PreviousDayAvailabilityDiffEntry>;
}

export interface PreviousDayBaselineSnapshot {
  baselineDay: string;
  observedAt: string;
  flavorNamesByFlavorId: Record<string, string>;
  servingTypes: AvailabilitySnapshotByServingType;
}

export interface FlavorMetadata {
  lastUpdatedAt: string;
  source: string;
  sourceLastUpdatedByStore: Record<string, string>;
  sourceLastUpdatedSignature: string;
  stores: Record<string, string>;
  previousDayBaselineSnapshot?: PreviousDayBaselineSnapshot;
  previousDayAvailabilityDiff?: PreviousDayAvailabilityDiff;
  counts: {
    totalItems: number;
    iceCreamFlavors: number;
    scoopItems: number;
    pintItems: number;
    sandwichItems: number;
    sandwichOnlyItems: number;
  };
}

export interface EarnestRuntimeOverride {
  flavors?: Flavor[];
  metadata?: Partial<FlavorMetadata>;
  now?: string | number;
}

type RuntimeGlobal = typeof globalThis & {
  __ERNEST_TEST_DATA__?: EarnestRuntimeOverride;
  window?: {
    __ERNEST_TEST_DATA__?: EarnestRuntimeOverride;
  };
};

const getRuntimeOverride = (): EarnestRuntimeOverride | undefined => {
  const runtimeGlobal = globalThis as RuntimeGlobal;

  return runtimeGlobal.__ERNEST_TEST_DATA__ ?? runtimeGlobal.window?.__ERNEST_TEST_DATA__;
};

const normalizeRemovedDiffEntries = (
  removedEntries: Record<string, PreviousDayRemovedAvailabilityDiffEntry> | undefined,
): Record<string, PreviousDayRemovedAvailabilityDiffEntry> => {
  return Object.fromEntries(
    Object.entries(removedEntries ?? {}).map(([flavorId, entry]) => [
      flavorId,
      {
        name: entry?.name ?? '',
        storeIds: entry?.storeIds ?? [],
      },
    ]),
  );
};

const normalizeAvailabilitySnapshotByServingType = (
  snapshot: Partial<AvailabilitySnapshotByServingType> | undefined,
): AvailabilitySnapshotByServingType => {
  return {
    scoop: snapshot?.scoop ?? {},
    pint: snapshot?.pint ?? {},
    sandwich: snapshot?.sandwich ?? {},
  };
};

const buildCurrentAvailabilitySnapshot = (flavors: readonly Flavor[]): AvailabilitySnapshotByServingType => {
  return {
    scoop: Object.fromEntries(
      flavors
        .filter((flavor) => flavor.scoopStores.length > 0)
        .map((flavor) => [flavor.id, flavor.scoopStores]),
    ),
    pint: Object.fromEntries(
      flavors
        .filter((flavor) => flavor.pintStores.length > 0)
        .map((flavor) => [flavor.id, flavor.pintStores]),
    ),
    sandwich: Object.fromEntries(
      flavors
        .filter((flavor) => flavor.sandwichStores.length > 0)
        .map((flavor) => [flavor.id, flavor.sandwichStores]),
    ),
  };
};

const migratePreviousDayBaselineSnapshot = (
  previousDayAvailabilityDiff: PreviousDayAvailabilityDiff | undefined,
  flavors: readonly Flavor[],
): PreviousDayBaselineSnapshot | undefined => {
  if (!previousDayAvailabilityDiff) {
    return undefined;
  }

  const currentSnapshot = buildCurrentAvailabilitySnapshot(flavors);
  const flavorNamesByFlavorId = Object.fromEntries(
    flavors
      .filter((flavor) => flavor.name.length > 0)
      .map((flavor) => [flavor.id, flavor.name]),
  );
  const servingTypes = normalizeAvailabilitySnapshotByServingType(undefined);

  for (const servingType of ['scoop', 'pint', 'sandwich'] as const) {
    const diffEntry = previousDayAvailabilityDiff.servingTypes[servingType];
    const flavorIds = new Set([
      ...Object.keys(currentSnapshot[servingType]),
      ...Object.keys(diffEntry?.added ?? {}),
      ...Object.keys(diffEntry?.removed ?? {}),
    ]);

    for (const flavorId of flavorIds) {
      const currentStoreIds = currentSnapshot[servingType][flavorId] ?? [];
      const addedStoreIds = new Set(diffEntry?.added?.[flavorId] ?? []);
      const removedEntry = diffEntry?.removed?.[flavorId];
      const baselineStoreIds = [...new Set([
        ...currentStoreIds.filter((storeId) => !addedStoreIds.has(storeId)),
        ...(removedEntry?.storeIds ?? []),
      ])];

      if (baselineStoreIds.length > 0) {
        servingTypes[servingType][flavorId] = baselineStoreIds;
      }

      if (removedEntry?.name) {
        flavorNamesByFlavorId[flavorId] = removedEntry.name;
      }
    }
  }

  return {
    baselineDay: previousDayAvailabilityDiff.previousDay ?? '',
    observedAt: '',
    flavorNamesByFlavorId,
    servingTypes,
  };
};

const normalizeMetadata = (metadata: Partial<FlavorMetadata>, flavors: readonly Flavor[]): FlavorMetadata => {
  const previousDayAvailabilityDiff = metadata.previousDayAvailabilityDiff;
  const previousDayBaselineSnapshot = metadata.previousDayBaselineSnapshot
    ? {
        baselineDay: metadata.previousDayBaselineSnapshot.baselineDay ?? '',
        observedAt: metadata.previousDayBaselineSnapshot.observedAt ?? '',
        flavorNamesByFlavorId: metadata.previousDayBaselineSnapshot.flavorNamesByFlavorId ?? {},
        servingTypes: normalizeAvailabilitySnapshotByServingType(metadata.previousDayBaselineSnapshot.servingTypes),
      }
    : migratePreviousDayBaselineSnapshot(previousDayAvailabilityDiff, flavors);

  return {
    lastUpdatedAt: metadata.lastUpdatedAt ?? '',
    source: metadata.source ?? '',
    sourceLastUpdatedByStore: metadata.sourceLastUpdatedByStore ?? {},
    sourceLastUpdatedSignature: metadata.sourceLastUpdatedSignature ?? '',
    stores: metadata.stores ?? {},
    previousDayBaselineSnapshot,
    previousDayAvailabilityDiff: previousDayAvailabilityDiff
      ? {
          currentDay: previousDayAvailabilityDiff.currentDay ?? '',
          previousDay: previousDayAvailabilityDiff.previousDay ?? '',
          servingTypes: {
            scoop: {
              added: previousDayAvailabilityDiff.servingTypes?.scoop?.added ?? {},
              removed: normalizeRemovedDiffEntries(previousDayAvailabilityDiff.servingTypes?.scoop?.removed),
            },
            pint: {
              added: previousDayAvailabilityDiff.servingTypes?.pint?.added ?? {},
              removed: normalizeRemovedDiffEntries(previousDayAvailabilityDiff.servingTypes?.pint?.removed),
            },
            sandwich: {
              added: previousDayAvailabilityDiff.servingTypes?.sandwich?.added ?? {},
              removed: normalizeRemovedDiffEntries(previousDayAvailabilityDiff.servingTypes?.sandwich?.removed),
            },
          },
        }
      : undefined,
    counts: {
      totalItems: metadata.counts?.totalItems ?? 0,
      iceCreamFlavors: metadata.counts?.iceCreamFlavors ?? 0,
      scoopItems: metadata.counts?.scoopItems ?? 0,
      pintItems: metadata.counts?.pintItems ?? 0,
      sandwichItems: metadata.counts?.sandwichItems ?? 0,
      sandwichOnlyItems: metadata.counts?.sandwichOnlyItems ?? 0,
    },
  };
};

export const getRuntimeFlavors = (): Flavor[] => {
  return getRuntimeOverride()?.flavors ?? (bundledFlavors as Flavor[]);
};

export const getRuntimeMetadata = (): FlavorMetadata => {
  const runtimeOverride = getRuntimeOverride();
  const flavors = runtimeOverride?.flavors ?? (bundledFlavors as Flavor[]);

  return normalizeMetadata(runtimeOverride?.metadata ?? (bundledMetadata as FlavorMetadata), flavors);
};

export const getRuntimeNow = (): string | number => {
  return getRuntimeOverride()?.now ?? Date.now();
};
