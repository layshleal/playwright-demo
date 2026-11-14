import { type Locator, type Page } from '@playwright/test';

/** Recent orders page of the demo app: the list arrives after a variable delay. */
export class OrdersPage {
  readonly loading: Locator;
  readonly orders: Locator;

  constructor(private readonly page: Page) {
    this.loading = page.getByTestId('loading');
    this.orders = page.getByTestId('orders').getByRole('listitem');
  }

  /** @param delayMs force the simulated API response time; random (usually 0, sometimes 500 ms) if omitted */
  async goto(delayMs?: number) {
    await this.page.goto(delayMs === undefined ? '/orders.html' : `/orders.html?delay=${delayMs}`);
  }
}
