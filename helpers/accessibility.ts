import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

/** WCAG 2.1 level A and AA rules: the standard most accessibility requirements refer to. */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** Runs axe-core on the current page against WCAG 2.1 A/AA and returns the full results. */
export async function scanAccessibility(page: Page) {
  return new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
}
