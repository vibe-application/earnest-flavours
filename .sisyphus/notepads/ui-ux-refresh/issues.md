# Issues

## 2026-04-12 - Browse-state research risks and gotchas

- `ServingType` is declared twice (`src/components/custom/SearchFilterBar.tsx` and `src/lib/flavor-logic.ts`). Task 1 should avoid introducing a third copy; otherwise serving-type drift becomes likely.

- `FilterState` lives in a UI component file today. If Task 1 centralizes browse-state helpers in a new logic module, either the UI contract must be imported from logic or a shared type module must be introduced carefully to avoid circular imports.

- Freshness formatting is currently split from freshness semantics. `Navigation.tsx` already formats dates in `America/Vancouver`, but there is no reusable helper that decides whether a timestamp counts as “today” on the Vancouver calendar day. Re-implementing this inline in multiple components would duplicate timezone logic.

- The current `FlavorDataNotice` copy in `SearchFilterBar.tsx` is static schedule text, not metadata-aware freshness text. Any Task 1 semantics work has no existing UI hook besides `Navigation.tsx` and this notice area.

- All-store helpers in `src/data/flavors.ts` currently treat “all stores” as `length === 4`, which depends on the current store count rather than the canonical `stores` list. This is fine for today but brittle if store count changes; single-location/all-location derivation should prefer the canonical store id set.

- `CoreFlavors.tsx` owns the only browse-state defaults right now, and `SearchFilterBar.clearFilters()` separately hardcodes the same defaults. Default-state rules can drift unless a shared default-state helper or constant becomes the single source of truth.

- `npm test` will not see a new browse helper module unless `tsconfig.test.json` is updated. Current include scope covers `src/lib/flavor-logic.ts` only, not arbitrary new modules like `src/lib/flavor-browser.ts`.

- Existing Node coverage does not protect the planned acceptance criteria for Task 1:
  - no tests for default browse-state detection
  - no tests for Vancouver-day freshness fallback semantics
  - no tests for fixed highlight bucket order or omission of empty buckets
  - no tests for alphabetized result helpers as a first-class contract
  - no direct `veganOnly: true` predicate coverage

- The current filtered result ordering is implemented only at the `CoreFlavors.tsx` call site. If highlights/full-list logic are added later without a shared alphabetical helper, ordering can diverge between sections.

## 2026-04-12 shell research risks / gotchas

- Support currently exists in two persistent overlay layers (`BuyMeACoffeeWidget` script + `BuyMeAnIceCreamFallback`). Any plan item that removes the floating CTA needs to account for both render paths, not just the visible fallback button.
- The nav freshness signal is hidden on mobile (`hidden ... sm:inline-flex`), so moving shell emphasis toward freshness will need an explicit mobile treatment rather than assuming the current chip already covers all breakpoints.
- Disclaimer/provenance messaging is split across content and footer: unofficial/fan-made copy lives in `FlavorDataNotice`, while the footer only carries attribution/source. Reframing the shell will likely require redistributing copy rather than only editing `Footer.tsx`.
- `App.tsx` uses `main.pt-16` to compensate for the fixed nav. Any shell height change must keep that offset in sync to avoid content slipping under the header.
- Theme toggle behavior is shell-critical and currently passes from `useTheme` -> `App` -> `Navigation`; the plan can move surrounding layout, but that wiring must stay intact.
- Footer uses an inverted `bg-foreground text-background` treatment. If the calmer hierarchy wants softer or editorially quieter footer emphasis, that contrast choice may need revisiting during implementation.

## 2026-04-12 app-shell verification blockers

- `lsp_diagnostics` could not run for the modified `.tsx` files because `typescript-language-server` is not installed in this environment.
- `npm run lint` currently fails for pre-existing issues outside the shell scope in shared UI files:
  - `src/components/ui/badge.tsx`
  - `src/components/ui/button-group.tsx`
  - `src/components/ui/button.tsx`
  - `src/components/ui/form.tsx`
  - `src/components/ui/navigation-menu.tsx`
  - `src/components/ui/sidebar.tsx`
  - `src/components/ui/toggle.tsx`
- The shell changes still passed the repo build path (`npm run build`), which also ran the unit tests and TypeScript build successfully. The remaining verification gap is the unrelated repo-wide lint debt above.

## 2026-04-12 - Browse helper implementation gotchas

- `lsp_diagnostics` could not run for the modified TypeScript files in this environment because `typescript-language-server` is not installed (`Command not found: typescript-language-server`). Verification fell back to the repo's compile/test/build pipeline instead: `npm run test` and `npm run build` both passed.

- During integration, `CoreFlavors.tsx` briefly imported `getStoresForServingType` from `src/lib/flavor-browser.ts` instead of `src/lib/flavor-logic.ts`. The full build caught this immediately, and the final state keeps serving-store derivation in `flavor-logic` while `flavor-browser` composes higher-level browse helpers on top of it.
