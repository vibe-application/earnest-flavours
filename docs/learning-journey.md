# Learning Journey

This project ended up being a good example of when a small static app is enough.

## What Worked Well

- Static-first architecture kept the project simple: scrape data ahead of time, bundle it into the app, and deploy as plain files.
- Separating generated data from hand-written logic was the right call: `src/data/flavors.json` is generated, while `src/data/flavors.ts` contains types and helpers.
- Modeling availability as three arrays (`scoopStores`, `pintStores`, `sandwichStores`) matches how the UI actually filters data.
- Running tests inside `npm run build` prevents broken scraped data or logic regressions from reaching GitHub Pages.
- Using shadcn/ui as local source files gives flexibility without fighting a black-box component library.

## Lessons Learned

### 1. Optimize the data shape for reads

The app mostly reads and filters flavor availability. A structure like this is easier to work with than a deeply nested per-store object:

```ts
type Flavor = {
  scoopStores: StoreId[]
  pintStores: StoreId[]
  sandwichStores: StoreId[]
}
```

That makes filter logic straightforward and keeps UI code simple.

### 2. Generated data should stay generated

`src/data/flavors.json` and `src/data/metadata.json` are scraper outputs. Editing generated data by hand creates drift and gets overwritten later.

Best practice:

- Treat the scraper as the source of truth for routine data changes.
- Keep handwritten normalization and helper logic outside generated files.
- Validate scraper output before writing files.

### 3. Scrapers need guardrails, not just extraction logic

The scraper does more than collect text. It also:

- scrapes each serving tab separately
- validates that stores do not return empty scoop or pint lists
- deduplicates flavors by normalized names/slugs
- scrapes official descriptions when possible

That validation is important. Without it, a partial DOM change on the source site could silently wipe data.

### 4. Native Node tests are enough for a project like this

This repo uses `node:test` plus a separate TypeScript test config instead of Jest or Vitest.

Why it works here:

- the core risk is data and filtering logic, not complex UI state
- tests stay dependency-light
- build and CI remain fast

One quirk worth remembering: test files compile to `/tmp/earnest-filter-tests`, and imports use `.js` paths because the test config uses `NodeNext`.

### 5. Static deployment has small but important config details

`vite.config.ts` uses `base: './'`, which matters for GitHub Pages. Without that, asset paths can break under a repo subpath.

This is the kind of small config that is easy to miss and causes confusing production-only failures.

### 6. Scheduled automation needs timezone handling

The daily update workflow uses two UTC cron entries and a Vancouver-time check at runtime to handle DST correctly.

Lesson: if a job must run at a local human time, do not trust a single UTC cron expression to stay correct year-round.

## Best Practices From This Project

- Keep generated content in JSON when the app only needs read access at runtime.
- Put business logic in TypeScript modules that wrap generated data.
- Fail fast in scraping workflows when required sections are missing.
- Put focused logic tests around search, filtering, and derived availability.
- Use strict string unions like `StoreId` for fixed domains.
- Prefer theme tokens like `bg-background` and `text-foreground` over hardcoded colors so light/dark mode stays consistent.
- Keep app-specific UI in `src/components/custom/` and leave generic shadcn primitives in `src/components/ui/`.

## What I Would Reuse Next Time

- A generated JSON data layer with a thin typed wrapper.
- A scraper that validates before overwrite.
- Build pipeline order of `test -> typecheck -> bundle`.
- Static hosting for small content-heavy apps that change on a schedule instead of in real time.

## What I Would Improve Next Time

- Add a few end-to-end tests for the main user flows: search, serving-type filters, location filters, and flavor detail panels.
- Add clearer fixture-based tests for scraper edge cases from real HTML snippets.
- Document the data contract in one place shared by scraper, tests, and UI.
- Keep repo instructions concise; long agent docs become background noise quickly.

## Main Takeaway

For a project with mostly read-only data, a scheduled scraper plus a static frontend is a strong default. The biggest wins came from choosing a simple architecture, validating data aggressively, and shaping the data for the UI instead of for the scraper.
