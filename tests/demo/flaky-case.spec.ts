import { test, expect } from '../../fixtures/test';
import { OrdersPage } from '../../pages/OrdersPage';

/**
 * Companion tests for docs/flaky-case.md.
 *
 * The orders list usually renders immediately, but about 1 in 5 page loads it arrives 500 ms later.
 * The flaky version is kept on purpose, switched off by default so CI stays trustworthy.
 * Reproduce it with:  SHOW_FLAKY=1 npx playwright test flaky-case --project=demo --repeat-each=30
 */

const EXPECTED_ORDERS = 3;

test.describe('Flaky case – recent orders', () => {
  let ordersPage: OrdersPage;

  test.beforeEach(async ({ page }) => {
    ordersPage = new OrdersPage(page);
  });

  test('FLAKY: reads the list once, without waiting', async () => {
    test.skip(!process.env.SHOW_FLAKY, 'Deliberately flaky, see docs/flaky-case.md (set SHOW_FLAKY=1 to run)');

    await ordersPage.goto();

    // BUG: count() is a one-off snapshot. If the API is slow, the list is still empty here.
    const count = await ordersPage.orders.count();
    expect(count).toBe(EXPECTED_ORDERS);
  });

  test('fixed: web-first assertion waits for the list', async () => {
    await ordersPage.goto();

    // toHaveCount() retries until the list has 3 items (or the expect timeout is reached)
    await expect(ordersPage.orders).toHaveCount(EXPECTED_ORDERS);
    await expect(ordersPage.loading).toBeHidden();
  });

  test('fixed: still passes when the API is slow (worst case forced)', async () => {
    // deterministic regression test: always takes the slow path that used to break the test
    await ordersPage.goto(1_500);

    await expect(ordersPage.orders).toHaveCount(EXPECTED_ORDERS);
    await expect(ordersPage.orders.first()).toHaveText('#1001 – Backpack');
  });
});
