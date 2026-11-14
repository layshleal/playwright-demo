import { test, expect } from '../../fixtures/test';
import { focusIndicator } from '../../helpers/accessibility';

/**
 * Keyboard-only use of the contact form: the part of accessibility axe cannot check.
 * WCAG 2.1.1 (keyboard), 2.4.3 (focus order), 2.4.7 (focus visible), 4.1.3 (status messages).
 */

test.describe('Keyboard navigation – contact form', () => {
  test.beforeEach(async ({ contactPage }) => {
    await contactPage.goto();
  });

  test('Tab reaches every control in visual order', async ({ page, contactPage }) => {
    for (const stop of contactPage.tabStops()) {
      await page.keyboard.press('Tab');
      await expect(stop).toBeFocused();
    }
  });

  test('every Tab stop shows a visible focus indicator', async ({ page, contactPage }) => {
    const indicators: { element: string; indicator: string }[] = [];

    for (const stop of contactPage.tabStops()) {
      await page.keyboard.press('Tab');
      await expect(stop).toBeFocused();
      indicators.push({ element: await stop.evaluate((el) => el.outerHTML.slice(0, 60)), indicator: await focusIndicator(stop) });
    }

    const missing = indicators.filter((i) => i.indicator === '').map((i) => i.element);
    expect(missing, 'elements without a visible focus indicator').toEqual([]);
  });

  test('the form can be filled and sent with the keyboard only', async ({ page, contactPage }) => {
    // Tab past the three language links to the first field
    for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
    await expect(contactPage.name).toBeFocused();

    await page.keyboard.type('Ada');
    await page.keyboard.press('Tab');
    await page.keyboard.type('ada@example.com');
    await page.keyboard.press('Enter');

    await expect(contactPage.success).toBeVisible();
    await expect(contactPage.success).toHaveText('Thanks, Ada! We will reply soon.');
  });

  test('a keyboard submit with empty fields announces the error', async ({ page, contactPage }) => {
    for (let i = 0; i < 7; i++) await page.keyboard.press('Tab');
    await expect(contactPage.submitButton).toBeFocused();

    await page.keyboard.press('Enter');

    // role="alert" makes screen readers announce the message without moving focus
    await expect(contactPage.error).toBeVisible();
    await expect(contactPage.error).toHaveAttribute('role', 'alert');
    await expect(contactPage.error).toHaveText('Name and email are required.');
  });
});
