import test from 'node:test';
import assert from 'node:assert/strict';

import type { EarnestRuntimeOverride } from '../src/data/runtime-data.js';
import {
  getRuntimeFlavors,
  getRuntimeMetadata,
  getRuntimeNow,
} from '../src/data/runtime-data.js';

const runtimeGlobal = globalThis as typeof globalThis & {
  __earnest_TEST_DATA__?: EarnestRuntimeOverride;
};

test('runtime data falls back to the bundled scrape outputs', () => {
  const flavors = getRuntimeFlavors();
  const metadata = getRuntimeMetadata();

  assert.equal(flavors.length > 0, true);
  assert.equal(typeof metadata.lastUpdatedAt, 'string');
  if (metadata.previousDayBaselineSnapshot) {
    assert.equal(typeof metadata.previousDayBaselineSnapshot.baselineDay, 'string');
    assert.deepEqual(typeof metadata.previousDayBaselineSnapshot.servingTypes.scoop, 'object');
  }
  if (metadata.previousDayAvailabilityDiff) {
    assert.equal(typeof metadata.previousDayAvailabilityDiff.currentDay, 'string');
    assert.deepEqual(typeof metadata.previousDayAvailabilityDiff.servingTypes.scoop.added, 'object');
    assert.deepEqual(typeof metadata.previousDayAvailabilityDiff.servingTypes.scoop.removed, 'object');
  }
});

test('runtime data prefers injected override data when present', () => {
  runtimeGlobal.__earnest_TEST_DATA__ = {
    flavors: [
      {
        id: 'fixture-flavor',
        name: 'Fixture Flavor',
        isVegan: true,
        scoopStores: ['fraser'],
        pintStores: [],
        sandwichStores: [],
        description: 'Fixture description.',
      },
    ],
    metadata: {
      lastUpdatedAt: '2026-04-09T19:15:00.000Z',
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
          'fixture-flavor': 'Fixture Flavor',
          'removed-flavor': 'Removed Flavor',
        },
        servingTypes: {
          scoop: {
            'removed-flavor': ['quebec'],
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
              'fixture-flavor': ['fraser'],
            },
            removed: {
              'removed-flavor': {
                name: 'Removed Flavor',
                storeIds: ['quebec'],
              },
            },
          },
          pint: {
            added: {},
            removed: {},
          },
          sandwich: {
            added: {},
            removed: {},
          },
        },
      },
      counts: {
        totalItems: 1,
        iceCreamFlavors: 1,
        scoopItems: 1,
        pintItems: 0,
        sandwichItems: 0,
        sandwichOnlyItems: 0,
      },
    },
    now: '2026-04-12T18:00:00.000Z',
  };

  try {
    assert.deepEqual(getRuntimeFlavors().map((flavor) => flavor.id), ['fixture-flavor']);
    assert.equal(getRuntimeMetadata().source, 'https://fixtures.example.test');
    assert.deepEqual(getRuntimeMetadata().previousDayBaselineSnapshot, {
      baselineDay: '2026-04-11',
      observedAt: '2026-04-11T18:00:00.000Z',
      flavorNamesByFlavorId: {
        'fixture-flavor': 'Fixture Flavor',
        'removed-flavor': 'Removed Flavor',
      },
      servingTypes: {
        scoop: {
          'removed-flavor': ['quebec'],
        },
        pint: {},
        sandwich: {},
      },
    });
    assert.deepEqual(
      getRuntimeMetadata().previousDayAvailabilityDiff?.servingTypes.scoop.added['fixture-flavor'],
      ['fraser'],
    );
    assert.deepEqual(
      getRuntimeMetadata().previousDayAvailabilityDiff?.servingTypes.scoop.removed['removed-flavor'],
      {
        name: 'Removed Flavor',
        storeIds: ['quebec'],
      },
    );
    assert.equal(getRuntimeNow(), '2026-04-12T18:00:00.000Z');
  } finally {
    delete runtimeGlobal.__earnest_TEST_DATA__;
  }
});

test('runtime metadata normalizes removed diff entries to name and storeIds defaults', () => {
  runtimeGlobal.__earnest_TEST_DATA__ = {
    metadata: {
      lastUpdatedAt: '2026-04-09T19:15:00.000Z',
      source: 'https://fixtures.example.test',
      sourceLastUpdatedByStore: {},
      sourceLastUpdatedSignature: 'fixture-signature',
      stores: {},
      previousDayAvailabilityDiff: {
        currentDay: '2026-04-12',
        previousDay: '2026-04-11',
        servingTypes: {
          scoop: {
            added: {},
            removed: {
              'removed-flavor': {} as never,
            },
          },
          pint: {
            added: {},
            removed: {},
          },
          sandwich: {
            added: {},
            removed: {},
          },
        },
      },
      counts: {
        totalItems: 0,
        iceCreamFlavors: 0,
        scoopItems: 0,
        pintItems: 0,
        sandwichItems: 0,
        sandwichOnlyItems: 0,
      },
    },
  };

  try {
    assert.deepEqual(
      getRuntimeMetadata().previousDayAvailabilityDiff?.servingTypes.scoop.removed['removed-flavor'],
      {
        name: '',
        storeIds: [],
      },
    );
  } finally {
    delete runtimeGlobal.__earnest_TEST_DATA__;
  }
});

test('runtime metadata migrates a legacy previous-day diff into a baseline snapshot when needed', () => {
  runtimeGlobal.__earnest_TEST_DATA__ = {
    flavors: [
      {
        id: 'fixture-flavor',
        name: 'Fixture Flavor',
        isVegan: false,
        scoopStores: ['fraser'],
        pintStores: [],
        sandwichStores: [],
        description: 'Fixture description.',
      },
    ],
    metadata: {
      lastUpdatedAt: '2026-04-12T18:00:00.000Z',
      source: 'https://fixtures.example.test',
      sourceLastUpdatedByStore: {},
      sourceLastUpdatedSignature: 'fixture-signature',
      stores: {},
      previousDayAvailabilityDiff: {
        currentDay: '2026-04-12',
        previousDay: '2026-04-11',
        servingTypes: {
          scoop: {
            added: {
              'fixture-flavor': ['fraser'],
            },
            removed: {
              'removed-flavor': {
                name: 'Removed Flavor',
                storeIds: ['quebec'],
              },
            },
          },
          pint: {
            added: {},
            removed: {},
          },
          sandwich: {
            added: {},
            removed: {},
          },
        },
      },
      counts: {
        totalItems: 1,
        iceCreamFlavors: 1,
        scoopItems: 1,
        pintItems: 0,
        sandwichItems: 0,
        sandwichOnlyItems: 0,
      },
    },
  };

  try {
    assert.deepEqual(getRuntimeMetadata().previousDayBaselineSnapshot, {
      baselineDay: '2026-04-11',
      observedAt: '',
      flavorNamesByFlavorId: {
        'fixture-flavor': 'Fixture Flavor',
        'removed-flavor': 'Removed Flavor',
      },
      servingTypes: {
        scoop: {
          'removed-flavor': ['quebec'],
        },
        pint: {},
        sandwich: {},
      },
    });
  } finally {
    delete runtimeGlobal.__earnest_TEST_DATA__;
  }
});

test('runtime metadata normalizes missing previous-day data', () => {
  runtimeGlobal.__earnest_TEST_DATA__ = {
    metadata: {
      lastUpdatedAt: '2026-04-09T19:15:00.000Z',
      source: 'https://fixtures.example.test',
      sourceLastUpdatedByStore: {},
      sourceLastUpdatedSignature: 'fixture-signature',
      stores: {},
      counts: {
        totalItems: 0,
        iceCreamFlavors: 0,
        scoopItems: 0,
        pintItems: 0,
        sandwichItems: 0,
        sandwichOnlyItems: 0,
      },
    },
  };

  try {
    assert.equal(getRuntimeMetadata().previousDayBaselineSnapshot, undefined);
    assert.equal(getRuntimeMetadata().previousDayAvailabilityDiff, undefined);
  } finally {
    delete runtimeGlobal.__earnest_TEST_DATA__;
  }
});
