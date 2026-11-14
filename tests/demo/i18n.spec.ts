import { test, expect } from '../../fixtures/test';
import { ContactPage } from '../../pages/ContactPage';
import { localeCodes, translationProblems } from '../../test-data/i18n';

test.describe('Translation files', () => {
  test('every locale has the same keys as English, filled in and translated', () => {
    expect(translationProblems()).toEqual([]);
  });
});

for (const locale of localeCodes) {
  test.describe(`Contact form in ${locale.toUpperCase()}`, () => {
    let contact: ContactPage;

    test.beforeEach(async ({ page }) => {
      contact = new ContactPage(page, locale);
      await contact.goto();
    });

    test('valid submission shows the confirmation in the right language', async ({ page }) => {
      await expect(page).toHaveTitle(contact.t.title);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);

      await contact.submit({ name: 'Ada', email: 'ada@example.com' });

      await expect(contact.success).toHaveText(contact.t.success.replace('{name}', 'Ada'));
    });

    test('missing required fields shows the error in the right language', async () => {
      await contact.submit({ name: '', email: '' });

      // translated texts are filled in even while hidden: check visibility, not only text
      await expect(contact.error).toBeVisible();
      await expect(contact.error).toHaveText(contact.t.errorRequired);
      await expect(contact.success).toBeHidden();
    });

    test('no translated text is cut off or overflowing', async () => {
      expect(await contact.overflowingTexts(), 'on page load').toEqual([]);

      await contact.submit({ name: '', email: '' });
      await expect(contact.error).toBeVisible();

      expect(await contact.overflowingTexts(), 'with the error message').toEqual([]);
    });
  });
}
