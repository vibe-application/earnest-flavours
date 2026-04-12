import { expect, type Locator, type Page } from '@playwright/test';

import { earnestTestData } from './fixtures/ernest-test-data';

export async function gotoApp(
  page: Page,
  options: {
    theme?: 'light' | 'dark';
  } = {},
) {
  const theme = options.theme ?? 'light';

  await page.addInitScript(
    ({ data, selectedTheme }) => {
      const runtimeWindow = window as Window & {
        __ERNEST_TEST_DATA__?: typeof data;
      };

      window.localStorage.setItem('theme', selectedTheme);
      runtimeWindow.__ERNEST_TEST_DATA__ = data;
      document.documentElement.classList.toggle('dark', selectedTheme === 'dark');
    },
    { data: earnestTestData, selectedTheme: theme },
  );

  await page.goto('/');
  await expect(page.getByTestId('hero-search-input')).toBeVisible();
  await expect(page.getByTestId('flavor-result-list')).toBeVisible();
}

export async function expectVisibleResultIds(page: Page, flavorIds: string[]) {
  await expect(page.locator('article[data-testid^="flavor-result-"]')).toHaveCount(flavorIds.length);

  for (const flavorId of flavorIds) {
    await expect(page.getByTestId(`flavor-result-${flavorId}`)).toBeVisible();
  }
}

export async function openFlavorDetails(page: Page, flavorId: string) {
  await page
    .getByTestId(`flavor-result-${flavorId}`)
    .getByRole('button', { name: 'View details' })
    .click();

  await expect(page.getByTestId('flavor-detail-sheet')).toBeVisible();
}

export async function pressTabUntilFocused(page: Page, locator: Locator, maxTabs = 20) {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press('Tab');

    if (await locator.evaluate((element) => element === document.activeElement)) {
      await expect(locator).toBeFocused();
      return;
    }
  }

  throw new Error(`Unable to focus target after ${maxTabs} Tab presses.`);
}
