import test from 'node:test';
import assert from 'node:assert/strict';

import type { EarnestRuntimeOverride } from '../src/data/runtime-data.js';
import {
  getRuntimeFlavors,
  getRuntimeMetadata,
  getRuntimeNow,
} from '../src/data/runtime-data.js';

const runtimeGlobal = globalThis as typeof globalThis & {
  __ERNEST_TEST_DATA__?: EarnestRuntimeOverride;
};

test('runtime data falls back to the bundled scrape outputs', () => {
  const flavors = getRuntimeFlavors();
  const metadata = getRuntimeMetadata();

  assert.equal(flavors.length > 0, true);
  assert.equal(typeof metadata.lastUpdatedAt, 'string');
});

test('runtime data prefers injected override data when present', () => {
  runtimeGlobal.__ERNEST_TEST_DATA__ = {
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
    assert.equal(getRuntimeNow(), '2026-04-12T18:00:00.000Z');
  } finally {
    delete runtimeGlobal.__ERNEST_TEST_DATA__;
  }
});
