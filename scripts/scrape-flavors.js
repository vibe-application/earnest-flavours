#!/usr/bin/env node
/**
 * Scrape Earnest Ice Cream flavor data from their website
 * This script runs daily via GitHub Actions
 * 
 * Scrapes Scoops, Pints, and Sandwiches separately as they can have different availability!
 */

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FLAVORS_OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'flavors.json');
const DESCRIPTION_FALLBACK_OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'flavor-descriptions.json');
const METADATA_OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'metadata.json');
const SOURCE_LAST_UPDATED_PATTERN = /Last\s+updated\s+[A-Z][a-z]+\s+\d{1,2},\s+\d{4}\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)/i;

export const STORE_URLS = {
  fraser: 'https://earnesticecream.com/locations/fraser-st/',
  quebec: 'https://earnesticecream.com/locations/quebec-st/',
  frances: 'https://earnesticecream.com/locations/frances-st/',
  northvan: 'https://earnesticecream.com/locations/north-van/',
};

const VANCOUVER_TIME_ZONE = 'America/Vancouver';
const vancouverDayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: VANCOUVER_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const servingTypes = ['scoop', 'pint', 'sandwich'];
const servingTypeStoreKeys = {
  scoop: 'scoopStores',
  pint: 'pintStores',
  sandwich: 'sandwichStores',
};
const orderedStoreIds = Object.keys(STORE_URLS);
const VANCOUVER_DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const emptyAvailabilitySnapshotByServingType = () => ({
  scoop: {},
  pint: {},
  sandwich: {},
});
const emptyPreviousDayAvailabilityDiff = () => ({
  scoop: { added: {}, removed: {} },
  pint: { added: {}, removed: {} },
  sandwich: { added: {}, removed: {} },
});

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function normalizeFlavorName(name) {
  return name.trim().replace(/\s+/g, ' ');
}

export function extractSourceLastUpdatedFromText(text) {
  const readableText = String(text ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ');
  const normalized = normalizeFlavorName(readableText);
  const match = normalized.match(SOURCE_LAST_UPDATED_PATTERN);

  return match ? normalizeFlavorName(match[0]) : '';
}

export function buildSourceLastUpdatedSignature(sourceLastUpdatedByStore) {
  return Object.entries(sourceLastUpdatedByStore)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([storeId, lastUpdated]) => `${storeId}:${lastUpdated}`)
    .join('|');
}

export function getVancouverDayKey(value) {
  return vancouverDayFormatter.format(new Date(value));
}

export function getPreviousVancouverDayKey(value) {
  const formatterParts = vancouverDayFormatter.formatToParts(new Date(value));
  const year = Number(formatterParts.find((part) => part.type === 'year')?.value);
  const month = Number(formatterParts.find((part) => part.type === 'month')?.value);
  const day = Number(formatterParts.find((part) => part.type === 'day')?.value);

  return getVancouverDayKey(new Date(Date.UTC(year, month - 1, day - 1, 12)));
}

function normalizeVancouverDayKey(value) {
  return typeof value === 'string' && VANCOUVER_DAY_KEY_PATTERN.test(value)
    ? value
    : getVancouverDayKey(value);
}

function sortStoreIds(storeIds) {
  return [...storeIds].sort((left, right) => {
    const leftIndex = orderedStoreIds.indexOf(left);
    const rightIndex = orderedStoreIds.indexOf(right);

    if (leftIndex === -1 || rightIndex === -1) {
      return left.localeCompare(right);
    }

    return leftIndex - rightIndex;
  });
}

function getFlavorStoreIds(flavor, storeKey) {
  return Array.isArray(flavor?.[storeKey]) ? sortStoreIds(flavor[storeKey]) : [];
}

export function buildAvailabilitySnapshotByServingType(flavors) {
  if (!Array.isArray(flavors)) {
    throw new Error('Flavor snapshot must be an array');
  }

  const snapshot = emptyAvailabilitySnapshotByServingType();

  for (const flavor of flavors) {
    if (!isPlainObject(flavor) || typeof flavor.id !== 'string' || flavor.id.length === 0) {
      throw new Error('Flavor snapshot contains an item without a valid id');
    }

    for (const servingType of servingTypes) {
      const storeIds = getFlavorStoreIds(flavor, servingTypeStoreKeys[servingType]);

      if (storeIds.length > 0) {
        snapshot[servingType][flavor.id] = storeIds;
      }
    }
  }

  return snapshot;
}

function buildFlavorNameRegistry(flavors) {
  if (!Array.isArray(flavors)) {
    throw new Error('Flavor snapshot must be an array');
  }

  const namesByFlavorId = {};

  for (const flavor of flavors) {
    if (!isPlainObject(flavor) || typeof flavor.id !== 'string' || flavor.id.length === 0) {
      throw new Error('Flavor snapshot contains an item without a valid id');
    }

    if (typeof flavor.name === 'string' && flavor.name.length > 0) {
      namesByFlavorId[flavor.id] = flavor.name;
    }
  }

  return namesByFlavorId;
}

function diffAvailabilitySnapshotMaps(currentSnapshot, previousSnapshot, previousFlavorNames = {}) {
  const diff = emptyPreviousDayAvailabilityDiff();

  for (const servingType of servingTypes) {
    const flavorIds = new Set([
      ...Object.keys(currentSnapshot[servingType] ?? {}),
      ...Object.keys(previousSnapshot[servingType] ?? {}),
    ]);

    for (const flavorId of flavorIds) {
      const currentStores = currentSnapshot[servingType][flavorId] ?? [];
      const previousStores = previousSnapshot[servingType][flavorId] ?? [];
      const currentStoreSet = new Set(currentStores);
      const previousStoreSet = new Set(previousStores);
      const addedStores = currentStores.filter((storeId) => !previousStoreSet.has(storeId));
      const removedStores = previousStores.filter((storeId) => !currentStoreSet.has(storeId));

      if (addedStores.length > 0) {
        diff[servingType].added[flavorId] = addedStores;
      }

      if (removedStores.length > 0) {
        diff[servingType].removed[flavorId] = {
          name: previousFlavorNames[flavorId] ?? flavorId,
          storeIds: removedStores,
        };
      }
    }
  }

  return diff;
}

export function diffAvailabilitySnapshots(currentFlavors, previousFlavors) {
  const currentSnapshot = buildAvailabilitySnapshotByServingType(currentFlavors);
  const previousSnapshot = buildAvailabilitySnapshotByServingType(previousFlavors);
  const previousFlavorNames = buildFlavorNameRegistry(previousFlavors);
  return diffAvailabilitySnapshotMaps(currentSnapshot, previousSnapshot, previousFlavorNames);
}

export function buildPreviousDayBaselineSnapshot(flavors, {
  baselineDay = new Date().toISOString(),
  observedAt = new Date().toISOString(),
} = {}) {
  return {
    baselineDay: normalizeVancouverDayKey(baselineDay),
    observedAt,
    flavorNamesByFlavorId: buildFlavorNameRegistry(flavors),
    servingTypes: buildAvailabilitySnapshotByServingType(flavors),
  };
}

function normalizePreviousDayBaselineSnapshot(snapshot) {
  if (!isPlainObject(snapshot)) {
    return undefined;
  }

  return {
    baselineDay: typeof snapshot.baselineDay === 'string' ? snapshot.baselineDay : '',
    observedAt: typeof snapshot.observedAt === 'string' ? snapshot.observedAt : '',
    flavorNamesByFlavorId: isPlainObject(snapshot.flavorNamesByFlavorId)
      ? snapshot.flavorNamesByFlavorId
      : {},
    servingTypes: {
      scoop: isPlainObject(snapshot.servingTypes?.scoop) ? snapshot.servingTypes.scoop : {},
      pint: isPlainObject(snapshot.servingTypes?.pint) ? snapshot.servingTypes.pint : {},
      sandwich: isPlainObject(snapshot.servingTypes?.sandwich) ? snapshot.servingTypes.sandwich : {},
    },
  };
}

export function migrateLegacyPreviousDayBaselineSnapshot(currentFlavors, previousDayAvailabilityDiff) {
  if (!isPlainObject(previousDayAvailabilityDiff)) {
    return undefined;
  }

  const currentSnapshot = buildAvailabilitySnapshotByServingType(currentFlavors);
  const currentFlavorNames = buildFlavorNameRegistry(currentFlavors);
  const baselineSnapshot = emptyAvailabilitySnapshotByServingType();

  for (const servingType of servingTypes) {
    const diffEntry = isPlainObject(previousDayAvailabilityDiff.servingTypes?.[servingType])
      ? previousDayAvailabilityDiff.servingTypes[servingType]
      : { added: {}, removed: {} };
    const addedEntries = isPlainObject(diffEntry.added) ? diffEntry.added : {};
    const removedEntries = isPlainObject(diffEntry.removed) ? diffEntry.removed : {};
    const flavorIds = new Set([
      ...Object.keys(currentSnapshot[servingType]),
      ...Object.keys(addedEntries),
      ...Object.keys(removedEntries),
    ]);

    for (const flavorId of flavorIds) {
      const currentStoreIds = currentSnapshot[servingType][flavorId] ?? [];
      const addedStoreIds = new Set(Array.isArray(addedEntries[flavorId]) ? addedEntries[flavorId] : []);
      const removedEntry = isPlainObject(removedEntries[flavorId]) ? removedEntries[flavorId] : {};
      const removedStoreIds = Array.isArray(removedEntry.storeIds) ? removedEntry.storeIds : [];
      const baselineStoreIds = sortStoreIds([
        ...new Set([
          ...currentStoreIds.filter((storeId) => !addedStoreIds.has(storeId)),
          ...removedStoreIds,
        ]),
      ]);

      if (baselineStoreIds.length > 0) {
        baselineSnapshot[servingType][flavorId] = baselineStoreIds;
      }

      if (typeof removedEntry.name === 'string' && removedEntry.name.length > 0) {
        currentFlavorNames[flavorId] = removedEntry.name;
      }
    }
  }

  return {
    baselineDay: typeof previousDayAvailabilityDiff.previousDay === 'string'
      ? previousDayAvailabilityDiff.previousDay
      : '',
    observedAt: '',
    flavorNamesByFlavorId: currentFlavorNames,
    servingTypes: baselineSnapshot,
  };
}

export function resolvePreviousDayBaselineSnapshot({
  observedAt = new Date().toISOString(),
  existingFlavors = [],
  existingMetadata = {},
} = {}) {
  const previousDay = getPreviousVancouverDayKey(observedAt);
  const storedBaselineSnapshot = normalizePreviousDayBaselineSnapshot(existingMetadata.previousDayBaselineSnapshot);

  if (storedBaselineSnapshot?.baselineDay === previousDay) {
    return storedBaselineSnapshot;
  }

  if (
    typeof existingMetadata.lastUpdatedAt === 'string' &&
    existingMetadata.lastUpdatedAt.length > 0 &&
    getVancouverDayKey(existingMetadata.lastUpdatedAt) === previousDay &&
    Array.isArray(existingFlavors)
  ) {
    return buildPreviousDayBaselineSnapshot(existingFlavors, {
      baselineDay: previousDay,
      observedAt: existingMetadata.lastUpdatedAt,
    });
  }

  if (!storedBaselineSnapshot && Array.isArray(existingFlavors)) {
    const migratedSnapshot = migrateLegacyPreviousDayBaselineSnapshot(
      existingFlavors,
      existingMetadata.previousDayAvailabilityDiff,
    );

    if (migratedSnapshot?.baselineDay === previousDay) {
      return {
        ...migratedSnapshot,
        observedAt: typeof existingMetadata.lastUpdatedAt === 'string' ? existingMetadata.lastUpdatedAt : '',
      };
    }
  }

  return undefined;
}

export function buildPreviousDayAvailabilityDiffFromBaseline(currentFlavors, previousDayBaselineSnapshot, {
  observedAt = new Date().toISOString(),
} = {}) {
  const normalizedBaselineSnapshot = normalizePreviousDayBaselineSnapshot(previousDayBaselineSnapshot);
  const currentDay = getVancouverDayKey(observedAt);
  const previousDay = getPreviousVancouverDayKey(observedAt);

  if (!normalizedBaselineSnapshot || normalizedBaselineSnapshot.baselineDay !== previousDay) {
    return undefined;
  }

  return {
    currentDay,
    previousDay,
    servingTypes: diffAvailabilitySnapshotMaps(
      buildAvailabilitySnapshotByServingType(currentFlavors),
      normalizedBaselineSnapshot.servingTypes,
      normalizedBaselineSnapshot.flavorNamesByFlavorId,
    ),
  };
}

function readMetadata(metadataPath = METADATA_OUTPUT_PATH) {
  if (!fs.existsSync(metadataPath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  } catch (error) {
    console.warn(`Could not read existing metadata: ${error.message}`);
    return {};
  }
}

function readFlavorSnapshot(outputPath = FLAVORS_OUTPUT_PATH) {
  if (!fs.existsSync(outputPath)) {
    return [];
  }

  try {
    const flavors = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

    return Array.isArray(flavors) ? flavors : [];
  } catch (error) {
    console.warn(`Could not read existing flavor snapshot: ${error.message}`);
    return [];
  }
}

function getExistingSourceLastUpdatedSignature(metadataPath = METADATA_OUTPUT_PATH) {
  const metadata = readMetadata(metadataPath);

  if (typeof metadata.sourceLastUpdatedSignature === 'string') {
    return metadata.sourceLastUpdatedSignature;
  }

  if (
    metadata.sourceLastUpdatedByStore &&
    typeof metadata.sourceLastUpdatedByStore === 'object'
  ) {
    return buildSourceLastUpdatedSignature(metadata.sourceLastUpdatedByStore);
  }

  if (typeof metadata.sourceLastUpdatedText === 'string') {
    return metadata.sourceLastUpdatedText;
  }

  return '';
}

export async function collectSourceLastUpdatedByStore(fetchImpl = fetch) {
  const sourceLastUpdatedByStore = {};

  for (const [storeId, url] of Object.entries(STORE_URLS)) {
    const response = await fetchImpl(url);

    if (!response.ok) {
      throw new Error(`Could not fetch ${url}: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    sourceLastUpdatedByStore[storeId] = extractSourceLastUpdatedFromText(html);
  }

  return sourceLastUpdatedByStore;
}

export async function checkSourceNeedsUpdate({ fetchImpl = fetch, metadataPath = METADATA_OUTPUT_PATH } = {}) {
  const sourceLastUpdatedByStore = await collectSourceLastUpdatedByStore(fetchImpl);
  const missingStoreIds = Object.entries(sourceLastUpdatedByStore)
    .filter(([, lastUpdated]) => !lastUpdated)
    .map(([storeId]) => storeId);

  if (missingStoreIds.length > 0) {
    throw new Error(`Could not find official last-updated text for: ${missingStoreIds.join(', ')}`);
  }

  const sourceLastUpdatedSignature = buildSourceLastUpdatedSignature(sourceLastUpdatedByStore);
  const existingSourceLastUpdatedSignature = getExistingSourceLastUpdatedSignature(metadataPath);

  return {
    shouldUpdate: sourceLastUpdatedSignature !== existingSourceLastUpdatedSignature,
    sourceLastUpdatedByStore,
    sourceLastUpdatedSignature,
    existingSourceLastUpdatedSignature,
  };
}

export function parseCliOptions(argv = process.argv.slice(2)) {
  return {
    force: argv.includes('--force'),
  };
}

export function isVegan(name) {
  const lower = name.toLowerCase();
  return lower.includes('vegan');
}

export function isFlavorLinkText(text) {
  const normalized = normalizeFlavorName(text ?? '');
  const lower = normalized.toLowerCase();

  return (
    normalized.length > 0 &&
    normalized.length < 50 &&
    !lower.includes('learn') &&
    !lower.includes('read') &&
    !lower.includes('click') &&
    !lower.includes('view') &&
    normalized !== 'Flavours'
  );
}

function getFlavorItemName(item) {
  return typeof item === 'string' ? item : item.name;
}

function getFlavorItemUrl(item) {
  return typeof item === 'string' ? undefined : item.url;
}

function normalizeFlavorUrl(href, baseUrl) {
  if (!href) {
    return undefined;
  }

  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

export function extractFlavorItemsFromLinks(links, { visibleOnly = false, baseUrl } = {}) {
  const itemsByName = new Map();

  for (const link of links) {
    const isVisible = !visibleOnly ||
      Boolean(link.offsetWidth || link.offsetHeight || link.getClientRects?.().length);

    if (!isVisible) {
      continue;
    }

    const text = normalizeFlavorName(link.textContent ?? '');
    if (isFlavorLinkText(text)) {
      const href = link.getAttribute?.('href') ?? link.href;
      itemsByName.set(text, {
        name: text,
        url: normalizeFlavorUrl(href, baseUrl),
      });
    }
  }

  return [...itemsByName.values()];
}

export function extractFlavorNamesFromLinks(links, { visibleOnly = false } = {}) {
  return extractFlavorItemsFromLinks(links, { visibleOnly }).map((item) => item.name);
}

export function extractFlavorItemsFromTabDocument({ targetId } = {}) {
  const normalizeText = (text) => (text ?? '').trim().replace(/\s+/g, ' ');
  const isFlavorText = (text) => {
    const normalized = normalizeText(text);
    const lower = normalized.toLowerCase();

    return (
      normalized.length > 0 &&
      normalized.length < 50 &&
      !lower.includes('learn') &&
      !lower.includes('read') &&
      !lower.includes('click') &&
      !lower.includes('view') &&
      normalized !== 'Flavours'
    );
  };
  const normalizeUrl = (href) => {
    if (!href) {
      return undefined;
    }

    try {
      const baseUrl = typeof window === 'undefined' ? undefined : window.location?.href;
      return new URL(href, baseUrl).href;
    } catch {
      return href;
    }
  };
  const extractItems = (links, { visibleOnly = false } = {}) => {
    const itemsByName = new Map();

    for (const link of links) {
      const isVisible = !visibleOnly ||
        Boolean(link.offsetWidth || link.offsetHeight || link.getClientRects?.().length);

      if (!isVisible) {
        continue;
      }

      const text = normalizeText(link.textContent);
      if (isFlavorText(text)) {
        itemsByName.set(text, {
          name: text,
          url: normalizeUrl(link.getAttribute?.('href') || link.href),
        });
      }
    }

    return [...itemsByName.values()];
  };
  const candidateRoots = [];

  if (targetId) {
    const target = document.getElementById(targetId);
    if (target) {
      candidateRoots.push(target);
    }
  }

  const activePanelSelectors = [
    '.tab-pane.active',
    '.tab-pane.show.active',
    '[role="tabpanel"]:not([hidden])',
    '[aria-hidden="false"]',
  ];

  for (const selector of activePanelSelectors) {
    document.querySelectorAll(selector).forEach((panel) => candidateRoots.push(panel));
  }

  for (const root of candidateRoots) {
    const items = extractItems(root.querySelectorAll('a[href*="/flavours/"]'));
    if (items.length > 0) {
      return items;
    }
  }

  const visibleItems = extractItems(
    document.querySelectorAll('a[href*="/flavours/"]'),
    { visibleOnly: true },
  );

  if (visibleItems.length > 0) {
    return visibleItems;
  }

  return extractItems(document.querySelectorAll('a[href*="/flavours/"]'));
}

export function extractFlavorNamesFromTabDocument({ targetId } = {}) {
  return extractFlavorItemsFromTabDocument({ targetId }).map((item) => item.name);
}

export function createEmptyStoreData() {
  return {
    fraser: { scoops: [], pints: [], sandwiches: [] },
    quebec: { scoops: [], pints: [], sandwiches: [] },
    frances: { scoops: [], pints: [], sandwiches: [] },
    northvan: { scoops: [], pints: [], sandwiches: [] },
  };
}

function getDescriptionForFlavor(slug, name, descriptionsBySlug, fallback) {
  return descriptionsBySlug[slug] ?? fallback(name);
}

export function descriptionFallbacksToSlugMap(fallbacks) {
  const descriptionsBySlug = {};

  for (const fallback of fallbacks) {
    if (!fallback || typeof fallback !== 'object') {
      continue;
    }

    const id = typeof fallback.id === 'string' ? fallback.id : slugify(fallback.name ?? '');
    const description = normalizeFlavorName(fallback.description ?? '');

    if (id && description) {
      descriptionsBySlug[id] = description;
    }
  }

  return descriptionsBySlug;
}

export function readFlavorDescriptionFallbacks(fallbackPath = DESCRIPTION_FALLBACK_OUTPUT_PATH) {
  if (!fs.existsSync(fallbackPath)) {
    return [];
  }

  try {
    const fallbacks = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
    return Array.isArray(fallbacks) ? fallbacks : [];
  } catch (error) {
    console.warn(`Could not read flavor description fallbacks: ${error.message}`);
    return [];
  }
}

export function mergeFlavorDescriptionFallbacks(existingFallbacks, scrapedDescriptionsBySlug, flavorsData = []) {
  const fallbacksBySlug = new Map();

  for (const fallback of existingFallbacks) {
    if (!fallback || typeof fallback !== 'object') {
      continue;
    }

    const id = typeof fallback.id === 'string' ? fallback.id : slugify(fallback.name ?? '');
    const name = normalizeFlavorName(fallback.name ?? '');
    const description = normalizeFlavorName(fallback.description ?? '');

    if (id && name && description) {
      fallbacksBySlug.set(id, { id, name, description });
    }
  }

  for (const flavor of flavorsData) {
    const existing = fallbacksBySlug.get(flavor.id);

    if (existing) {
      existing.name = flavor.name;
    }
  }

  for (const [id, description] of Object.entries(scrapedDescriptionsBySlug)) {
    const flavor = flavorsData.find((candidate) => candidate.id === id);
    const name = flavor?.name ?? fallbacksBySlug.get(id)?.name ?? id;
    const normalizedDescription = normalizeFlavorName(description);

    if (normalizedDescription) {
      fallbacksBySlug.set(id, {
        id,
        name,
        description: normalizedDescription,
      });
    }
  }

  return [...fallbacksBySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function buildFlavorData(storeData, descriptionsBySlug = {}) {
  const allScoopNames = new Set();
  const allPintNames = new Set();
  const allSandwichNames = new Set();
  
  Object.values(storeData).forEach(data => {
    data.scoops.forEach(f => allScoopNames.add(getFlavorItemName(f)));
    data.pints.forEach(f => allPintNames.add(getFlavorItemName(f)));
    data.sandwiches.forEach(f => allSandwichNames.add(getFlavorItemName(f)));
  });

  const flavorsData = [];
  const allIceCreamNames = new Set([...allScoopNames, ...allPintNames]);
  
  for (const name of allIceCreamNames) {
    const slug = slugify(name);
    const scoopStores = [];
    const pintStores = [];
    const sandwichStores = [];
    
    for (const [storeId, data] of Object.entries(storeData)) {
      if (data.scoops.some(f => slugify(getFlavorItemName(f)) === slug || getFlavorItemName(f).toLowerCase() === name.toLowerCase())) {
        scoopStores.push(storeId);
      }
      if (data.pints.some(f => slugify(getFlavorItemName(f)) === slug || getFlavorItemName(f).toLowerCase() === name.toLowerCase())) {
        pintStores.push(storeId);
      }
      if (data.sandwiches.some(f => slugify(getFlavorItemName(f)) === slug || getFlavorItemName(f).toLowerCase() === name.toLowerCase())) {
        sandwichStores.push(storeId);
      }
    }
    
    flavorsData.push({
      id: slug,
      name,
      isVegan: isVegan(name),
      scoopStores,
      pintStores,
      sandwichStores,
      description: getDescriptionForFlavor(
        slug,
        name,
        descriptionsBySlug,
        (flavorName) => `Delicious ${flavorName} ice cream from Earnest Ice Cream.`,
      ),
    });
  }
  
  for (const name of allSandwichNames) {
    const slug = slugify(name);
    const existingFlavor = flavorsData.find(f => f.id === slug);
    if (existingFlavor) {
      continue;
    }
    
    const sandwichStores = [];
    
    for (const [storeId, data] of Object.entries(storeData)) {
      if (data.sandwiches.some(f => slugify(getFlavorItemName(f)) === slug || getFlavorItemName(f).toLowerCase() === name.toLowerCase())) {
        sandwichStores.push(storeId);
      }
    }
    
    flavorsData.push({
      id: slug,
      name,
      isVegan: isVegan(name),
      scoopStores: [],
      pintStores: [],
      sandwichStores,
      description: getDescriptionForFlavor(
        slug,
        name,
        descriptionsBySlug,
        () => 'Pre-made ice cream sandwich from Earnest Ice Cream.',
      ),
    });
  }
  
  return flavorsData.sort((a, b) => {
    const aHasIceCream = a.scoopStores.length > 0 || a.pintStores.length > 0;
    const bHasIceCream = b.scoopStores.length > 0 || b.pintStores.length > 0;
    const aSandwichOnly = !aHasIceCream && a.sandwichStores.length > 0;
    const bSandwichOnly = !bHasIceCream && b.sandwichStores.length > 0;
    
    if (aSandwichOnly !== bSandwichOnly) {
      return aSandwichOnly ? 1 : -1;
    }
    
    if (aHasIceCream && bHasIceCream) {
      const aScoopAll = a.scoopStores.length === 4;
      const bScoopAll = b.scoopStores.length === 4;
      if (aScoopAll !== bScoopAll) {
        return aScoopAll ? 1 : -1;
      }
    }
    
    return a.name.localeCompare(b.name);
  });
}

export function validateStoreData(storeData) {
  for (const [storeId, data] of Object.entries(storeData)) {
    for (const servingType of ['scoops', 'pints']) {
      if (data[servingType].length === 0) {
        throw new Error(`Scrape for ${storeId} produced no ${servingType}. Refusing to overwrite flavor data.`);
      }
    }

    for (const [servingType, names] of Object.entries(data)) {
      const normalizedNames = names.map((item) => slugify(getFlavorItemName(item)));
      const uniqueNames = new Set(normalizedNames);
      if (uniqueNames.size !== normalizedNames.length) {
        throw new Error(`Scrape for ${storeId} produced duplicate ${servingType}.`);
      }
    }
  }
}

export function collectFlavorUrlsBySlug(storeData) {
  const urlsBySlug = new Map();

  for (const data of Object.values(storeData)) {
    for (const servingType of ['scoops', 'pints', 'sandwiches']) {
      for (const item of data[servingType]) {
        const name = getFlavorItemName(item);
        const url = getFlavorItemUrl(item);

        if (!url) {
          continue;
        }

        const slug = slugify(name);
        if (!urlsBySlug.has(slug)) {
          urlsBySlug.set(slug, url);
        }
      }
    }
  }

  return urlsBySlug;
}

export function extractFlavorDescriptionFromDocument() {
  const normalizeText = (text) => (text ?? '').trim().replace(/\s+/g, ' ');
  const main = document.querySelector('main') ?? document.body;
  const excludedText = [
    'contains ',
    'ingredients',
    'get the latest scoop',
    'we promise to not share',
    'be earnest',
    'seriously good',
    'newsletter',
    'earnest ice cream ©',
  ];

  const isLikelyDescription = (text) => {
    const normalized = normalizeText(text);
    const lower = normalized.toLowerCase();

    return (
      normalized.length >= 30 &&
      normalized.length <= 700 &&
      /[.!?]/.test(normalized) &&
      !excludedText.some((excluded) => lower.includes(excluded))
    );
  };

  const heading = main.querySelector('h1');
  if (heading) {
    let node = heading.nextElementSibling;
    while (node) {
      const tagName = node.tagName?.toLowerCase();
      const text = normalizeText(node.textContent);

      if ((tagName === 'h2' || tagName === 'h3') && text.toLowerCase().includes('ingredients')) {
        break;
      }

      if (isLikelyDescription(text)) {
        return text;
      }

      node = node.nextElementSibling;
    }
  }

  const paragraphs = [...main.querySelectorAll('p')];
  const description = paragraphs.map((paragraph) => normalizeText(paragraph.textContent)).find(isLikelyDescription);

  if (description) {
    return description;
  }

  const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content');
  const normalizedMetaDescription = normalizeText(metaDescription);

  return isLikelyDescription(normalizedMetaDescription) ? normalizedMetaDescription : '';
}

export async function scrapeFlavorDescriptions(page, urlsBySlug) {
  const descriptionsBySlug = {};

  for (const [slug, url] of urlsBySlug.entries()) {
    if (descriptionsBySlug[slug]) {
      continue;
    }

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const description = normalizeFlavorName(await page.evaluate(extractFlavorDescriptionFromDocument));

      if (description) {
        descriptionsBySlug[slug] = description;
      }
    } catch (error) {
      console.warn(`  Could not scrape description for ${slug}: ${error.message}`);
    }
  }

  return descriptionsBySlug;
}

export async function scrapeTab(page, tabName) {
  console.log(`  Scraping ${tabName} tab...`);
  
  try {
    // Click on the tab
    const tabLink = await page.locator(`a:has-text("${tabName}")`).first();
    const targetId = await tabLink.evaluate((link) => {
      const href = link.getAttribute('href');
      const ariaControls = link.getAttribute('aria-controls');
      const dataTarget = link.getAttribute('data-bs-target') || link.getAttribute('data-target');
      const target = href || dataTarget || ariaControls;

      if (!target) {
        return null;
      }

      return target.startsWith('#') ? target.slice(1) : target;
    }).catch(() => null);

    if (await tabLink.isVisible().catch(() => false)) {
      await tabLink.click();
      await page.waitForTimeout(500); // Wait for tab content to load
    }
    
    const flavors = await page.evaluate(extractFlavorItemsFromTabDocument, { targetId });
    
    return flavors
      .map((item) => ({
        ...item,
        name: normalizeFlavorName(item.name),
      }))
      .filter(item => item.name.length > 0);
  } catch (error) {
    console.error(`Error scraping ${tabName}:`, error.message);
    return [];
  }
}

export async function scrapeStorePage(page, url) {
  console.log(`\nScraping: ${url}`);
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const pageText = await page.evaluate(() => document.body?.innerText ?? '');
    const sourceLastUpdatedText = extractSourceLastUpdatedFromText(pageText);
    await page.waitForSelector('a[href*="/flavours/"]', { timeout: 10000 });
    
    // Scrape each tab separately
    const scoops = await scrapeTab(page, 'Scoops');
    const pints = await scrapeTab(page, 'Pints');
    const sandwiches = await scrapeTab(page, 'Sandwiches');
    
    return { scoops, pints, sandwiches, sourceLastUpdatedText };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    return { scoops: [], pints: [], sandwiches: [], sourceLastUpdatedText: '' };
  }
}

async function runScrape() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Earnest Ice Cream Flavor Scraper                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log('Note: Scoops, Pints, and Sandwiches are scraped separately as they can differ!\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();
  
  // Scrape each store
  const storeData = createEmptyStoreData();
  const sourceLastUpdatedByStore = {};
  
  for (const [storeId, url] of Object.entries(STORE_URLS)) {
    const data = await scrapeStorePage(page, url);
    const { sourceLastUpdatedText, ...availabilityData } = data;
    storeData[storeId] = availabilityData;
    sourceLastUpdatedByStore[storeId] = sourceLastUpdatedText;
    console.log(`  → ${storeId}: ${data.scoops.length} scoops, ${data.pints.length} pints, ${data.sandwiches.length} sandwiches`);
    console.log(`    Official site ${sourceLastUpdatedText || 'last-updated text not found'}`);
  }
  
  validateStoreData(storeData);
  const flavorUrlsBySlug = collectFlavorUrlsBySlug(storeData);
  const descriptionFallbacks = readFlavorDescriptionFallbacks();
  const fallbackDescriptionsBySlug = descriptionFallbacksToSlugMap(descriptionFallbacks);
  console.log(`\nLoaded ${Object.keys(fallbackDescriptionsBySlug).length} fallback descriptions`);
  console.log(`\nScraping official descriptions for ${flavorUrlsBySlug.size} unique flavor pages...`);
  const descriptionPage = await context.newPage();
  const descriptionsBySlug = await scrapeFlavorDescriptions(descriptionPage, flavorUrlsBySlug);
  console.log(`  → Found ${Object.keys(descriptionsBySlug).length} official descriptions`);
  await browser.close();
  const effectiveDescriptionsBySlug = {
    ...fallbackDescriptionsBySlug,
    ...descriptionsBySlug,
  };
  
  // Build unified flavor list
  const allScoopNames = new Set();
  const allPintNames = new Set();
  const allSandwichNames = new Set();
  
  Object.values(storeData).forEach(data => {
    data.scoops.forEach(f => allScoopNames.add(getFlavorItemName(f)));
    data.pints.forEach(f => allPintNames.add(getFlavorItemName(f)));
    data.sandwiches.forEach(f => allSandwichNames.add(getFlavorItemName(f)));
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`  Total unique scoops: ${allScoopNames.size}`);
  console.log(`  Total unique pints: ${allPintNames.size}`);
  console.log(`  Total unique sandwiches: ${allSandwichNames.size}`);
  
  const flavorsData = buildFlavorData(storeData, effectiveDescriptionsBySlug);
  
  // Print stats
  const iceCreamFlavors = flavorsData.filter(f => f.scoopStores.length > 0 || f.pintStores.length > 0);
  const sandwichFlavors = flavorsData.filter(f => f.sandwichStores.length > 0);
  const sandwichOnlyFlavors = flavorsData.filter(f => f.sandwichStores.length > 0 && f.scoopStores.length === 0 && f.pintStores.length === 0);
  const scoopOnlyFlavors = iceCreamFlavors.filter(f => f.scoopStores.length > 0 && f.pintStores.length === 0);
  const pintOnlyFlavors = iceCreamFlavors.filter(f => f.pintStores.length > 0 && f.scoopStores.length === 0);
  const bothServingFlavors = iceCreamFlavors.filter(f => f.scoopStores.length > 0 && f.pintStores.length > 0);
  
  console.log(`\n📈 Flavor Breakdown:`);
  console.log(`  Ice cream flavors: ${iceCreamFlavors.length}`);
  console.log(`    - Scoop only: ${scoopOnlyFlavors.length}`);
  console.log(`    - Pint only: ${pintOnlyFlavors.length}`);
  console.log(`    - Both scoop & pint: ${bothServingFlavors.length}`);
  console.log(`  Sandwich flavors: ${sandwichFlavors.length}`);
  console.log(`    - Sandwich only: ${sandwichOnlyFlavors.length}`);
  
  const observedAt = new Date().toISOString();
  const existingMetadata = readMetadata();
  const existingFlavors = readFlavorSnapshot();
  const previousDayBaselineSnapshot = resolvePreviousDayBaselineSnapshot({
    observedAt,
    existingFlavors,
    existingMetadata,
  });
  const previousDayAvailabilityDiff = buildPreviousDayAvailabilityDiffFromBaseline(
    flavorsData,
    previousDayBaselineSnapshot,
    { observedAt },
  );

  // Write data only; application logic lives in src/data/flavors.ts.
  fs.writeFileSync(FLAVORS_OUTPUT_PATH, `${JSON.stringify(flavorsData, null, 2)}\n`);
  const updatedDescriptionFallbacks = mergeFlavorDescriptionFallbacks(
    descriptionFallbacks,
    descriptionsBySlug,
    flavorsData,
  );
  fs.writeFileSync(DESCRIPTION_FALLBACK_OUTPUT_PATH, `${JSON.stringify(updatedDescriptionFallbacks, null, 2)}\n`);
  const metadata = {
    lastUpdatedAt: observedAt,
    source: 'https://earnesticecream.com',
    sourceLastUpdatedByStore,
    sourceLastUpdatedSignature: buildSourceLastUpdatedSignature(sourceLastUpdatedByStore),
    stores: STORE_URLS,
    previousDayBaselineSnapshot,
    previousDayAvailabilityDiff,
    counts: {
      totalItems: flavorsData.length,
      iceCreamFlavors: iceCreamFlavors.length,
      scoopItems: iceCreamFlavors.filter(f => f.scoopStores.length > 0).length,
      pintItems: iceCreamFlavors.filter(f => f.pintStores.length > 0).length,
      sandwichItems: sandwichFlavors.length,
      sandwichOnlyItems: sandwichOnlyFlavors.length,
    },
  };
  fs.writeFileSync(METADATA_OUTPUT_PATH, `${JSON.stringify(metadata, null, 2)}\n`);
  
  console.log(`\n✅ Updated ${FLAVORS_OUTPUT_PATH}`);
  console.log(`✅ Updated ${DESCRIPTION_FALLBACK_OUTPUT_PATH}`);
  console.log(`✅ Updated ${METADATA_OUTPUT_PATH}`);
  console.log(`   Total items: ${flavorsData.length}`);
}

async function main(options = {}) {
  const { force = false } = options;

  if (!force) {
    try {
      const sourceCheck = await checkSourceNeedsUpdate();
      console.log(`Official site timestamp: ${sourceCheck.sourceLastUpdatedSignature}`);
      console.log(`Stored site timestamp: ${sourceCheck.existingSourceLastUpdatedSignature || 'not found'}`);

      if (!sourceCheck.shouldUpdate) {
        console.log('Source has not changed; skipping scrape.');
        return;
      }

      console.log('Source changed; continuing with full scrape.\n');
    } catch (error) {
      console.warn(`Could not check official site timestamp: ${error.message}`);
      console.warn('Falling back to a full scrape.\n');
    }
  } else {
    console.log('Force mode enabled; skipping source freshness check.\n');
  }

  await runScrape();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parseCliOptions();

  main(options).catch(error => {
    console.error('Scraping failed:', error);
    process.exit(1);
  });
}
