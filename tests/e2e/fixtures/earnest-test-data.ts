import type { EarnestRuntimeOverride } from '../../../src/data/runtime-data';

export const earnestTestData: EarnestRuntimeOverride = {
  now: '2026-04-12T18:00:00.000Z',
  metadata: {
    lastUpdatedAt: '2026-04-09T19:15:00.000Z',
    source: 'https://earnesticecream.com',
    sourceLastUpdatedByStore: {
      fraser: 'Fixture Fraser update',
      quebec: 'Fixture Quebec update',
      frances: 'Fixture Frances update',
      northvan: 'Fixture North Van update',
    },
    sourceLastUpdatedSignature: 'fixture-fraser|fixture-quebec|fixture-frances|fixture-northvan',
    stores: {
      fraser: 'https://earnesticecream.com/locations/fraser-st/',
      quebec: 'https://earnesticecream.com/locations/quebec-st/',
      frances: 'https://earnesticecream.com/locations/frances-st/',
      northvan: 'https://earnesticecream.com/locations/north-van/',
    },
    counts: {
      totalItems: 6,
      iceCreamFlavors: 4,
      scoopItems: 4,
      pintItems: 3,
      sandwichItems: 2,
      sandwichOnlyItems: 2,
    },
    previousDayBaselineSnapshot: {
      baselineDay: '2026-04-11',
      observedAt: '2026-04-11T17:45:00.000Z',
      flavorNamesByFlavorId: {
        'almond-brittle': 'Almond Brittle',
        'berry-oat-crumble': 'Berry Oat Crumble',
        'caramel-ripple': 'Caramel Ripple',
        'midnight-fudge': 'Midnight Fudge',
        'mochi-mint-sammie': 'Mochi Mint Sammie',
        'salted-honeycomb': 'Salted Honeycomb',
        'toasted-vanilla': 'Toasted Vanilla',
        'vegan-mocha-sammie': 'Vegan Mocha Sammie',
      },
      servingTypes: {
        scoop: {
          'almond-brittle': ['fraser', 'quebec', 'frances', 'northvan'],
          'salted-honeycomb': ['fraser', 'frances'],
          'toasted-vanilla': ['frances', 'northvan'],
        },
        pint: {
          'almond-brittle': ['quebec'],
          'caramel-ripple': ['fraser', 'quebec', 'frances', 'northvan'],
          'midnight-fudge': ['quebec'],
        },
        sandwich: {
          'mochi-mint-sammie': ['frances', 'northvan'],
        },
      },
    },
    previousDayAvailabilityDiff: {
      currentDay: '2026-04-12',
      previousDay: '2026-04-11',
      servingTypes: {
        scoop: {
          added: {
            'berry-oat-crumble': ['quebec', 'northvan'],
          },
          removed: {
            'salted-honeycomb': {
              name: 'Salted Honeycomb',
              storeIds: ['fraser', 'frances'],
            },
          },
        },
        pint: {
          added: {
            'berry-oat-crumble': ['fraser'],
          },
          removed: {
            'midnight-fudge': {
              name: 'Midnight Fudge',
              storeIds: ['quebec'],
            },
          },
        },
        sandwich: {
          added: {
            'vegan-mocha-sammie': ['fraser'],
          },
          removed: {},
        },
      },
    },
  },
  flavors: [
    {
      id: 'almond-brittle',
      name: 'Almond Brittle',
      isVegan: false,
      scoopStores: ['fraser', 'quebec', 'frances', 'northvan'],
      pintStores: ['fraser', 'quebec'],
      sandwichStores: [],
      description: 'Toasted almond brittle folded through vanilla ice cream.',
    },
    {
      id: 'berry-oat-crumble',
      name: 'Berry Oat Crumble',
      isVegan: true,
      scoopStores: ['quebec', 'northvan'],
      pintStores: ['fraser'],
      sandwichStores: [],
      description: 'Jammy berries with oat crumble in a coconut base.',
    },
    {
      id: 'caramel-ripple',
      name: 'Caramel Ripple',
      isVegan: false,
      scoopStores: ['fraser'],
      pintStores: ['fraser', 'quebec', 'frances', 'northvan'],
      sandwichStores: [],
      description: 'Burnt sugar caramel ribboned through cream.',
    },
    {
      id: 'toasted-vanilla',
      name: 'Toasted Vanilla',
      isVegan: false,
      scoopStores: ['frances', 'northvan'],
      pintStores: [],
      sandwichStores: [],
      description: 'Classic vanilla with a toasted marshmallow finish.',
    },
    {
      id: 'mochi-mint-sammie',
      name: 'Mochi Mint Sammie',
      isVegan: false,
      scoopStores: [],
      pintStores: [],
      sandwichStores: ['frances', 'northvan'],
      description: 'Mint ice cream sandwich with chewy mochi cookies.',
    },
    {
      id: 'vegan-mocha-sammie',
      name: 'Vegan Mocha Sammie',
      isVegan: true,
      scoopStores: [],
      pintStores: [],
      sandwichStores: ['fraser'],
      description: 'Mocha coconut ice cream tucked between cocoa wafers.',
    },
  ],
};
