import { type Locator, type Page } from '@playwright/test';

/** Contact form of the local demo app (demo-app/index.html). */
export class ContactPage {
  readonly heading: Locator;
  readonly name: Locator;
  readonly email: Locator;
  readonly message: Locator;
  readonly submitButton: Locator;
  readonly error: Locator;
  readonly success: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.name = page.getByLabel('Name');
    this.email = page.getByLabel('Email');
    this.message = page.getByLabel('Message');
    this.submitButton = page.getByRole('button', { name: 'Send' });
    this.error = page.getByTestId('error');
    this.success = page.getByTestId('success');
  }

  async goto() {
    await this.page.goto('/');
  }

  async submit(data: { name: string; email: string; message?: string }) {
    await this.name.fill(data.name);
    await this.email.fill(data.email);
    if (data.message) await this.message.fill(data.message);
    await this.submitButton.click();
  }
}
