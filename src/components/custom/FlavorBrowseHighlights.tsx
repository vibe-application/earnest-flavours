import { stores } from '@/data/stores';
import { cn } from '@/lib/utils';
import type { Flavor } from '@/data/flavors';
import {
  type FlavorHighlightBucket,
  type FlavorHighlightBucketId,
  type ServingType,
} from '@/lib/flavor-browser';
import { getStoresForServingType } from '@/lib/flavor-logic';
import type { StoreId } from '@/data/stores';

export interface RemovedFlavorHighlight {
  id: string;
  name: string;
  storeIds: StoreId[];
}

interface FlavorBrowseHighlightsProps {
  buckets: FlavorHighlightBucket[];
  removedSinceYesterday: RemovedFlavorHighlight[];
  servingType: ServingType;
}

const previewLimit = 4;

const sectionEyebrowClass = 'text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/80';
const cardClass = 'glass-pane rounded-[1.75rem] p-4 shadow-soft sm:p-5';
const cardCountClass =
  'inline-flex items-center rounded-full bg-secondary/45 px-2.5 py-1 text-xs font-semibold text-foreground shadow-xs';
const listHintClass = 'text-xs text-muted-foreground sm:text-sm';
const diffRowClass =
  'flex flex-col gap-1.5 rounded-[1.25rem] bg-muted/45 px-3 py-2 sm:flex-row sm:items-center sm:justify-between';
const badgeClass =
  'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium shadow-xs sm:text-xs';
const pillListItemClass =
  'inline-flex items-center rounded-full border border-border/70 bg-muted/45 px-2.5 py-1 text-xs font-medium text-foreground';
const singleLocationRowClass =
  'flex items-center justify-between gap-3 rounded-[1.25rem] bg-muted/45 px-3 py-2';

const diffCardTestIds = {
  added: 'added-since-yesterday',
  removed: 'removed-since-yesterday',
} as const;

const bucketTestIdById: Record<FlavorHighlightBucketId, string> = {
  'new-today': diffCardTestIds.added,
  'all-locations': 'all-locations',
  vegan: 'vegan',
  'single-location': 'single-location',
};

const storeBadgeClasses: Record<StoreId, string> = {
  fraser:
    'border-store-fraser/25 bg-store-fraser/15 text-store-fraser dark:border-store-fraser/30 dark:bg-store-fraser/10 dark:text-rose-100',
  quebec:
    'border-store-quebec/25 bg-store-quebec/15 text-store-quebec dark:border-store-quebec/30 dark:bg-store-quebec/10 dark:text-sky-100',
  frances:
    'border-store-frances/25 bg-store-frances/20 text-store-frances dark:border-store-frances/30 dark:bg-store-frances/10 dark:text-amber-100',
  northvan:
    'border-store-northvan/25 bg-store-northvan/15 text-store-northvan dark:border-store-northvan/30 dark:bg-store-northvan/10 dark:text-emerald-100',
};

const bucketCopy: Record<
  FlavorHighlightBucketId,
  {
    label: string;
  }
> = {
  'new-today': {
    label: 'New today',
  },
  'all-locations': {
    label: 'At all four shops',
  },
  vegan: {
    label: 'Vegan flavors',
  },
  'single-location': {
    label: 'One shop only',
  },
};

const getPreviewStore = (flavor: Flavor, servingType: ServingType) => {
  const [storeId] = getStoresForServingType(flavor, servingType);

  return stores.find((store) => store.id === storeId);
};

const getStoresForBucketFlavor = (bucket: FlavorHighlightBucket, flavor: Flavor) => {
  const bucketStoreIds = bucket.storeIdsByFlavorId[flavor.id] ?? [];

  return stores.filter((store) => bucketStoreIds.includes(store.id));
};

const renderDiffRows = (
  rows: Array<{ id: string; name: string; storeIds: StoreId[] }>,
  bucketTestId: string,
) => {
  return (
    <ul className="space-y-1.5">
      {rows.map((row) => {
        const rowStores = stores.filter((store) => row.storeIds.includes(store.id));

        return (
          <li
            key={row.id}
            data-testid={`highlight-${bucketTestId}-row-${row.id}`}
            className={diffRowClass}
          >
            <span className="min-w-0 text-sm font-medium text-foreground">{row.name}</span>

            <div className="flex flex-wrap gap-1 sm:justify-end">
              {rowStores.map((store) => (
                <span
                  key={store.id}
                  data-testid={`highlight-${bucketTestId}-badge-${row.id}-${store.id}`}
                  className={cn(
                    badgeClass,
                    storeBadgeClasses[store.id],
                  )}
                >
                  {store.shortName}
                </span>
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export function FlavorBrowseHighlights({
  buckets,
  removedSinceYesterday,
  servingType,
}: FlavorBrowseHighlightsProps) {
  const addedBucket = buckets.find((bucket) => bucket.id === 'new-today') ?? null;
  const remainingBuckets = buckets.filter((bucket) => bucket.id !== 'new-today');
  const removedPreviewRows = removedSinceYesterday.slice(0, previewLimit);
  const removedRemainingCount = removedSinceYesterday.length - removedPreviewRows.length;
  const hasDayOverDayChanges = Boolean(addedBucket) || removedSinceYesterday.length > 0;

  if (buckets.length === 0 && removedSinceYesterday.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3" aria-label="Objective flavor highlights">
      <div className="space-y-1">
        <p className={sectionEyebrowClass}>Browse cues</p>
        <h2 className="text-2xl text-balance text-foreground sm:text-3xl">
          {hasDayOverDayChanges ? `Today’s ${servingType} highlights` : `Current ${servingType} highlights`}
        </h2>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {addedBucket ? (() => {
          const previewFlavors = addedBucket.flavors.slice(0, previewLimit);
          const remainingCount = addedBucket.flavors.length - previewFlavors.length;
          const copy = bucketCopy[addedBucket.id];
          const bucketTestId = bucketTestIdById[addedBucket.id];
          const addedRows = previewFlavors.map((flavor) => ({
            id: flavor.id,
            name: flavor.name,
            storeIds: getStoresForBucketFlavor(addedBucket, flavor).map((store) => store.id),
          }));

          return (
            <article
              key={addedBucket.id}
              data-testid={`highlight-${bucketTestId}`}
              className={cardClass}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-base leading-tight text-foreground sm:text-lg">{copy.label}</h3>

                <span className={cardCountClass}>
                  {addedBucket.flavors.length}
                </span>
              </div>

              <div className="mt-3 space-y-1.5">
                {renderDiffRows(addedRows, bucketTestId)}

                {remainingCount > 0 ? (
                  <p className={listHintClass}>
                    +{remainingCount} more in the alphabetical list below.
                  </p>
                ) : null}
              </div>
            </article>
          );
        })() : null}

        {removedSinceYesterday.length > 0 ? (
          <article
            key={diffCardTestIds.removed}
            data-testid={`highlight-${diffCardTestIds.removed}`}
            className={cardClass}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-base leading-tight text-foreground sm:text-lg">Gone since yesterday</h3>

              <span className={cardCountClass}>
                {removedSinceYesterday.length}
              </span>
            </div>

            <div className="mt-3 space-y-1.5">
              {renderDiffRows(removedPreviewRows, diffCardTestIds.removed)}

              {removedRemainingCount > 0 ? (
                <p className={listHintClass}>
                  +{removedRemainingCount} more from yesterday&apos;s list.
                </p>
              ) : null}
            </div>
          </article>
        ) : null}

        {remainingBuckets.map((bucket) => {
          const previewFlavors = bucket.flavors.slice(0, previewLimit);
          const remainingCount = bucket.flavors.length - previewFlavors.length;
          const copy = bucketCopy[bucket.id];
          const bucketTestId = bucketTestIdById[bucket.id];

          return (
            <article
              key={bucket.id}
              data-testid={`highlight-${bucketTestId}`}
              className={cardClass}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-base leading-tight text-foreground sm:text-lg">{copy.label}</h3>

                <span className={cardCountClass}>
                  {bucket.flavors.length}
                </span>
              </div>

              <div className="mt-3 space-y-1.5">
                {bucket.id === 'single-location' ? (
                  <ul className="space-y-1.5">
                    {previewFlavors.map((flavor) => {
                      const store = getPreviewStore(flavor, servingType);

                      return (
                        <li
                          key={flavor.id}
                          className={singleLocationRowClass}
                        >
                          <span className="min-w-0 text-sm font-medium text-foreground">
                            {flavor.name}
                          </span>
                          {store ? (
                            <span className="inline-flex shrink-0 items-center rounded-full border border-border/70 bg-background/85 px-2 py-0.5 text-[11px] font-medium text-muted-foreground shadow-xs sm:text-xs">
                              {store.shortName}
                            </span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {previewFlavors.map((flavor) => (
                      <span
                        key={flavor.id}
                        className={pillListItemClass}
                      >
                        {flavor.name}
                      </span>
                    ))}
                  </div>
                )}

                {remainingCount > 0 ? (
                  <p className={listHintClass}>
                    +{remainingCount} more in the alphabetical list below.
                  </p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
