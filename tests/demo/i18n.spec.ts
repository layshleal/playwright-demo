import { test, expect } from '../../fixtures/test';
import { ContactPage } from '../../pages/ContactPage';
import { SAME_AS_ENGLISH, localeCodes, locales } from '../../test-data/i18n';

test.describe('Translation files', () => {
  test('every locale has the same keys as English, filled in and translated', () => {
    const en = locales.en;
    const problems: string[] = [];

    for (const locale of localeCodes.filter((l) => l !== 'en')) {
      const messages = locales[locale];
      const allowed = SAME_AS_ENGLISH[locale] ?? {};

      for (const key of Object.keys(en)) {
        const value = messages[key];
        if (value === undefined) problems.push(`${locale}.${key}: missing`);
        else if (value.trim() === '') problems.push(`${locale}.${key}: empty`);
        else if (value === en[key] && !(key in allowed)) problems.push(`${locale}.${key}: not translated ("${value}")`);

        // placeholders like {name} must survive translation
        for (const placeholder of en[key].match(/\{\w+\}/g) ?? []) {
          if (value && !value.includes(placeholder)) problems.push(`${locale}.${key}: lost ${placeholder}`);
        }
      }
      for (const key of Object.keys(messages)) {
        if (!(key in en)) problems.push(`${locale}.${key}: extra key not in English`);
      }
    }

    expect(problems).toEqual([]);
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
