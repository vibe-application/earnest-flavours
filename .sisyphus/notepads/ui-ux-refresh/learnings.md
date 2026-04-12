# Learnings

## 2026-04-12 - Browse-state and freshness research

- Primary browse-state source files:
  - `src/sections/CoreFlavors.tsx`: owns in-page filter state, selected flavor state, filtered result derivation, result count, empty state, and passes serving-aware store ids into cards.
  - `src/components/custom/SearchFilterBar.tsx`: defines exported `ServingType` and `FilterState` contracts used by the main browse view; also hardcodes clear/reset defaults to `{ searchQuery: '', location: 'all', servingType: 'scoop', veganOnly: false }`.
  - `src/lib/flavor-logic.ts`: current reusable browse helpers (`normalizeFlavorSearchText`, `getStoresForServingType`, `getStoreServingAvailability`, `flavorMatchesVisualizationFilters`). This is the natural extension point for centralized browse-state helpers because `CoreFlavors`, `FlavorDetailPanel`, and `src/data/flavors.ts` already depend on it.
  - `src/data/flavors.ts`: existing helper style for objective data derivation (`isScoopAtAllStores`, `isPintAtAllStores`, `isSandwichAtAllStores`, `getAllStores`, store-serving getters, `searchFlavors`).
  - `src/data/stores.ts`: canonical `StoreId` union is fixed to `fraser | quebec | frances | northvan`; single-location logic should derive from this set rather than hardcoded counts scattered elsewhere.

- Freshness-related source files:
  - `src/data/metadata.json`: source of `lastUpdatedAt` and scrape metadata.
  - `src/components/custom/Navigation.tsx`: currently formats `metadata.lastUpdatedAt` with `Intl.DateTimeFormat(..., { timeZone: 'America/Vancouver' })` and shows only `Updated {date}`.
  - `src/components/custom/SearchFilterBar.tsx`: current notice copy is static (`Data refreshes daily at 1:00 PM and 4:30 PM Vancouver time`) and does not inspect metadata freshness.
  - No shared timezone or freshness helper exists yet; Vancouver timezone handling currently lives inline in `Navigation.tsx` only.

- Exact current browse/filter pipeline:
  1. `CoreFlavors` initializes default state as empty search + all locations + scoop + vegan off.
  2. `filteredFlavors` clones `flavors` and calls `flavorMatchesVisualizationFilters(flavor, filters)`.
  3. Inside `flavorMatchesVisualizationFilters`, the order is:
     - resolve serving-specific stores with `getStoresForServingType`
     - reject flavors with zero availability for the selected serving type
     - if `searchQuery` is non-empty, normalize flavor name and query with `normalizeFlavorSearchText`, split query into tokens, require every token to be included in the normalized name
     - if `location !== 'all'`, require the selected location in the serving-specific store list
     - if `veganOnly` is true, require `flavor.isVegan`
  4. After filtering, `CoreFlavors` sorts alphabetically with `a.name.localeCompare(b.name)`.
  5. `FlavorCard` receives `getStoresForServingType(flavor, filters.servingType)`, so the card badges already reflect the selected serving type instead of all serving types.

- Serving-type contracts and display behavior:
  - `ServingType` is duplicated in `SearchFilterBar.tsx` and `src/lib/flavor-logic.ts` with the same union: `'scoop' | 'pint' | 'sandwich'`.
  - `FilterState` is currently declared only in `SearchFilterBar.tsx` and imported by `CoreFlavors`.
  - `FlavorDetailPanel.tsx` uses `getStoreServingAvailability(flavor)` plus `isScoopAtAllStores` / `isPintAtAllStores` / `isSandwichAtAllStores` to show full per-store serving distinctions; this means browse-state helper work should extend shared logic rather than duplicate serving derivation in UI code.

- Objective helper inventory and current gaps:
  - Existing objective helpers that should be extended instead of duplicated:
    - `getStoresForServingType` for serving-aware availability selection
    - `normalizeFlavorSearchText` for consistent search token behavior
    - `isScoopAtAllStores` / `isPintAtAllStores` / `isSandwichAtAllStores` for all-location highlight derivation
    - `getAllStores` as a base for single-location detection if serving-specific logic is not enough on its own
  - Missing today:
    - no pure helper for “default browse state” detection
    - no pure helper for Vancouver-calendar-day freshness semantics from `metadata.lastUpdatedAt`
    - no shared freshness label/copy helper
    - no shared helper for objective highlight bucket derivation in fixed order (`all-locations`, `vegan`, `single-location`)
    - no shared helper that returns already-alphabetized browse results

- Test and config paths relevant to `npm run test`:
  - `tests/flavor-logic.test.ts`: direct unit coverage for `normalizeFlavorSearchText`, `getStoresForServingType`, `flavorMatchesVisualizationFilters`, and `getStoreServingAvailability`.
  - `tests/flavor-data.test.ts`: data/helper coverage for metadata timestamp validity, vegan helper outputs, store-serving getters, sandwich/ice-cream separation, current sandwich inventory snapshot, and `searchFlavors` behavior.
  - `tests/scrape-flavors.test.ts`: scrape/update-oriented coverage for source timestamp extraction and update comparison plus serving-type separation in generated data.
  - `tsconfig.test.json`: includes `src/data/flavors.ts`, `src/data/flavors.json`, `src/data/metadata.json`, `src/data/stores.ts`, `src/lib/flavor-logic.ts`, and `tests/**/*.ts` only.
  - `package.json`: `npm test` -> `npm run test:unit`; `test:unit` -> `tsc -p tsconfig.test.json && node --test /tmp/ernest-filter-tests/tests/*.test.js`.

- Current Node coverage map for browse-state planning:
  - Covered now:
    - punctuation-insensitive search normalization
    - serving-specific store selection
    - positive and negative filter matches for some scoop/location cases
    - sandwich selection via `getStoresForServingType`
    - store-level serving availability shaping
    - metadata timestamp parseability
  - Missing now:
    - default browse state detection
    - alphabetical ordering helper behavior
    - any highlight bucket derivation
    - Vancouver-day “today” freshness semantics and fallback copy behavior
    - `veganOnly: true` assertions inside `flavorMatchesVisualizationFilters`
    - richer combined-filter scenarios
    - explicit main-predicate sandwich-filter assertions beyond serving-store selection helper coverage

## 2026-04-12 shell context research

- Exact shell composition paths:
  - `src/App.tsx`: root shell order is `Navigation` -> `BuyMeACoffeeWidget` -> `BuyMeAnIceCreamFallback` -> `<main className="pt-16">` -> `Footer`.
  - `src/components/custom/Navigation.tsx`: fixed top navigation, freshness chip, theme toggle.
  - `src/sections/Footer.tsx`: compact attribution/source footer.
  - `src/components/custom/SearchFilterBar.tsx`: `FlavorDataNotice` holds the unofficial/disclaimer-style notice and schedule copy.
  - `src/sections/CoreFlavors.tsx`: renders `FlavorDataNotice` above `SearchFilterBar`, so disclaimer/freshness messaging currently starts inside page content rather than the footer.
  - `src/data/metadata.json`: freshness source for `lastUpdatedAt` and official source URL.
  - `src/hooks/useTheme.ts`: theme toggle wiring persists `theme` in `localStorage` and toggles the document `dark` class.
  - `src/index.css` and `tailwind.config.js`: semantic tokens and reusable shell styling primitives.

- Fixed navigation behavior:
  - `Navigation` uses `fixed top-0 left-0 right-0 z-50` and a scroll listener with threshold `window.scrollY > 50`.
  - Top-of-page state is transparent; scrolled state adds `bg-background/80 backdrop-blur-lg shadow-soft`.
  - Content is offset by `App.tsx` with `main.pt-16`, matching the nav `h-16` layout.
  - The left side is only a logo/title anchor that smooth-scrolls to top.
  - The right side contains the freshness chip plus the icon-only theme toggle.

- Freshness/disclaimer placement and mobile vs desktop behavior:
  - Freshness chip copy is `Updated {lastUpdatedDate}` in `Navigation.tsx`, derived from `metadata.lastUpdatedAt` formatted in Vancouver time.
  - The nav freshness chip is desktop-only because it uses `hidden ... sm:inline-flex`; there is no nav freshness affordance on mobile.
  - Disclaimer-style copy is in `FlavorDataNotice` (`SearchFilterBar.tsx`): `This is an unofficial fan-made website. Not affiliated with Earnest Ice Cream.` plus `Data refreshes daily at 1:00 PM and 4:30 PM Vancouver time`.
  - `FlavorDataNotice` is rendered for all breakpoints in `CoreFlavors.tsx`; its layout changes from stacked to wrapped inline at `sm`, but the same copy appears on mobile and desktop.
  - Footer copy is only `Made with heart for ice cream lovers` plus `Data sourced daily from earnesticecream.com`; it does not currently render the unofficial/fan-made disclaimer.

- Support CTA treatment:
  - `BuyMeACoffeeWidget` in `App.tsx` injects the external BMC script on mount, guarded only by checking for an existing `script[data-name="BMC-Widget"]`.
  - The widget is configured with `data-position="Right"`, `data-x_margin="18"`, and `data-y_margin="18"`, so it behaves like a persistent right-side floating overlay.
  - `BuyMeAnIceCreamFallback` also renders unconditionally in `App.tsx` as a separate `fixed bottom-[18px] right-[18px] z-50` rounded button linking to the same support page.
  - Neither support layer depends on props, route state, or viewport state; both are global shell overlays.

- Footer structure:
  - `Footer.tsx` uses `bg-foreground text-background py-4` with a shared shell container `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
  - Inner layout is `flex flex-col items-center justify-center gap-2 ... sm:flex-row sm:gap-3`, so mobile stacks vertically and desktop becomes a single centered row.
  - The divider `|` is desktop-only via `hidden ... sm:inline`.
  - Footer attribution and source link are low-volume and centered, with no support link, disclaimer block, or freshness timestamp detail.

- Reusable styling tokens/utilities for a calmer editorial hierarchy:
  - Semantic colors already exposed: `background`, `foreground`, `muted`, `muted-foreground`, `border`, `primary`, `secondary`, `accent`, `card`, `ring`.
  - Brand palette already available: `marshmallow.*`, `cereal.*`, `store.*`, `mint`, `lavender`, `peach`, `chocolate`.
  - Typography tokens: `font-heading` (Quicksand) and `font-body` (Nunito).
  - Radius tokens: `lg`, `xl`, `2xl`, `3xl` from `--radius`.
  - Shadow tokens: `shadow-xs`, `shadow-soft`, `shadow-soft-lg`, `shadow-glow`.
  - Utility surfaces: `.glass`, `.glass-dark`, `.gradient-marshmallow`, `.gradient-cereal`, `.text-balance`.
  - Existing shell/container rhythm already reused across nav, content, and footer: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.

## 2026-04-12 app-shell hierarchy implementation

- `src/App.tsx` now removes both persistent support overlay paths entirely, leaving the shell as `Navigation -> main -> Footer` and increasing the `main` top offset to `pt-32 sm:pt-28` so the expanded fixed header does not overlap content.
- `src/components/custom/Navigation.tsx` keeps the existing `useTheme` wiring intact while shifting freshness/disclaimer semantics into a fixed secondary rail that stays visible on both mobile and desktop. The rail reuses semantic surfaces (`bg-muted/70`, `bg-background/80`, `border-border`, `shadow-xs`) instead of introducing new color tokens.
- `Navigation.tsx` reuses the existing freshness helper from `src/lib/flavor-browser.ts` (`getFreshnessLabel`) rather than duplicating Vancouver-date logic inline.
- `src/sections/Footer.tsx` now carries the calmer support treatment: source attribution remains present, the unofficial/fan-made disclaimer is explicit, and the support link is a low-emphasis text link instead of a floating CTA.
- Support CTA placement is now shell-consistent: no support affordance floats over the browse surface, and the only remaining Buy Me a Coffee link lives in the footer.

## 2026-04-12 - Browse helper implementation

- Added `src/lib/flavor-browser.ts` as the shared browse-state contract for this wave. It now owns:
  - canonical `ServingType` and `FilterState`
  - `DEFAULT_BROWSE_FILTERS` and `isDefaultBrowseState`
  - pure Vancouver-day freshness helpers (`getVancouverDayKey`, `isSameVancouverDay`, `formatVancouverDate`, `getFreshnessLabel`)
  - reusable alphabetical ordering (`sortFlavorsAlphabetically`)
  - browse filtering + ordering composition (`getBrowseResults`)
  - objective highlight derivation (`deriveObjectiveHighlightBuckets`) in fixed order `all-locations -> vegan -> single-location`

- To avoid a third `ServingType` copy, `SearchFilterBar.tsx` now re-exports the shared types from `src/lib/flavor-browser.ts`, while `src/lib/flavor-logic.ts` imports the shared `ServingType` type and aliases its filter contract to the shared `FilterState`.

- `deriveObjectiveHighlightBuckets` stays objective-only by using existing repo properties already available on each flavor:
  - serving-specific store availability via `getStoresForServingType`
  - vegan status via `flavor.isVegan`
  - canonical store coverage via `src/data/stores.ts`
  - no popularity, featured, or subjective ranking inputs were introduced.

- `CoreFlavors.tsx` now consumes `DEFAULT_BROWSE_FILTERS` and `getBrowseResults`, which removes duplicated default-state values and lifts alphabetical sorting out of the section component into a reusable browse helper.

- `Navigation.tsx` now uses the shared freshness helper, so Vancouver-calendar-day "today" semantics and fallback date formatting are centralized instead of living inline in the nav component.

- `tests/flavor-browser.test.ts` covers the new contracts directly: default browse state detection, Vancouver-day same-day behavior, fallback freshness labeling, alphabetical ordering, objective highlight ordering with omitted empty buckets, and a combined `location + veganOnly` browse filter case.
