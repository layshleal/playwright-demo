import { test, expect } from '../../fixtures/test';
import type { Page } from '@playwright/test';
import { scanAccessibility } from '../../helpers/accessibility';

/**
 * Control tests for the accessibility scan itself.
 *
 * A scan that reports zero violations only means something if we know it can find them.
 * - Positive control: a page with three deliberate violations must report exactly those three,
 *   each one pointing at the element that was broken on purpose.
 * - Negative control: the clean contact page must report none, so the scan is not just noisy.
 */

async function violations(page: Page) {
  return (await scanAccessibility(page)).violations;
}

test.describe('Accessibility scan – control pages', () => {
  test('detects every deliberate violation on the broken page', async ({ page }) => {
    await page.goto('/a11y-broken.html');
    const found = await violations(page);

    // exact list: catches both a missed violation and an unplanned extra one
    expect(found.map((v) => v.id).sort()).toEqual(['button-name', 'color-contrast', 'image-alt']);

    const expectedElement: Record<string, string> = {
      'image-alt': 'image-without-alt',
      'button-name': 'button-without-name',
      'color-contrast': 'low-contrast-text',
    };

    for (const v of found) {
      const html = v.nodes.map((n) => n.html);
      expect(html, `${v.id} should point at the broken element`).toHaveLength(1);
      expect(html[0]).toContain(`data-test="${expectedElement[v.id]}"`);
    }
  });

  test('reports no violations on the clean contact page', async ({ page, contactPage }) => {
    await contactPage.goto();
    await expect(contactPage.heading).toBeVisible();

    const found = await violations(page);

    expect(found.map((v) => `${v.id} – ${v.help}`)).toEqual([]);
  });
});
