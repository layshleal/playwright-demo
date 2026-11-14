import { test, expect } from '../../fixtures/test';
import { ContactPage } from '../../pages/ContactPage';

/**
 * Visual regression: compares screenshots against reviewed baseline images.
 *
 * Baselines are generated on Linux in CI (workflow "Update visual baselines"), because
 * fonts and anti-aliasing differ between operating systems. On other systems the tests
 * are skipped instead of failing on pixel noise.
 */

test.describe('Visual regression @visual', () => {
  test.skip(process.platform !== 'linux', 'Visual baselines are Linux-only (generated in CI)');

  test('contact form in English', async ({ page }) => {
    const contact = new ContactPage(page, 'en');
    await contact.goto();

    await expect(page).toHaveScreenshot('contact-en.png');
  });

  test('validation error in Italian', async ({ page }) => {
    const contact = new ContactPage(page, 'it');
    await contact.goto();
    await contact.submit({ name: '', email: '' });
    await expect(contact.error).toBeVisible();

    await expect(page).toHaveScreenshot('contact-it-error.png');
  });

  test('confirmation message in Portuguese', async ({ page }) => {
    const contact = new ContactPage(page, 'pt');
    await contact.goto();
    await contact.submit({ name: 'Ada', email: 'ada@example.com' });
    await expect(contact.success).toBeVisible();

    await expect(page).toHaveScreenshot('contact-pt-success.png');
  });
});
