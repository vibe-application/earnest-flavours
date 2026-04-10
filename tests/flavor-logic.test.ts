import test from 'node:test';
import assert from 'node:assert/strict';

import type { Flavor } from '../src/data/flavors.js';
import {
  flavorMatchesVisualizationFilters,
  getStoreServingAvailability,
  getStoresForServingType,
  normalizeFlavorSearchText,
} from '../src/lib/flavor-logic.js';

const northVanScoopOnlyFlavor: Flavor = {
  id: 'sample-vegan-peaches-cream',
  name: 'Vegan Peaches & Cream',
  isVegan: true,
  scoopStores: ['northvan'],
  pintStores: [],
  sandwichStores: [],
  description: 'Sample flavor used to test visualization logic.',
};

const sandwichOnlyFlavor: Flavor = {
  id: 'sample-sammie',
  name: 'Peach Sammie',
  isVegan: false,
  scoopStores: [],
  pintStores: [],
  sandwichStores: ['fraser', 'northvan'],
  description: 'Sample sandwich flavor.',
};

const irishCreamSplitServingFlavor: Flavor = {
  id: 'irish-cream',
  name: 'Irish Cream',
  isVegan: false,
  scoopStores: ['fraser'],
  pintStores: ['fraser', 'quebec', 'frances', 'northvan'],
  sandwichStores: [],
  description: 'Your favourite Irish cream liqueur in frozen form. It\'s creamy, slightly boozy, with a hint of chocolate and coffee.',
};

test('normalizeFlavorSearchText makes punctuation-insensitive search strings', () => {
  assert.equal(normalizeFlavorSearchText('Vegan Peaches & Cream'), 'vegan peaches and cream');
  assert.equal(normalizeFlavorSearchText('  peaches/cream  '), 'peaches cream');
});

test('getStoresForServingType returns only the selected serving availability', () => {
  assert.deepEqual(getStoresForServingType(northVanScoopOnlyFlavor, 'scoop'), ['northvan']);
  assert.deepEqual(getStoresForServingType(northVanScoopOnlyFlavor, 'pint'), []);
  assert.deepEqual(getStoresForServingType(sandwichOnlyFlavor, 'sandwich'), ['fraser', 'northvan']);
});

test('flavorMatchesVisualizationFilters includes a scoop-only North Van flavor in the expected UI state', () => {
  assert.equal(
    flavorMatchesVisualizationFilters(northVanScoopOnlyFlavor, {
      searchQuery: '',
      location: 'northvan',
      servingType: 'scoop',
      veganOnly: false,
    }),
    true,
  );
});

test('flavorMatchesVisualizationFilters excludes flavors for the wrong serving or location', () => {
  assert.equal(
    flavorMatchesVisualizationFilters(northVanScoopOnlyFlavor, {
      searchQuery: '',
      location: 'northvan',
      servingType: 'pint',
      veganOnly: false,
    }),
    false,
  );

  assert.equal(
    flavorMatchesVisualizationFilters(northVanScoopOnlyFlavor, {
      searchQuery: '',
      location: 'fraser',
      servingType: 'scoop',
      veganOnly: false,
    }),
    false,
  );
});

test('flavorMatchesVisualizationFilters matches punctuation-insensitive searches', () => {
  assert.equal(
    flavorMatchesVisualizationFilters(northVanScoopOnlyFlavor, {
      searchQuery: 'vegan peaches cream',
      location: 'all',
      servingType: 'scoop',
      veganOnly: false,
    }),
    true,
  );

  assert.equal(
    flavorMatchesVisualizationFilters(northVanScoopOnlyFlavor, {
      searchQuery: 'peaches & cream',
      location: 'all',
      servingType: 'scoop',
      veganOnly: false,
    }),
    true,
  );
});

test('getStoreServingAvailability returns the correct scoop and pint indicators for split-serving flavors', () => {
  assert.deepEqual(getStoreServingAvailability(irishCreamSplitServingFlavor), [
    {
      storeId: 'fraser',
      hasScoop: true,
      hasPint: true,
      hasSandwich: false,
    },
    {
      storeId: 'quebec',
      hasScoop: false,
      hasPint: true,
      hasSandwich: false,
    },
    {
      storeId: 'frances',
      hasScoop: false,
      hasPint: true,
      hasSandwich: false,
    },
    {
      storeId: 'northvan',
      hasScoop: false,
      hasPint: true,
      hasSandwich: false,
    },
  ]);
});
