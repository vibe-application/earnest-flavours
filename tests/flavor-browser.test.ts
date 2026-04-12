import test from 'node:test';
import assert from 'node:assert/strict';

import type { Flavor } from '../src/data/flavors.js';
import {
  DEFAULT_BROWSE_FILTERS,
  deriveObjectiveHighlightBuckets,
  formatVancouverDate,
  getBrowseResults,
  getFreshnessLabel,
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

test('isDefaultBrowseState matches the shared default browse filters', () => {
  assert.equal(isDefaultBrowseState(DEFAULT_BROWSE_FILTERS), true);
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
    })),
    [
      {
        id: 'all-locations',
        names: ['All Location Classic'],
      },
      {
        id: 'vegan',
        names: ['Vegan Berry Swirl'],
      },
      {
        id: 'single-location',
        names: ['Alpaca Vanilla', 'Single Location Special'],
      },
    ],
  );

  assert.deepEqual(
    deriveObjectiveHighlightBuckets([hiddenPintFlavor], 'scoop'),
    [],
  );
});
