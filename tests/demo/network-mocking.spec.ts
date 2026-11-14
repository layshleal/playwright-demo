import { test, expect } from '../../fixtures/test';
import { OrderHistoryPage } from '../../pages/OrderHistoryPage';

/**
 * Network mocking with page.route(): every UI state is forced on purpose, instead of
 * hoping the real backend happens to be slow, broken or empty during the test run.
 */

const MOCK_ORDERS = [
  { id: 2001, item: 'Water bottle', status: 'Shipped' },
  { id: 2002, item: 'Sunglasses', status: 'Delivered' },
];

test.describe('Order history – network states', () => {
  let history: OrderHistoryPage;

  test.beforeEach(async ({ page }) => {
    history = new OrderHistoryPage(page);
  });

  test('shows the orders from the real endpoint', async () => {
    await history.goto();

    await expect(history.orders).toHaveText([
      '#1001 – Backpack (Delivered)',
      '#1002 – Bike light (Shipped)',
      '#1003 – Fleece jacket (Processing)',
    ]);
  });

  test('shows the loading state while the API is slow', async ({ page }) => {
    // Hold the response until the test has checked the loading state: no timers involved.
    let release!: () => void;
    const responseCanGo = new Promise<void>((resolve) => (release = resolve));
    await page.route(OrderHistoryPage.ORDERS_API, async (route) => {
      await responseCanGo;
      await route.fulfill({ json: MOCK_ORDERS });
    });

    await history.goto();
    await expect(history.loading).toBeVisible();
    await expect(history.orders).toHaveCount(0);

    release();

    await expect(history.orders).toHaveText(['#2001 – Water bottle (Shipped)', '#2002 – Sunglasses (Delivered)']);
    await expect(history.loading).toBeHidden();
  });

  test('shows an error and recovers with "Try again"', async ({ page }) => {
    let calls = 0;
    await page.route(OrderHistoryPage.ORDERS_API, async (route) => {
      calls += 1;
      // first call fails like a broken backend, the retry succeeds
      await (calls === 1 ? route.fulfill({ status: 500, body: 'Internal Server Error' }) : route.fulfill({ json: MOCK_ORDERS }));
    });

    await history.goto();
    // toBeVisible matters: these messages are always in the HTML, only hidden
    await expect(history.error).toBeVisible();
    await expect(history.error).toContainText('Could not load your orders.');
    await expect(history.orders).toHaveCount(0);

    await history.retryButton.click();

    await expect(history.orders).toHaveCount(MOCK_ORDERS.length);
    await expect(history.error).toBeHidden();
    expect(calls).toBe(2);
  });

  test('shows the empty state when there are no orders', async ({ page }) => {
    await page.route(OrderHistoryPage.ORDERS_API, (route) => route.fulfill({ json: [] }));

    await history.goto();

    await expect(history.empty).toBeVisible();
    await expect(history.empty).toHaveText('You have no orders yet.');
    await expect(history.orders).toHaveCount(0);
    await expect(history.error).toBeHidden();
  });

  test('shows an error when the network request fails', async ({ page }) => {
    await page.route(OrderHistoryPage.ORDERS_API, (route) => route.abort('internetdisconnected'));

    await history.goto();

    await expect(history.error).toBeVisible();
    await expect(history.retryButton).toBeEnabled();
  });
});
