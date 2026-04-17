import test from 'node:test';
import assert from 'node:assert/strict';

import type { Flavor } from '../src/data/flavors.js';
import type { FlavorMetadata } from '../src/data/runtime-data.js';
import {
  DEFAULT_BROWSE_FILTERS,
  deriveObjectiveHighlightBuckets,
  formatVancouverDate,
  getBrowseResults,
  getFreshnessLabel,
  hasCurrentPreviousDayAvailabilityDiff,
  isDefaultBrowseState,
  isSameVancouverDay,
  sortFlavorsAlphabetically,
} from '../src/lib/flavor-browser.js';

const allLocationFlavor: Flavor = {
  id: 'all-location-classic',
  name: 'All Location Classic',
  isVegan: false,
  scoopStores: ['fraser', 'quebec', 'frances', 'northvan'],
  pintStores: [],
  sandwichStores: [],
  description: 'Available everywhere as a scoop.',
};

const veganFlavor: Flavor = {
  id: 'vegan-berry',
  name: 'Vegan Berry Swirl',
  isVegan: true,
  scoopStores: ['quebec', 'northvan'],
  pintStores: ['fraser'],
  sandwichStores: [],
  description: 'A vegan sample flavor.',
};

const singleLocationFlavor: Flavor = {
  id: 'single-location-special',
  name: 'Single Location Special',
  isVegan: false,
  scoopStores: ['fraser'],
  pintStores: [],
  sandwichStores: [],
  description: 'Only available at one location.',
};

const alphabeticallyFirstSingleLocationFlavor: Flavor = {
  id: 'alpaca-vanilla',
  name: 'Alpaca Vanilla',
  isVegan: false,
  scoopStores: ['northvan'],
  pintStores: [],
  sandwichStores: [],
  description: 'Another single-location sample.',
};

const hiddenPintFlavor: Flavor = {
  id: 'pint-only-hidden',
  name: 'Pint Only Hidden',
  isVegan: false,
  scoopStores: [],
  pintStores: ['frances'],
  sandwichStores: [],
  description: 'Unavailable as a scoop.',
};

const browseFixtureFlavors: Flavor[] = [
  singleLocationFlavor,
  veganFlavor,
  hiddenPintFlavor,
  allLocationFlavor,
  alphabeticallyFirstSingleLocationFlavor,
];

const metadataFixture: FlavorMetadata = {
  lastUpdatedAt: '2026-04-12T18:00:00.000Z',
  source: 'https://fixtures.example.test',
  sourceLastUpdatedByStore: {
    fraser: 'Fixture Fraser',
    quebec: 'Fixture Quebec',
    frances: 'Fixture Frances',
    northvan: 'Fixture North Van',
  },
  sourceLastUpdatedSignature: 'fixture-signature',
  stores: {
    fraser: 'https://fixtures.example.test/fraser',
    quebec: 'https://fixtures.example.test/quebec',
    frances: 'https://fixtures.example.test/frances',
    northvan: 'https://fixtures.example.test/northvan',
  },
  previousDayBaselineSnapshot: {
    baselineDay: '2026-04-11',
    observedAt: '2026-04-11T18:00:00.000Z',
    flavorNamesByFlavorId: {
      'single-location-special': 'Single Location Special',
      'vegan-berry': 'Vegan Berry Swirl',
      'retired-flavor': 'Retired Flavor',
    },
    servingTypes: {
      scoop: {
        'retired-flavor': ['fraser'],
      },
      pint: {},
      sandwich: {},
    },
  },
  previousDayAvailabilityDiff: {
    currentDay: '2026-04-12',
    previousDay: '2026-04-11',
    servingTypes: {
      scoop: {
        added: {
          'single-location-special': ['fraser'],
          'vegan-berry': ['quebec', 'northvan'],
        },
        removed: {
          'retired-flavor': {
            name: 'Retired Flavor',
            storeIds: ['fraser'],
          },
        },
      },
      pint: {
        added: {
          'pint-only-hidden': ['frances'],
        },
        removed: {},
      },
      sandwich: {
        added: {},
        removed: {},
      },
    },
  },
  counts: {
    totalItems: 5,
    iceCreamFlavors: 5,
    scoopItems: 4,
    pintItems: 2,
    sandwichItems: 0,
    sandwichOnlyItems: 0,
  },
};

test('isDefaultBrowseState matches the shared default browse filters', () => {
  assert.equal(isDefaultBrowseState(DEFAULT_BROWSE_FILTERS), true);
  assert.equal(
    isDefaultBrowseState({
      ...DEFAULT_BROWSE_FILTERS,
      servingType: 'pint',
    }),
    true,
  );
  assert.equal(
    isDefaultBrowseState({
      ...DEFAULT_BROWSE_FILTERS,
      servingType: 'sandwich',
    }),
    true,
  );
  assert.equal(
    isDefaultBrowseState({
      ...DEFAULT_BROWSE_FILTERS,
      veganOnly: true,
    }),
    false,
  );
});

test('isSameVancouverDay uses Vancouver calendar-day semantics', () => {
  assert.equal(
    isSameVancouverDay('2026-04-12T07:10:00.000Z', '2026-04-12T18:00:00.000Z'),
    true,
  );
  assert.equal(
    isSameVancouverDay('2026-04-12T06:50:00.000Z', '2026-04-12T18:00:00.000Z'),
    false,
  );
});

test('getFreshnessLabel uses today for same-day updates and falls back to a Vancouver date', () => {
  assert.equal(
    getFreshnessLabel('2026-04-12T07:10:00.000Z', '2026-04-12T18:00:00.000Z'),
    'Updated today',
  );
  assert.equal(
    getFreshnessLabel('2026-04-10T17:00:00.000Z', '2026-04-12T18:00:00.000Z'),
    `Updated ${formatVancouverDate('2026-04-10T17:00:00.000Z')}`,
  );
});

test('hasCurrentPreviousDayAvailabilityDiff requires both today and the exact previous Vancouver day', () => {
  assert.equal(hasCurrentPreviousDayAvailabilityDiff(metadataFixture, '2026-04-12T18:00:00.000Z'), true);
  assert.equal(
    hasCurrentPreviousDayAvailabilityDiff(
      {
        ...metadataFixture,
        previousDayAvailabilityDiff: {
          ...metadataFixture.previousDayAvailabilityDiff!,
          previousDay: '2026-04-10',
        },
      },
      '2026-04-12T18:00:00.000Z',
    ),
    false,
  );
});

test('sortFlavorsAlphabetically returns a new alphabetical array', () => {
  const input = [singleLocationFlavor, alphabeticallyFirstSingleLocationFlavor, veganFlavor];

  assert.deepEqual(
    sortFlavorsAlphabetically(input).map((flavor) => flavor.name),
    ['Alpaca Vanilla', 'Single Location Special', 'Vegan Berry Swirl'],
  );
  assert.deepEqual(
    input.map((flavor) => flavor.name),
    ['Single Location Special', 'Alpaca Vanilla', 'Vegan Berry Swirl'],
  );
});

test('getBrowseResults keeps the existing filter pipeline and returns alphabetical results', () => {
  assert.deepEqual(
    getBrowseResults(browseFixtureFlavors, {
      ...DEFAULT_BROWSE_FILTERS,
      searchQuery: 'vanilla',
    }).map((flavor) => flavor.name),
    ['Alpaca Vanilla'],
  );

  assert.deepEqual(
    getBrowseResults(browseFixtureFlavors, {
      ...DEFAULT_BROWSE_FILTERS,
      location: 'quebec',
      veganOnly: true,
    }).map((flavor) => flavor.name),
    ['Vegan Berry Swirl'],
  );
});

test('deriveObjectiveHighlightBuckets preserves fixed order, alphabetizes buckets, and omits empties', () => {
  assert.deepEqual(
    deriveObjectiveHighlightBuckets(browseFixtureFlavors, 'scoop').map((bucket) => ({
      id: bucket.id,
      names: bucket.flavors.map((flavor) => flavor.name),
      storeIdsByFlavorId: bucket.storeIdsByFlavorId,
    })),
    [
      {
        id: 'all-locations',
        names: ['All Location Classic'],
        storeIdsByFlavorId: {},
      },
      {
        id: 'vegan',
        names: ['Vegan Berry Swirl'],
        storeIdsByFlavorId: {},
      },
      {
        id: 'single-location',
        names: ['Alpaca Vanilla', 'Single Location Special'],
        storeIdsByFlavorId: {},
      },
    ],
  );

  assert.deepEqual(
    deriveObjectiveHighlightBuckets([hiddenPintFlavor], 'scoop'),
    [],
  );
});

test('deriveObjectiveHighlightBuckets adds a new-today bucket from previous-day availability diff data', () => {
  assert.deepEqual(
    deriveObjectiveHighlightBuckets(
      browseFixtureFlavors,
      'scoop',
      metadataFixture,
      '2026-04-12T18:00:00.000Z',
    ).map((bucket) => ({
      id: bucket.id,
      names: bucket.flavors.map((flavor) => flavor.name),
      storeIdsByFlavorId: bucket.storeIdsByFlavorId,
    })),
    [
      {
        id: 'new-today',
        names: ['Single Location Special', 'Vegan Berry Swirl'],
        storeIdsByFlavorId: {
          'single-location-special': ['fraser'],
          'vegan-berry': ['quebec', 'northvan'],
        },
      },
      {
        id: 'all-locations',
        names: ['All Location Classic'],
        storeIdsByFlavorId: {},
      },
      {
        id: 'vegan',
        names: ['Vegan Berry Swirl'],
        storeIdsByFlavorId: {},
      },
      {
        id: 'single-location',
        names: ['Alpaca Vanilla', 'Single Location Special'],
        storeIdsByFlavorId: {},
      },
    ],
  );
});

test('deriveObjectiveHighlightBuckets omits new-today when diff metadata is missing, stale, or not from exact yesterday', () => {
  assert.deepEqual(
    deriveObjectiveHighlightBuckets(browseFixtureFlavors, 'scoop', undefined, '2026-04-12T18:00:00.000Z').map((bucket) => ({
      id: bucket.id,
      storeIdsByFlavorId: bucket.storeIdsByFlavorId,
    })),
    [
      {
        id: 'all-locations',
        storeIdsByFlavorId: {},
      },
      {
        id: 'vegan',
        storeIdsByFlavorId: {},
      },
      {
        id: 'single-location',
        storeIdsByFlavorId: {},
      },
    ],
  );

  assert.deepEqual(
    deriveObjectiveHighlightBuckets(
      browseFixtureFlavors,
      'scoop',
      {
        ...metadataFixture,
        previousDayAvailabilityDiff: {
          ...metadataFixture.previousDayAvailabilityDiff!,
          currentDay: '2026-04-11',
        },
      },
      '2026-04-12T18:00:00.000Z',
    ).map((bucket) => ({
      id: bucket.id,
      storeIdsByFlavorId: bucket.storeIdsByFlavorId,
    })),
    [
      {
        id: 'all-locations',
        storeIdsByFlavorId: {},
      },
      {
        id: 'vegan',
        storeIdsByFlavorId: {},
      },
      {
        id: 'single-location',
        storeIdsByFlavorId: {},
      },
    ],
  );

  assert.deepEqual(
    deriveObjectiveHighlightBuckets(
      browseFixtureFlavors,
      'scoop',
      {
        ...metadataFixture,
        previousDayAvailabilityDiff: {
          ...metadataFixture.previousDayAvailabilityDiff!,
          previousDay: '2026-04-10',
        },
      },
      '2026-04-12T18:00:00.000Z',
    ).map((bucket) => ({
      id: bucket.id,
      storeIdsByFlavorId: bucket.storeIdsByFlavorId,
    })),
    [
      {
        id: 'all-locations',
        storeIdsByFlavorId: {},
      },
      {
        id: 'vegan',
        storeIdsByFlavorId: {},
      },
      {
        id: 'single-location',
        storeIdsByFlavorId: {},
      },
    ],
  );
});
