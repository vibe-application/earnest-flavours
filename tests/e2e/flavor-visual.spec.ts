import { test, expect, devices } from '@playwright/test';

import { gotoApp, openFlavorDetails } from './helpers';

const iphone13 = devices['iPhone 13'];

const visualVariants = [
  {
    name: 'desktop-light',
    theme: 'light' as const,
    use: {
      viewport: { width: 1440, height: 1200 },
      colorScheme: 'light' as const,
    },
  },
  {
    name: 'desktop-dark',
    theme: 'dark' as const,
    use: {
      viewport: { width: 1440, height: 1200 },
      colorScheme: 'dark' as const,
    },
  },
  {
    name: 'mobile-light',
    theme: 'light' as const,
    use: {
      viewport: iphone13.viewport,
      userAgent: iphone13.userAgent,
      deviceScaleFactor: iphone13.deviceScaleFactor,
      isMobile: iphone13.isMobile,
      hasTouch: iphone13.hasTouch,
      colorScheme: 'light' as const,
    },
  },
  {
    name: 'mobile-dark',
    theme: 'dark' as const,
    use: {
      viewport: iphone13.viewport,
      userAgent: iphone13.userAgent,
      deviceScaleFactor: iphone13.deviceScaleFactor,
      isMobile: iphone13.isMobile,
      hasTouch: iphone13.hasTouch,
      colorScheme: 'dark' as const,
    },
  },
];

for (const variant of visualVariants) {
  test.describe(variant.name, () => {
    test.use(variant.use);

    test('captures the browse surface', async ({ page }) => {
      await gotoApp(page, { theme: variant.theme });

      await expect(page).toHaveScreenshot(`${variant.name}-browse.png`, {
        animations: 'disabled',
        caret: 'hide',
        fullPage: true,
      });
    });

    test('captures the flavor detail sheet', async ({ page }) => {
      await gotoApp(page, { theme: variant.theme });
      await openFlavorDetails(page, 'berry-oat-crumble');

      await expect(page).toHaveScreenshot(`${variant.name}-detail-sheet.png`, {
        animations: 'disabled',
        caret: 'hide',
        fullPage: true,
      });
    });
  });
}
