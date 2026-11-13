import { test, expect } from '../../fixtures/test';
import { PASSWORD, users } from '../../test-data/users';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('standard user logs in and sees the product list @smoke', async ({ page, loginPage, inventoryPage }) => {
    await loginPage.login(users.standard, PASSWORD);

    await expect(page).toHaveURL(/inventory\.html/);
    await expect(inventoryPage.title).toHaveText('Products');
    await expect(inventoryPage.items).toHaveCount(6);
  });

  test('locked out user sees a clear error', async ({ loginPage }) => {
    await loginPage.login(users.lockedOut, PASSWORD);

    await expect(loginPage.error).toContainText('this user has been locked out');
  });

  const invalidCases = [
    { name: 'empty username', user: '', pass: PASSWORD, message: 'Username is required' },
    { name: 'empty password', user: users.standard, pass: '', message: 'Password is required' },
    { name: 'wrong password', user: users.standard, pass: 'wrong', message: 'do not match any user' },
  ];

  for (const { name, user, pass, message } of invalidCases) {
    test(`shows validation error: ${name}`, async ({ loginPage }) => {
      await loginPage.login(user, pass);
      await expect(loginPage.error).toContainText(message);
    });
  }

  test('protected page redirects to login when not authenticated', async ({ page, loginPage }) => {
    await page.goto('/inventory.html');

    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.error).toContainText("You can only access '/inventory.html' when you are logged in");
  });
});
