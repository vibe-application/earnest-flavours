import test from 'node:test';
import assert from 'node:assert/strict';

import {
  flavors,
  getFlavorsByStore,
  getIceCreamFlavors,
  getPintsByStore,
  getSandwiches,
  getSandwichesByStore,
  getScoopsByStore,
  getVeganFlavors,
  hasSandwich,
  searchFlavors,
} from '../src/data/flavors.js';
import metadata from '../src/data/metadata.json' with { type: 'json' };
import type { FlavorMetadata, PreviousDayRemovedAvailabilityDiffEntry } from '../src/data/runtime-data.js';
import { stores } from '../src/data/stores.js';
import type { StoreId } from '../src/data/stores.js';

const validStoreIds = new Set<StoreId>(stores.map((store) => store.id));
const typedMetadata = metadata as FlavorMetadata;

const hasAnyServingType = (flavor: (typeof flavors)[number]): boolean => {
  return (
    flavor.scoopStores.length > 0 ||
    flavor.pintStores.length > 0 ||
    flavor.sandwichStores.length > 0
  );
};

test('all flavors have required fields and at least one serving type', () => {
  assert.ok(flavors.length > 0, 'Expected at least one flavor');

  for (const flavor of flavors) {
    assert.ok(flavor.id, `Flavor is missing id: ${flavor.name}`);
    assert.ok(flavor.name, `Flavor ${flavor.id} is missing name`);
    assert.ok(flavor.description, `Flavor ${flavor.id} is missing description`);
    assert.equal(typeof flavor.isVegan, 'boolean', `${flavor.name} has invalid isVegan`);
    assert.equal(hasAnyServingType(flavor), true, `${flavor.name} has no serving type`);
  }
});

test('all flavor store references use known store ids', () => {
  for (const flavor of flavors) {
    const availabilityByServing = {
      scoop: flavor.scoopStores,
      pint: flavor.pintStores,
      sandwich: flavor.sandwichStores,
    };

    for (const [servingType, storeIds] of Object.entries(availabilityByServing)) {
      for (const storeId of storeIds) {
        assert.equal(
          validStoreIds.has(storeId),
          true,
          `${flavor.name} has invalid ${servingType} store: ${storeId}`,
        );
      }
    }
  }
});

test('scrape metadata has a valid last updated timestamp', () => {
  assert.equal(typeof typedMetadata.lastUpdatedAt, 'string');
  assert.equal(Number.isNaN(Date.parse(typedMetadata.lastUpdatedAt)), false);
  assert.equal(typedMetadata.counts.totalItems, flavors.length);
});

test('scrape metadata previous-day diff, when present, uses serving-type store registries', () => {
  if (!typedMetadata.previousDayAvailabilityDiff) {
    return;
  }

  assert.match(typedMetadata.previousDayAvailabilityDiff.currentDay, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(typedMetadata.previousDayAvailabilityDiff.previousDay, /^\d{4}-\d{2}-\d{2}$/);

  for (const servingType of ['scoop', 'pint', 'sandwich'] as const) {
    const diffEntry: { added: Record<string, string[]>; removed: Record<string, PreviousDayRemovedAvailabilityDiffEntry> } =
      typedMetadata.previousDayAvailabilityDiff.servingTypes[servingType];

    for (const flavorStoreIds of Object.values(diffEntry.added) as string[][]) {
      assert.equal(Array.isArray(flavorStoreIds), true);
      for (const storeId of flavorStoreIds) {
        assert.equal(validStoreIds.has(storeId as StoreId), true, `Invalid ${servingType} diff store: ${storeId}`);
      }
    }

    for (const removedEntry of Object.values(diffEntry.removed) as PreviousDayRemovedAvailabilityDiffEntry[]) {
      assert.equal(typeof removedEntry.name, 'string');
      assert.equal(Array.isArray(removedEntry.storeIds), true);
      for (const storeId of removedEntry.storeIds) {
        assert.equal(validStoreIds.has(storeId as StoreId), true, `Invalid ${servingType} diff store: ${storeId}`);
      }
    }
  }
});

test('scrape metadata previous-day baseline snapshot, when present, keeps one exact-day serving snapshot', () => {
  if (!typedMetadata.previousDayBaselineSnapshot) {
    return;
  }

  assert.match(typedMetadata.previousDayBaselineSnapshot.baselineDay, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(typeof typedMetadata.previousDayBaselineSnapshot.observedAt, 'string');

  for (const servingType of ['scoop', 'pint', 'sandwich'] as const) {
    const snapshotEntry: Record<string, string[]> =
      typedMetadata.previousDayBaselineSnapshot.servingTypes[servingType];

    for (const flavorStoreIds of Object.values(snapshotEntry)) {
      assert.equal(Array.isArray(flavorStoreIds), true);
      for (const storeId of flavorStoreIds) {
        assert.equal(
          validStoreIds.has(storeId as StoreId),
          true,
          `Invalid ${servingType} baseline store: ${storeId}`,
        );
      }
    }
  }
});

test('vegan helper returns exactly the vegan flavors', () => {
  const veganFlavors = getVeganFlavors();
  const expectedVeganIds = flavors.filter((flavor) => flavor.isVegan).map((flavor) => flavor.id);

  assert.deepEqual(
    veganFlavors.map((flavor) => flavor.id),
    expectedVeganIds,
  );
  assert.equal(veganFlavors.every((flavor) => flavor.isVegan), true);
});

test('store helpers return flavors with matching availability', () => {
  for (const store of stores) {
    const storeFlavors = getFlavorsByStore(store.id);
    const scoops = getScoopsByStore(store.id);
    const pints = getPintsByStore(store.id);
    const sandwiches = getSandwichesByStore(store.id);

    assert.equal(
      storeFlavors.every((flavor) =>
        flavor.scoopStores.includes(store.id) ||
        flavor.pintStores.includes(store.id) ||
        flavor.sandwichStores.includes(store.id),
      ),
      true,
      `${store.name} returned a flavor without any availability there`,
    );

    assert.equal(
      scoops.every((flavor) => flavor.scoopStores.includes(store.id)),
      true,
      `${store.name} scoop helper returned a non-scoop flavor`,
    );
    assert.equal(
      pints.every((flavor) => flavor.pintStores.includes(store.id)),
      true,
      `${store.name} pint helper returned a non-pint flavor`,
    );
    assert.equal(
      sandwiches.every((flavor) => flavor.sandwichStores.includes(store.id)),
      true,
      `${store.name} sandwich helper returned a non-sandwich flavor`,
    );

    assert.equal(
      storeFlavors.length,
      flavors.filter((flavor) =>
        flavor.scoopStores.includes(store.id) ||
        flavor.pintStores.includes(store.id) ||
        flavor.sandwichStores.includes(store.id),
      ).length,
      `${store.name} all-availability helper count mismatch`,
    );
  }
});

test('ice cream and sandwich helpers return serving-appropriate flavors', () => {
  const iceCream = getIceCreamFlavors();
  const sandwiches = getSandwiches();

  assert.equal(
    iceCream.every((flavor) => flavor.scoopStores.length > 0 || flavor.pintStores.length > 0),
    true,
  );
  assert.equal(sandwiches.every((flavor) => hasSandwich(flavor)), true);
});

test('current data includes expected sandwich inventory', () => {
  const sandwiches = getSandwiches();
  const expectedSandwiches = flavors.filter((flavor) => flavor.sandwichStores.length > 0);

  assert.equal(sandwiches.length, typedMetadata.counts.sandwichItems);
  assert.equal(
    sandwiches.every((flavor) => flavor.scoopStores.length === 0 && flavor.pintStores.length === 0),
    true,
  );
  assert.deepEqual(
    sandwiches.map((flavor) => flavor.id),
    expectedSandwiches.map((flavor) => flavor.id),
  );
});

test('search helper is case-insensitive and returns empty for missing flavors', () => {
  assert.equal(
    searchFlavors('whiskey').some((flavor) => flavor.name === 'Whiskey Hazelnut'),
    true,
  );
  assert.deepEqual(
    searchFlavors('VEGAN').map((flavor) => flavor.id),
    searchFlavors('vegan').map((flavor) => flavor.id),
  );
  assert.equal(searchFlavors('cookie').length > 0, true);
  assert.deepEqual(searchFlavors('xyz123nonexistent'), []);
});
