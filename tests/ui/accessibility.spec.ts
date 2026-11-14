import { test, expect } from '../../fixtures/test';
import type { Page, TestInfo } from '@playwright/test';
import { scanAccessibility } from '../../helpers/accessibility';

/**
 * Accessibility checks with axe-core against WCAG 2.1 A/AA rules.
 *
 * - Every scan attaches the full axe result to the HTML report (useful as an audit).
 * - A test fails only on "serious" or "critical" violations.
 * - Known issues of the demo site go in KNOWN_ISSUES with a reason, so the suite
 *   stays green while the problem is documented and tracked.
 */

const BLOCKING_IMPACTS = ['serious', 'critical'];

// rule id -> why it is accepted for now (fill in after the first run)
const KNOWN_ISSUES: Record<string, string> = {};

async function scan(page: Page, testInfo: TestInfo, name: string) {
  const results = await scanAccessibility(page);

  await testInfo.attach(`axe-${name}.json`, {
    body: JSON.stringify(results.violations, null, 2),
    contentType: 'application/json',
  });

  const blocking = results.violations
    .filter((v) => BLOCKING_IMPACTS.includes(v.impact ?? ''))
    .filter((v) => !(v.id in KNOWN_ISSUES))
    .map((v) => `${v.impact}: ${v.id} – ${v.help} (${v.nodes.length} element(s))`);

  expect(blocking, `Accessibility violations on ${name}`).toEqual([]);
}

test.describe('Accessibility (WCAG 2.1 AA)', () => {
  test('login page', async ({ page, loginPage }, testInfo) => {
    await loginPage.goto();
    await scan(page, testInfo, 'login');
  });

  test('login page with error message', async ({ page, loginPage }, testInfo) => {
    await loginPage.goto();
    await loginPage.loginButton.click();
    await expect(loginPage.error).toBeVisible();
    await scan(page, testInfo, 'login-error');
  });

  test('inventory page', async ({ page, loggedIn }, testInfo) => {
    await expect(loggedIn.items.first()).toBeVisible();
    await scan(page, testInfo, 'inventory');
  });

  test('cart page', async ({ page, loggedIn, cartPage }, testInfo) => {
    await loggedIn.addToCart('Sauce Labs Backpack');
    await loggedIn.openCart();
    await expect(cartPage.items).toHaveCount(1);
    await scan(page, testInfo, 'cart');
  });

  test('checkout form', async ({ page, loggedIn, cartPage, checkoutPage }, testInfo) => {
    await loggedIn.addToCart('Sauce Labs Backpack');
    await loggedIn.openCart();
    await cartPage.checkout();
    await expect(checkoutPage.firstName).toBeVisible();
    await scan(page, testInfo, 'checkout');
  });
});
