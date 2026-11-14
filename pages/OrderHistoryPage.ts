import { type Locator, type Page } from '@playwright/test';

/** Order history page of the demo app: loads its data from GET api/orders.json. */
export class OrderHistoryPage {
  /** URL pattern of the orders endpoint, for page.route() */
  static readonly ORDERS_API = '**/api/orders.json';

  readonly loading: Locator;
  readonly error: Locator;
  readonly retryButton: Locator;
  readonly empty: Locator;
  readonly orders: Locator;

  constructor(private readonly page: Page) {
    this.loading = page.getByTestId('loading');
    this.error = page.getByTestId('error');
    this.retryButton = page.getByRole('button', { name: 'Try again' });
    this.empty = page.getByTestId('empty');
    this.orders = page.getByRole('list', { name: 'Orders' }).getByRole('listitem');
  }

  async goto() {
    await this.page.goto('/order-history.html');
  }
}
