/** saucedemo.com catalogue as shown to standard_user (checked against the live site). */
export const PRODUCTS = [
  { name: 'Sauce Labs Backpack', price: 29.99 },
  { name: 'Sauce Labs Bike Light', price: 9.99 },
  { name: 'Sauce Labs Bolt T-Shirt', price: 15.99 },
  { name: 'Sauce Labs Fleece Jacket', price: 49.99 },
  { name: 'Sauce Labs Onesie', price: 7.99 },
  { name: 'Test.allTheThings() T-Shirt (Red)', price: 15.99 },
];

/** Prices as rendered on the page, e.g. 7.99 -> "$7.99". */
export const asPriceLabel = (price: number) => `$${price.toFixed(2)}`;
