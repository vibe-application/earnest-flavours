import { stores } from '@/data/stores';
import type { Flavor } from '@/data/flavors';
import {
  type FlavorHighlightBucket,
  type FlavorHighlightBucketId,
  type ServingType,
} from '@/lib/flavor-browser';
import { getStoresForServingType } from '@/lib/flavor-logic';

interface FlavorBrowseHighlightsProps {
  buckets: FlavorHighlightBucket[];
  servingType: ServingType;
}

const servingTypeLabels: Record<ServingType, string> = {
  scoop: 'scoops',
  pint: 'pints',
  sandwich: 'sandwiches',
};

const previewLimit = 4;

const bucketCopy: Record<
  FlavorHighlightBucketId,
  {
    eyebrow: string;
    title: string;
    description: (count: number, servingLabel: string) => string;
  }
> = {
  'all-locations': {
    eyebrow: 'All locations',
    title: 'Available across all four shops',
    description: (count, servingLabel) =>
      `${count} ${servingLabel} currently appear at Fraser Street, Quebec Street, Frances Street, and North Vancouver.`,
  },
  vegan: {
    eyebrow: 'Vegan options',
    title: 'Dairy-free availability',
    description: (count, servingLabel) =>
      `${count} vegan ${servingLabel} currently match the selected serving type.`,
  },
  'single-location': {
    eyebrow: 'Single location',
    title: 'Only at one shop',
    description: (count, servingLabel) =>
      `${count} ${servingLabel} currently appear at exactly one location.`,
  },
};

const getPreviewStore = (flavor: Flavor, servingType: ServingType) => {
  const [storeId] = getStoresForServingType(flavor, servingType);

  return stores.find((store) => store.id === storeId);
};

export function FlavorBrowseHighlights({
  buckets,
  servingType,
}: FlavorBrowseHighlightsProps) {
  const servingLabel = servingTypeLabels[servingType];

  if (buckets.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4" aria-label="Objective flavor highlights">
      <div className="space-y-1">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/80">
            Browse highlights
          </p>
          <h2 className="text-2xl text-balance text-foreground sm:text-3xl">
            Objective cues for the current {servingType} view.
          </h2>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {buckets.map((bucket) => {
          const previewFlavors = bucket.flavors.slice(0, previewLimit);
          const remainingCount = bucket.flavors.length - previewFlavors.length;
          const copy = bucketCopy[bucket.id];

          return (
            <article
              key={bucket.id}
              data-testid={`highlight-${bucket.id}`}
              className="rounded-[1.75rem] border border-border/70 bg-card/95 p-5 shadow-soft sm:p-6"
            >
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {copy.eyebrow}
                </p>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-lg text-foreground">{copy.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {copy.description(bucket.flavors.length, servingLabel)}
                    </p>
                  </div>

                  <span className="inline-flex items-center rounded-full bg-secondary/45 px-3 py-1 text-sm font-semibold text-foreground shadow-xs">
                    {bucket.flavors.length}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {bucket.id === 'single-location' ? (
                  <ul className="space-y-2">
                    {previewFlavors.map((flavor) => {
                      const store = getPreviewStore(flavor, servingType);

                      return (
                        <li
                          key={flavor.id}
                          className="flex items-center justify-between gap-3 rounded-2xl bg-muted/45 px-3 py-2.5"
                        >
                          <span className="min-w-0 text-sm font-medium text-foreground">
                            {flavor.name}
                          </span>
                          {store ? (
                            <span className="inline-flex shrink-0 items-center rounded-full border border-border/70 bg-background/85 px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-xs">
                              {store.shortName}
                            </span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {previewFlavors.map((flavor) => (
                      <span
                        key={flavor.id}
                        className="inline-flex items-center rounded-full border border-border/70 bg-muted/45 px-3 py-1.5 text-sm font-medium text-foreground"
                      >
                        {flavor.name}
                      </span>
                    ))}
                  </div>
                )}

                {remainingCount > 0 ? (
                  <p className="text-sm text-muted-foreground">
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
