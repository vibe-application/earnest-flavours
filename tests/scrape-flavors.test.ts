import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const {
  buildFlavorData,
  extractFlavorNamesFromLinks,
  extractFlavorNamesFromTabDocument,
  isFlavorLinkText,
  slugify,
  validateStoreData,
} = await import(pathToFileURL(path.join(process.cwd(), 'scripts/scrape-flavors.js')).href);

type FakeLink = {
  textContent: string;
  offsetWidth?: number;
  offsetHeight?: number;
  getClientRects?: () => unknown[];
};

type FakePanel = {
  querySelectorAll: (selector: string) => FakeLink[];
};

const makeLink = (textContent: string, visible = true): FakeLink => ({
  textContent,
  offsetWidth: visible ? 10 : 0,
  offsetHeight: visible ? 10 : 0,
  getClientRects: () => (visible ? [{}] : []),
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

test('extractFlavorNamesFromLinks normalizes, filters, and deduplicates links', () => {
  const names = extractFlavorNamesFromLinks([
    makeLink('  Whiskey   Hazelnut  '),
    makeLink('Whiskey Hazelnut'),
    makeLink('Flavours'),
    makeLink('Classic Sammie'),
  ]);

  assert.deepEqual(names, ['Whiskey Hazelnut', 'Classic Sammie']);
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
  });

  const cookiesAndCream = flavors.find((flavor: { id: string }) => flavor.id === 'cookies-cream');
  const classicSammie = flavors.find((flavor: { id: string }) => flavor.id === 'classic-sammie');

  assert.deepEqual(cookiesAndCream?.scoopStores, ['fraser']);
  assert.deepEqual(cookiesAndCream?.pintStores, ['quebec']);
  assert.deepEqual(classicSammie?.scoopStores, []);
  assert.deepEqual(classicSammie?.pintStores, []);
  assert.deepEqual(classicSammie?.sandwichStores, ['fraser', 'frances']);
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
