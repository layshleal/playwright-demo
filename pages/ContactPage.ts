import { type Locator, type Page, expect } from '@playwright/test';
import { type Locale, type Messages, messagesFor } from '../test-data/i18n';

/** Contact form of the local demo app (demo-app/index.html), in any supported language. */
export class ContactPage {
  readonly t: Messages;
  readonly heading: Locator;
  readonly name: Locator;
  readonly email: Locator;
  readonly message: Locator;
  readonly submitButton: Locator;
  readonly error: Locator;
  readonly success: Locator;

  constructor(
    private readonly page: Page,
    readonly locale: Locale = 'en',
  ) {
    this.t = messagesFor(locale);
    this.heading = page.getByRole('heading', { level: 1 });
    // translated labels: also proves each label is still wired to its field
    this.name = page.getByLabel(this.t.nameLabel, { exact: true });
    this.email = page.getByLabel(this.t.emailLabel, { exact: true });
    this.message = page.getByLabel(this.t.messageLabel, { exact: true });
    this.submitButton = page.getByRole('button', { name: this.t.submit });
    this.error = page.getByTestId('error');
    this.success = page.getByTestId('success');
  }

  async goto() {
    await this.page.goto(`/?lang=${this.locale}`);
    // texts are loaded from a JSON file after the page opens: wait until they are in place
    await expect(this.heading).toHaveText(this.t.heading);
  }

  async submit(data: { name: string; email: string; message?: string }) {
    await this.name.fill(data.name);
    await this.email.fill(data.email);
    if (data.message) await this.message.fill(data.message);
    await this.submitButton.click();
  }

  /** Visible translated elements whose text does not fit (cut off or overflowing). */
  async overflowingTexts(): Promise<string[]> {
    return this.page.locator('[data-i18n]').evaluateAll((elements) =>
      elements
        .filter((el) => el.checkVisibility())
        .filter((el) => el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight)
        .map((el) => `${(el as HTMLElement).dataset.i18n}: "${el.textContent}"`),
    );
  }
}
