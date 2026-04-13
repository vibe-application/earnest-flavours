import { test, expect } from '@playwright/test';

import {
  expectVisibleResultIds,
  gotoApp,
  openFlavorDetails,
  pressTabUntilFocused,
} from './helpers';

test('shows the default browse state against deterministic fixture data', async ({ page }) => {
  await gotoApp(page);

  await expect(page.getByTestId('highlight-all-locations')).toBeVisible();
  await expect(page.getByTestId('highlight-vegan')).toBeVisible();
  await expect(page.getByTestId('highlight-single-location')).toBeVisible();
  await expect(page.getByTestId('browse-results-summary')).toHaveCount(0);
  await expectVisibleResultIds(page, [
    'almond-brittle',
    'berry-oat-crumble',
    'caramel-ripple',
    'toasted-vanilla',
  ]);
});

test('filters by search query with stable result selectors', async ({ page }) => {
  await gotoApp(page);

  await page.getByTestId('hero-search-input').fill('berry');

  await expect(page.getByTestId('browse-results-summary')).toBeVisible();
  await expect(page.getByTestId('highlight-all-locations')).toHaveCount(0);
  await expectVisibleResultIds(page, ['berry-oat-crumble']);
});

test('switches serving type without relying on live scraped data', async ({ page }) => {
  await gotoApp(page);

  await page.getByTestId('serving-filter').getByRole('button', { name: 'Pint' }).click();

  await expect(page.getByTestId('highlight-all-locations')).toBeVisible();
  await expectVisibleResultIds(page, ['almond-brittle', 'berry-oat-crumble', 'caramel-ripple']);
  await expect(page.getByTestId('availability-caramel-ripple-frances-pint')).toContainText('Frances');
});

test('filters by location and vegan-only toggle', async ({ page }) => {
  await gotoApp(page);

  await page.getByTestId('location-filter').getByRole('button', { name: /Frances/i }).click();
  await expect(page.getByTestId('browse-results-summary')).toBeVisible();
  await expectVisibleResultIds(page, ['almond-brittle', 'toasted-vanilla']);

  await page.getByTestId('clear-filters').click();
  await page.getByTestId('vegan-toggle').click();
  await expectVisibleResultIds(page, ['berry-oat-crumble']);
});

test('shows the empty state and can reset back to the default browse list', async ({ page }) => {
  await gotoApp(page);

  await page.getByTestId('hero-search-input').fill('nonexistent swirl');

  await expect(page.getByTestId('flavor-empty-state')).toBeVisible();
  await page.getByTestId('empty-state-reset').click();
  await expect(page.getByTestId('flavor-empty-state')).toHaveCount(0);
  await expectVisibleResultIds(page, [
    'almond-brittle',
    'berry-oat-crumble',
    'caramel-ripple',
    'toasted-vanilla',
  ]);
});

test('opens and closes the detail sheet with serving-aware store availability', async ({ page }) => {
  await gotoApp(page);

  await page.getByTestId('serving-filter').getByRole('button', { name: 'Pint' }).click();
  await openFlavorDetails(page, 'berry-oat-crumble');

  await expect(page.getByTestId('flavor-detail-sheet')).toContainText('Pint is currently listed only at Fraser St.');
  await expect(page.getByTestId('detail-store-fraser')).toContainText('Pint');
  await expect(page.getByTestId('detail-store-quebec')).toContainText('Scoop');
  await expect(page.getByTestId('detail-store-quebec')).not.toContainText('Pint');

  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByTestId('flavor-detail-sheet')).toHaveCount(0);
});

test.describe('reduced motion keyboard coverage', () => {
  test('supports keyboard search, toggle, detail open, and escape close', async ({ page }) => {
    await gotoApp(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const searchInput = page.getByTestId('hero-search-input');
    await pressTabUntilFocused(page, searchInput);
    await page.keyboard.type('berry');
    await expectVisibleResultIds(page, ['berry-oat-crumble']);

    const veganToggle = page.getByTestId('vegan-toggle');
    await pressTabUntilFocused(page, veganToggle);
    await page.keyboard.press('Space');

    const detailsButton = page
      .getByTestId('flavor-result-berry-oat-crumble')
      .getByRole('button', { name: 'View details' });
    await pressTabUntilFocused(page, detailsButton);
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('flavor-detail-sheet')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('flavor-detail-sheet')).toHaveCount(0);
  });
});
