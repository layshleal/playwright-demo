import { test, expect } from '../../fixtures/test';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { customer } from '../../test-data/users';

const products = ['Sauce Labs Backpack', 'Sauce Labs Bolt T-Shirt'];

test.describe('Checkout', () => {
  test.beforeEach(async ({ loggedIn, cartPage }) => {
    for (const product of products) {
      await loggedIn.addToCart(product);
    }
    await loggedIn.openCart();
    await expect(cartPage.itemNames).toHaveText(products);
  });

  test('completes a purchase end to end @smoke', async ({ cartPage, checkoutPage }) => {
    await cartPage.checkout();
    await checkoutPage.fillInformation(customer);
    await checkoutPage.finishButton.click();

    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
  });

  test('order summary total equals item total plus tax', async ({ cartPage, checkoutPage }) => {
    await cartPage.checkout();
    await checkoutPage.fillInformation(customer);

    const itemTotal = CheckoutPage.amount(await checkoutPage.itemTotal.textContent());
    const tax = CheckoutPage.amount(await checkoutPage.tax.textContent());
    const total = CheckoutPage.amount(await checkoutPage.total.textContent());

    expect(itemTotal).toBeCloseTo(29.99 + 15.99, 2);
    expect(total).toBeCloseTo(itemTotal + tax, 2);
  });

  test('requires customer information', async ({ cartPage, checkoutPage }) => {
    await cartPage.checkout();
    await checkoutPage.continueButton.click();

    await expect(checkoutPage.error).toContainText('First Name is required');
  });
});
