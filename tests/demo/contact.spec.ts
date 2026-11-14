import { test, expect } from '../../fixtures/test';

test.describe('Demo app – contact form', () => {
  test.beforeEach(async ({ contactPage }) => {
    await contactPage.goto();
  });

  test('page is served by the local web server @smoke', async ({ page, contactPage }) => {
    await expect(page).toHaveTitle('Demo App – Contact');
    await expect(contactPage.heading).toHaveText('Contact us');
  });

  test('valid submission shows a confirmation with the name', async ({ contactPage }) => {
    await contactPage.submit({ name: 'Ada', email: 'ada@example.com', message: 'Hello!' });

    await expect(contactPage.success).toHaveText('Thanks, Ada! We will reply soon.');
    await expect(contactPage.submitButton).toBeHidden();
  });

  test('missing required fields shows an error and no confirmation', async ({ contactPage }) => {
    await contactPage.submit({ name: '', email: '' });

    await expect(contactPage.error).toHaveText('Name and email are required.');
    await expect(contactPage.success).toBeHidden();
  });
});
