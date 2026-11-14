import { test as base, expect as baseExpect } from '@playwright/test';
import { z } from 'zod';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { ContactPage } from '../pages/ContactPage';
import { PASSWORD, users } from '../test-data/users';

export const expect = baseExpect.extend({
  /** Validates a value (e.g. an API response body) against a zod schema, with a readable diff on failure. */
  toMatchSchema(received: unknown, schema: z.ZodType) {
    const result = schema.safeParse(received);
    return {
      name: 'toMatchSchema',
      pass: result.success,
      message: () =>
        result.success
          ? 'Expected value not to match the schema, but it did.'
          : `Value does not match the schema:\n${z.prettifyError(result.error)}\n\nReceived:\n${JSON.stringify(received, null, 2)}`,
    };
  },
});

type Pages = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  /** Contact form of the local demo app */
  contactPage: ContactPage;
  /** Inventory page already logged in as standard_user */
  loggedIn: InventoryPage;
};

export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  contactPage: async ({ page }, use) => use(new ContactPage(page)),

  loggedIn: async ({ page, loginPage, inventoryPage }, use) => {
    await loginPage.goto();
    await loginPage.login(users.standard, PASSWORD);
    await expect(page).toHaveURL(/inventory\.html/);
    await use(inventoryPage);
  },
});
