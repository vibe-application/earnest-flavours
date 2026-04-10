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

// Known flavor descriptions (these don't change often)
export const FLAVOR_DESCRIPTIONS = {
  'whiskey-hazelnut': 'An Earnest Ice Cream original, made from day one and remains a favourite and top-seller. Roasted, salted BC hazelnuts in Whiskey ice cream base. A smooth, boozy flavour with a buttery crunch.',
  'salted-caramel': 'A classic for good reason. We\'ve been making this one since day one and it remains a favourite still. Deeply caramelized sugar mixed with cream and salt from Vancouver Island Sea Salt Co. Its rich, creamy and buttery and the perfect balance of salty and sweet.',
  'cookies-cream': 'Classic vanilla ice cream loaded with chunks of chocolate sandwich cookies. A timeless favorite for all ages.',
  'london-fog': 'Earl Grey tea infused ice cream with vanilla. Inspired by the classic Vancouver coffee shop drink, this flavour combines bergamot-scented tea with creamy vanilla for a sophisticated treat.',
  'matcha-green-tea': 'Our matcha green tea powder is supplied by Aiya and grown in Nishio, a historic tea cultivation region in Japan, from a family owned and operated farm for the last 125 years. It\'s a shade-grown matcha, giving it light colour and caramel notes.',
  'mint-chip': 'Fresh mint ice cream studded with dark chocolate chips. Cool, refreshing, and perfectly balanced.',
  'chocolate': 'Smooth, creamy, and oh-so-chocolatey! This ice cream is a lovely balance between our Milk Chocolate and Serious Chocolate flavours, and is sure to satisfy any chocolate-lover.',
  'tahitian-vanilla': 'Made with premium Tahitian vanilla beans known for their floral, fruity notes. Simple, elegant, and absolutely delicious.',
  'strawberry': 'Fresh, fruity strawberry ice cream made with real berries. A taste of summer in every scoop.',
  'cream-cheese': 'Tangy, rich cream cheese ice cream that tastes like cheesecake in frozen form. Surprisingly addictive!',
  'lemon-poppyseed': 'Bright, zesty lemon ice cream with crunchy poppy seeds throughout. Refreshing and unique.',
  'cinnamon-bun': 'Get ready for a delightful treat with our cinnamon bun ice cream. We\'ve taken freshly baked cinnamon buns, crafted in-house, and blended them into our creamy ice cream base, creating a delightful light bread texture that melts in your mouth.',
  'irish-cream': 'Your favourite Irish cream liqueur in frozen form. It\'s creamy, slightly boozy, with a hint of chocolate and coffee.',
  'vegan-cookies-cream': 'Plant-based cookies and cream made with our vegan vanilla base and chocolate sandwich cookies.',
  'vegan-nanaimo-bar': 'Inspired by the classic BC treat, this vegan flavour captures the essence of chocolate, coconut, and custard in every bite.',
  'vegan-strawberry-rhubarb': 'Tangy strawberry rhubarb ripple swirled through our plant-based vanilla base. A perfect balance of sweet and tart.',
  'oatmeal-brown-sugar': 'Cinnamon-spiced oatmeal ice cream with ribbons of brown sugar caramel. Like a warm bowl of oatmeal cookie dough.',
  'vegan-chocolate': 'Rich, decadent chocolate ice cream made without dairy. Creamy, smooth, and intensely chocolatey.',
  'carrot-cake': 'Spiced carrot cake ice cream with cream cheese frosting swirls. Tastes just like the classic dessert!',
  'vegan-peaches-cream': 'Fresh peach swirls in our plant-based cream base. A North Van exclusive that captures the essence of summer.',
  // Sandwiches
  'classic-sammie': 'A classic ice cream sandwich with vanilla ice cream between two chocolate cookies.',
  'mint-cookie-crunch-sammie': 'Mint ice cream with cookie crunch pieces sandwiched between chocolate cookies.',
  'vegan-mocha-brownie-sammie': 'Vegan mocha ice cream sandwiched between two fudgy brownie cookies.',
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

export function extractFlavorNamesFromLinks(links, { visibleOnly = false } = {}) {
  const names = [];

  for (const link of links) {
    const isVisible = !visibleOnly ||
      Boolean(link.offsetWidth || link.offsetHeight || link.getClientRects?.().length);

    if (!isVisible) {
      continue;
    }

    const text = normalizeFlavorName(link.textContent ?? '');
    if (isFlavorLinkText(text)) {
      names.push(text);
    }
  }

  return [...new Set(names)];
}

export function extractFlavorNamesFromTabDocument({ targetId } = {}) {
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
  const extractNames = (links, { visibleOnly = false } = {}) => {
    const names = [];

    for (const link of links) {
      const isVisible = !visibleOnly ||
        Boolean(link.offsetWidth || link.offsetHeight || link.getClientRects?.().length);

      if (!isVisible) {
        continue;
      }

      const text = normalizeText(link.textContent);
      if (isFlavorText(text)) {
        names.push(text);
      }
    }

    return [...new Set(names)];
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
    const names = extractNames(root.querySelectorAll('a[href*="/flavours/"]'));
    if (names.length > 0) {
      return names;
    }
  }

  const visibleNames = extractNames(
    document.querySelectorAll('a[href*="/flavours/"]'),
    { visibleOnly: true },
  );

  if (visibleNames.length > 0) {
    return visibleNames;
  }

  return extractNames(document.querySelectorAll('a[href*="/flavours/"]'));
}

export function createEmptyStoreData() {
  return {
    fraser: { scoops: [], pints: [], sandwiches: [] },
    quebec: { scoops: [], pints: [], sandwiches: [] },
    frances: { scoops: [], pints: [], sandwiches: [] },
    northvan: { scoops: [], pints: [], sandwiches: [] },
  };
}

function getDescriptionForFlavor(slug, name, fallback) {
  let description = FLAVOR_DESCRIPTIONS[slug];
  if (!description) {
    for (const [key, desc] of Object.entries(FLAVOR_DESCRIPTIONS)) {
      if (slug.includes(key) || key.includes(slug)) {
        description = desc;
        break;
      }
    }
  }

  return description ?? fallback(name);
}

export function buildFlavorData(storeData) {
  const allScoopNames = new Set();
  const allPintNames = new Set();
  const allSandwichNames = new Set();
  
  Object.values(storeData).forEach(data => {
    data.scoops.forEach(f => allScoopNames.add(f));
    data.pints.forEach(f => allPintNames.add(f));
    data.sandwiches.forEach(f => allSandwichNames.add(f));
  });

  const flavorsData = [];
  const allIceCreamNames = new Set([...allScoopNames, ...allPintNames]);
  
  for (const name of allIceCreamNames) {
    const slug = slugify(name);
    const scoopStores = [];
    const pintStores = [];
    const sandwichStores = [];
    
    for (const [storeId, data] of Object.entries(storeData)) {
      if (data.scoops.some(f => slugify(f) === slug || f.toLowerCase() === name.toLowerCase())) {
        scoopStores.push(storeId);
      }
      if (data.pints.some(f => slugify(f) === slug || f.toLowerCase() === name.toLowerCase())) {
        pintStores.push(storeId);
      }
      if (data.sandwiches.some(f => slugify(f) === slug || f.toLowerCase() === name.toLowerCase())) {
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
      if (data.sandwiches.some(f => slugify(f) === slug || f.toLowerCase() === name.toLowerCase())) {
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
      const normalizedNames = names.map((name) => slugify(name));
      const uniqueNames = new Set(normalizedNames);
      if (uniqueNames.size !== normalizedNames.length) {
        throw new Error(`Scrape for ${storeId} produced duplicate ${servingType}.`);
      }
    }
  }
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
    
    const flavors = await page.evaluate(extractFlavorNamesFromTabDocument, { targetId });
    
    return flavors.map(normalizeFlavorName).filter(name => name.length > 0);
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
  
  await browser.close();
  validateStoreData(storeData);
  
  // Build unified flavor list
  const allScoopNames = new Set();
  const allPintNames = new Set();
  const allSandwichNames = new Set();
  
  Object.values(storeData).forEach(data => {
    data.scoops.forEach(f => allScoopNames.add(f));
    data.pints.forEach(f => allPintNames.add(f));
    data.sandwiches.forEach(f => allSandwichNames.add(f));
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`  Total unique scoops: ${allScoopNames.size}`);
  console.log(`  Total unique pints: ${allPintNames.size}`);
  console.log(`  Total unique sandwiches: ${allSandwichNames.size}`);
  
  const flavorsData = buildFlavorData(storeData);
  
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
