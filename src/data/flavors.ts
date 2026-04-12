import type { StoreId } from './stores.js';
import { normalizeFlavorSearchText } from '../lib/flavor-logic.js';
import { getRuntimeFlavors } from './runtime-data.js';

export interface Flavor {
  id: string;
  name: string;
  isVegan: boolean;
  scoopStores: StoreId[];     // Stores where available as scoop
  pintStores: StoreId[];      // Stores where available as pint
  sandwichStores: StoreId[];  // Stores where available as pre-made sandwich
  description: string;
}

export const flavors: Flavor[] = getRuntimeFlavors();

// Helper to check if a flavor is available as a sandwich at any store
export const hasSandwich = (flavor: Flavor): boolean => {
  return flavor.sandwichStores.length > 0;
};

// Helper to check if a flavor is available as scoop at all stores
export const isScoopAtAllStores = (flavor: Flavor): boolean => {
  return flavor.scoopStores.length === 4;
};

// Helper to check if a flavor is available as pint at all stores
export const isPintAtAllStores = (flavor: Flavor): boolean => {
  return flavor.pintStores.length === 4;
};

// Helper to check if a flavor is available as sandwich at all stores
export const isSandwichAtAllStores = (flavor: Flavor): boolean => {
  return flavor.sandwichStores.length === 4;
};

// Get all stores where this flavor is available (any serving type)
export const getAllStores = (flavor: Flavor): StoreId[] => {
  const allStores = new Set([...flavor.scoopStores, ...flavor.pintStores, ...flavor.sandwichStores]);
  return Array.from(allStores);
};

// Get flavors available as scoop (not sandwich-only)
export const getIceCreamFlavors = (): Flavor[] => {
  return flavors.filter(flavor => flavor.scoopStores.length > 0 || flavor.pintStores.length > 0);
};

// Get flavors available as sandwich
export const getSandwiches = (): Flavor[] => {
  return flavors.filter(flavor => flavor.sandwichStores.length > 0);
};

// Get flavors available as scoop at a specific store
export const getScoopsByStore = (storeId: StoreId): Flavor[] => {
  return flavors.filter(flavor => flavor.scoopStores.includes(storeId));
};

// Get flavors available as pint at a specific store
export const getPintsByStore = (storeId: StoreId): Flavor[] => {
  return flavors.filter(flavor => flavor.pintStores.includes(storeId));
};

// Get flavors available as sandwich at a specific store
export const getSandwichesByStore = (storeId: StoreId): Flavor[] => {
  return flavors.filter(flavor => flavor.sandwichStores.includes(storeId));
};

// Get all flavors at a store (any serving type)
export const getFlavorsByStore = (storeId: StoreId): Flavor[] => {
  return flavors.filter(flavor => 
    flavor.scoopStores.includes(storeId) || 
    flavor.pintStores.includes(storeId) ||
    flavor.sandwichStores.includes(storeId)
  );
};

export const getVeganFlavors = (): Flavor[] => {
  return flavors.filter(flavor => flavor.isVegan);
};

export const searchFlavors = (query: string): Flavor[] => {
  const queryTokens = normalizeFlavorSearchText(query)
    .split(' ')
    .filter(Boolean);

  return flavors.filter(flavor => 
    queryTokens.every((token) => normalizeFlavorSearchText(flavor.name).includes(token))
  );
};
