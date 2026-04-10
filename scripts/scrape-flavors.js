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

export const STORE_URLS = {
  fraser: 'https://earnesticecream.com/locations/fraser-st/',
  quebec: 'https://earnesticecream.com/locations/quebec-st/',
  frances: 'https://earnesticecream.com/locations/frances-st/',
  northvan: 'https://earnesticecream.com/locations/north-van/',
};

export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function normalizeFlavorName(name) {
  return name.trim().replace(/\s+/g, ' ');
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
    await page.waitForSelector('a[href*="/flavours/"]', { timeout: 10000 });
    
    // Scrape each tab separately
    const scoops = await scrapeTab(page, 'Scoops');
    const pints = await scrapeTab(page, 'Pints');
    const sandwiches = await scrapeTab(page, 'Sandwiches');
    
    return { scoops, pints, sandwiches };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    return { scoops: [], pints: [], sandwiches: [] };
  }
}

async function main() {
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
  
  for (const [storeId, url] of Object.entries(STORE_URLS)) {
    const data = await scrapeStorePage(page, url);
    storeData[storeId] = data;
    console.log(`  → ${storeId}: ${data.scoops.length} scoops, ${data.pints.length} pints, ${data.sandwiches.length} sandwiches`);
  }
  
  validateStoreData(storeData);
  const flavorUrlsBySlug = collectFlavorUrlsBySlug(storeData);
  console.log(`\nScraping official descriptions for ${flavorUrlsBySlug.size} unique flavor pages...`);
  const descriptionPage = await context.newPage();
  const descriptionsBySlug = await scrapeFlavorDescriptions(descriptionPage, flavorUrlsBySlug);
  console.log(`  → Found ${Object.keys(descriptionsBySlug).length} official descriptions`);
  await browser.close();
  
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
  
  const flavorsData = buildFlavorData(storeData, descriptionsBySlug);
  
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
  
  // Write data only; application logic lives in src/data/flavors.ts.
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'flavors.json');
  fs.writeFileSync(outputPath, `${JSON.stringify(flavorsData, null, 2)}\n`);
  const metadataPath = path.join(__dirname, '..', 'src', 'data', 'metadata.json');
  const metadata = {
    lastUpdatedAt: new Date().toISOString(),
    source: 'https://earnesticecream.com',
    stores: STORE_URLS,
    counts: {
      totalItems: flavorsData.length,
      iceCreamFlavors: iceCreamFlavors.length,
      scoopItems: iceCreamFlavors.filter(f => f.scoopStores.length > 0).length,
      pintItems: iceCreamFlavors.filter(f => f.pintStores.length > 0).length,
      sandwichItems: sandwichFlavors.length,
      sandwichOnlyItems: sandwichOnlyFlavors.length,
    },
  };
  fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  
  console.log(`\n✅ Updated ${outputPath}`);
  console.log(`✅ Updated ${metadataPath}`);
  console.log(`   Total items: ${flavorsData.length}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error('Scraping failed:', error);
    process.exit(1);
  });
}
