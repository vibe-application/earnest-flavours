import bundledFlavors from './flavors.json' with { type: 'json' };
import bundledMetadata from './metadata.json' with { type: 'json' };
import type { Flavor } from './flavors.js';

export type FlavorMetadata = typeof bundledMetadata;

export interface EarnestRuntimeOverride {
  flavors?: Flavor[];
  metadata?: FlavorMetadata;
  now?: string | number;
}

type RuntimeGlobal = typeof globalThis & {
  __ERNEST_TEST_DATA__?: EarnestRuntimeOverride;
  window?: {
    __ERNEST_TEST_DATA__?: EarnestRuntimeOverride;
  };
};

const getRuntimeOverride = (): EarnestRuntimeOverride | undefined => {
  const runtimeGlobal = globalThis as RuntimeGlobal;

  return runtimeGlobal.__ERNEST_TEST_DATA__ ?? runtimeGlobal.window?.__ERNEST_TEST_DATA__;
};

export const getRuntimeFlavors = (): Flavor[] => {
  return getRuntimeOverride()?.flavors ?? (bundledFlavors as Flavor[]);
};

export const getRuntimeMetadata = (): FlavorMetadata => {
  return getRuntimeOverride()?.metadata ?? bundledMetadata;
};

export const getRuntimeNow = (): string | number => {
  return getRuntimeOverride()?.now ?? Date.now();
};
