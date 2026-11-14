import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';

/**
 * Describes the focus indicator of an element as the browser draws it right now
 * (call it while the element has keyboard focus). Empty string = no visible indicator.
 */
export async function focusIndicator(locator: Locator): Promise<string> {
  return locator.evaluate((el) => {
    const style = getComputedStyle(el);
    const outline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
    const shadow = style.boxShadow !== 'none';
    return [outline ? `outline ${style.outlineStyle} ${style.outlineWidth}` : '', shadow ? `box-shadow ${style.boxShadow}` : '']
      .filter(Boolean)
      .join(', ');
  });
}

/** WCAG 2.1 level A and AA rules: the standard most accessibility requirements refer to. */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** Runs axe-core on the current page against WCAG 2.1 A/AA and returns the full results. */
export async function scanAccessibility(page: Page) {
  return new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
}
