import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const {
  buildFlavorData,
  buildSourceLastUpdatedSignature,
  checkSourceNeedsUpdate,
  collectFlavorUrlsBySlug,
  descriptionFallbacksToSlugMap,
  extractSourceLastUpdatedFromText,
  extractFlavorItemsFromLinks,
  extractFlavorNamesFromLinks,
  extractFlavorNamesFromTabDocument,
  mergeFlavorDescriptionFallbacks,
  scrapeFlavorDescriptions,
  isFlavorLinkText,
  slugify,
  validateStoreData,
} = await import(pathToFileURL(path.join(process.cwd(), 'scripts/scrape-flavors.js')).href);

type FakeLink = {
  textContent: string;
  offsetWidth?: number;
  offsetHeight?: number;
  getClientRects?: () => unknown[];
  getAttribute?: (name: string) => string | null;
  href?: string;
};

type FakePanel = {
  querySelectorAll: (selector: string) => FakeLink[];
};

const makeLink = (textContent: string, visible = true, href?: string): FakeLink => ({
  textContent,
  offsetWidth: visible ? 10 : 0,
  offsetHeight: visible ? 10 : 0,
  getClientRects: () => (visible ? [{}] : []),
  getAttribute: (name: string) => (name === 'href' ? href ?? null : null),
  href,
});

const makePanel = (links: FakeLink[]): FakePanel => ({
  querySelectorAll: (selector: string) => {
    assert.equal(selector, 'a[href*="/flavours/"]');
    return links;
  },
});

test('slugify keeps generated ids stable across punctuation variants', () => {
  assert.equal(slugify('Cookies + Cream'), 'cookies-cream');
  assert.equal(slugify('Cookies & Cream'), 'cookies-cream');
  assert.equal(slugify('Vegan Peaches & Cream'), 'vegan-peaches-cream');
});

test('flavor link filtering removes navigation copy and keeps real flavor names', () => {
  assert.equal(isFlavorLinkText('Whiskey Hazelnut'), true);
  assert.equal(isFlavorLinkText('Flavours'), false);
  assert.equal(isFlavorLinkText('View all flavours'), false);
  assert.equal(isFlavorLinkText('Learn more'), false);
});

test('extractSourceLastUpdatedFromText finds the official source timestamp', () => {
  assert.equal(
    extractSourceLastUpdatedFromText(`
      <section>
        Flavours
        <span>Last updated April 9, 2026</span> at 12pm
      </section>
    `),
    'Last updated April 9, 2026 at 12pm',
  );
  assert.equal(extractSourceLastUpdatedFromText('No update copy here'), '');
});

test('checkSourceNeedsUpdate compares official source timestamps with stored metadata', async () => {
  const sourceLastUpdatedByStore = {
    fraser: 'Last updated April 9, 2026 at 12pm',
    quebec: 'Last updated April 9, 2026 at 12pm',
    frances: 'Last updated April 9, 2026 at 12pm',
    northvan: 'Last updated April 9, 2026 at 12pm',
  };
  const metadataPath = path.join(os.tmpdir(), `ernest-metadata-${Date.now()}.json`);
  fs.writeFileSync(
    metadataPath,
    JSON.stringify({
      sourceLastUpdatedSignature: buildSourceLastUpdatedSignature(sourceLastUpdatedByStore),
    }),
  );

  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    text: async () => '<p>Last updated April 9, 2026 at 12pm</p>',
  });

  try {
    const unchangedResult = await checkSourceNeedsUpdate({ fetchImpl, metadataPath });
    assert.equal(unchangedResult.shouldUpdate, false);

    const changedFetchImpl = async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => '<p>Last updated April 10, 2026 at 12pm</p>',
    });
    const changedResult = await checkSourceNeedsUpdate({ fetchImpl: changedFetchImpl, metadataPath });
    assert.equal(changedResult.shouldUpdate, true);
  } finally {
    fs.rmSync(metadataPath, { force: true });
  }
});

test('extractFlavorNamesFromLinks normalizes, filters, and deduplicates links', () => {
  const names = extractFlavorNamesFromLinks([
    makeLink('  Whiskey   Hazelnut  '),
    makeLink('Whiskey Hazelnut'),
    makeLink('Flavours'),
    makeLink('Classic Sammie'),
  ]);

  assert.deepEqual(names, ['Whiskey Hazelnut', 'Classic Sammie']);
});

test('extractFlavorItemsFromLinks keeps the official flavor URL with each unique flavor', () => {
  const items = extractFlavorItemsFromLinks([
    makeLink('Cookies + Cream', true, '/flavours/cookies-cream/'),
    makeLink('Cookies + Cream', true, '/flavours/cookies-cream/'),
    makeLink('Learn more', true, '/learn-more/'),
  ], { baseUrl: 'https://earnesticecream.com/locations/fraser-st/' });

  assert.deepEqual(items, [
    {
      name: 'Cookies + Cream',
      url: 'https://earnesticecream.com/flavours/cookies-cream/',
    },
  ]);
});

test('extractFlavorNamesFromTabDocument prefers the clicked tab target over other page flavor links', () => {
  const previousDocument = globalThis.document;

  const scoopsPanel = makePanel([
    makeLink('Whiskey Hazelnut'),
    makeLink('Salted Caramel'),
  ]);
  const pintsPanel = makePanel([
    makeLink('London Fog'),
    makeLink('Vegan Chocolate'),
  ]);

  globalThis.document = {
    getElementById: (id: string) => (id === 'scoops-panel' ? scoopsPanel : null),
    querySelectorAll: (selector: string) => {
      if (selector === 'a[href*="/flavours/"]') {
        return [
          makeLink('London Fog'),
          makeLink('Vegan Chocolate'),
          makeLink('Whiskey Hazelnut'),
          makeLink('Salted Caramel'),
          makeLink('Classic Sammie'),
        ];
      }

      if (selector === '.tab-pane.active') {
        return [pintsPanel];
      }

      return [];
    },
  } as unknown as Document;

  try {
    assert.deepEqual(
      extractFlavorNamesFromTabDocument({ targetId: 'scoops-panel' }),
      ['Whiskey Hazelnut', 'Salted Caramel'],
    );
  } finally {
    globalThis.document = previousDocument;
  }
});

test('extractFlavorNamesFromTabDocument falls back to visible links when no tab target exists', () => {
  const previousDocument = globalThis.document;

  globalThis.document = {
    getElementById: () => null,
    querySelectorAll: (selector: string) => {
      if (selector === 'a[href*="/flavours/"]') {
        return [
          makeLink('Hidden Pint', false),
          makeLink('Visible Scoop', true),
          makeLink('Also Visible', true),
        ];
      }

      return [];
    },
  } as unknown as Document;

  try {
    assert.deepEqual(
      extractFlavorNamesFromTabDocument({ targetId: 'missing-panel' }),
      ['Visible Scoop', 'Also Visible'],
    );
  } finally {
    globalThis.document = previousDocument;
  }
});

test('buildFlavorData keeps scoop, pint, and sandwich availability separate', () => {
  const flavors = buildFlavorData({
    fraser: {
      scoops: ['Whiskey Hazelnut', 'Cookies + Cream'],
      pints: ['Whiskey Hazelnut', 'London Fog'],
      sandwiches: ['Classic Sammie'],
    },
    quebec: {
      scoops: ['Whiskey Hazelnut'],
      pints: ['Whiskey Hazelnut', 'Cookies + Cream'],
      sandwiches: [],
    },
    frances: {
      scoops: ['Whiskey Hazelnut'],
      pints: ['Whiskey Hazelnut'],
      sandwiches: ['Classic Sammie'],
    },
    northvan: {
      scoops: ['Whiskey Hazelnut'],
      pints: ['Whiskey Hazelnut'],
      sandwiches: ['Vegan Mocha Brownie Sammie'],
    },
  }, {
    'cookies-cream': 'Official Cookies + Cream description.',
  });

  const cookiesAndCream = flavors.find((flavor: { id: string }) => flavor.id === 'cookies-cream');
  const classicSammie = flavors.find((flavor: { id: string }) => flavor.id === 'classic-sammie');

  assert.deepEqual(cookiesAndCream?.scoopStores, ['fraser']);
  assert.deepEqual(cookiesAndCream?.pintStores, ['quebec']);
  assert.equal(cookiesAndCream?.description, 'Official Cookies + Cream description.');
  assert.deepEqual(classicSammie?.scoopStores, []);
  assert.deepEqual(classicSammie?.pintStores, []);
  assert.deepEqual(classicSammie?.sandwichStores, ['fraser', 'frances']);
});

test('description fallbacks provide descriptions when official extraction misses', () => {
  const fallbackDescriptionsBySlug = descriptionFallbacksToSlugMap([
    {
      id: 'cookies-cream',
      name: 'Cookies + Cream',
      description: 'Saved Cookies + Cream description.',
    },
  ]);
  const flavors = buildFlavorData({
    fraser: {
      scoops: ['Cookies + Cream'],
      pints: [],
      sandwiches: [],
    },
  }, fallbackDescriptionsBySlug);

  assert.equal(flavors[0]?.description, 'Saved Cookies + Cream description.');
});

test('mergeFlavorDescriptionFallbacks updates saved descriptions from a successful scrape', () => {
  const fallbacks = mergeFlavorDescriptionFallbacks(
    [
      {
        id: 'cookies-cream',
        name: 'Cookies + Cream',
        description: 'Saved Cookies + Cream description.',
      },
    ],
    {
      'cookies-cream': 'New official Cookies + Cream description.',
      'whiskey-hazelnut': 'New official Whiskey Hazelnut description.',
    },
    [
      {
        id: 'cookies-cream',
        name: 'Cookies + Cream',
      },
      {
        id: 'whiskey-hazelnut',
        name: 'Whiskey Hazelnut',
      },
    ],
  );

  assert.deepEqual(fallbacks, [
    {
      id: 'cookies-cream',
      name: 'Cookies + Cream',
      description: 'New official Cookies + Cream description.',
    },
    {
      id: 'whiskey-hazelnut',
      name: 'Whiskey Hazelnut',
      description: 'New official Whiskey Hazelnut description.',
    },
  ]);
});

test('collectFlavorUrlsBySlug keeps one official page URL per flavor id', () => {
  const urlsBySlug = collectFlavorUrlsBySlug({
    fraser: {
      scoops: [
        { name: 'Whiskey Hazelnut', url: 'https://earnesticecream.com/flavours/whiskey-hazelnut/' },
      ],
      pints: [
        { name: 'Whiskey Hazelnut', url: 'https://earnesticecream.com/flavours/whiskey-hazelnut/?from=pints' },
      ],
      sandwiches: [],
    },
  });

  assert.equal(urlsBySlug.size, 1);
  assert.equal(urlsBySlug.get('whiskey-hazelnut'), 'https://earnesticecream.com/flavours/whiskey-hazelnut/');
});

test('scrapeFlavorDescriptions skips duplicate flavor ids that already have a description', async () => {
  let visits = 0;
  const page = {
    goto: async () => {
      visits += 1;
    },
    evaluate: async () => 'Official description from the flavor page.',
  };
  const duplicateUrlEntries = {
    entries: () => [
      ['whiskey-hazelnut', 'https://earnesticecream.com/flavours/whiskey-hazelnut/'],
      ['whiskey-hazelnut', 'https://earnesticecream.com/flavours/whiskey-hazelnut/?duplicate=true'],
    ][Symbol.iterator](),
  };

  const descriptions = await scrapeFlavorDescriptions(page, duplicateUrlEntries);

  assert.equal(visits, 1);
  assert.deepEqual(descriptions, {
    'whiskey-hazelnut': 'Official description from the flavor page.',
  });
});

test('validateStoreData rejects empty critical serving categories and duplicate names', () => {
  assert.throws(
    () => validateStoreData({
      fraser: { scoops: [], pints: ['Whiskey Hazelnut'], sandwiches: [] },
    }),
    /no scoops/,
  );

  assert.throws(
    () => validateStoreData({
      fraser: {
        scoops: ['Cookies + Cream', 'Cookies & Cream'],
        pints: ['Whiskey Hazelnut'],
        sandwiches: [],
      },
    }),
    /duplicate scoops/,
  );
});
