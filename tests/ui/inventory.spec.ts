import { test, expect } from '../../fixtures/test';
import { PRODUCTS, asPriceLabel } from '../../test-data/products';

// Expected orders come from the known catalogue, not from the page itself:
// web-first assertions then wait until the list is re-rendered in that order.
const pricesAscending = PRODUCTS.map((p) => p.price).sort((a, b) => a - b).map(asPriceLabel);
const namesZtoA = PRODUCTS.map((p) => p.name).sort().reverse();

test.describe('Inventory', () => {
  test('sorts products by price, low to high', async ({ loggedIn }) => {
    await loggedIn.sortBy('lohi');

    await expect(loggedIn.itemPrices).toHaveText(pricesAscending);
  });

  test('sorts products by price, high to low', async ({ loggedIn }) => {
    await loggedIn.sortBy('hilo');

    await expect(loggedIn.itemPrices).toHaveText([...pricesAscending].reverse());
  });

  test('sorts products by name, Z to A', async ({ loggedIn }) => {
    await loggedIn.sortBy('za');

    await expect(loggedIn.itemNames).toHaveText(namesZtoA);
  });

  test('cart badge follows add and remove actions @smoke', async ({ loggedIn }) => {
    await loggedIn.addToCart('Sauce Labs Backpack');
    await loggedIn.addToCart('Sauce Labs Bike Light');
    await expect(loggedIn.cartBadge).toHaveText('2');

    await loggedIn.removeFromCart('Sauce Labs Backpack');
    await expect(loggedIn.cartBadge).toHaveText('1');

    await loggedIn.removeFromCart('Sauce Labs Bike Light');
    await expect(loggedIn.cartBadge).toBeHidden();
  });
});
