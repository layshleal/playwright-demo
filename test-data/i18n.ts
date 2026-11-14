// Translation files of the demo app, shared by the app (fetch) and the tests (import).
import en from '../demo-app/i18n/en.json';
import it from '../demo-app/i18n/it.json';
import pt from '../demo-app/i18n/pt.json';

/** English is the reference locale: every other locale must have the same keys. */
export type Messages = typeof en;
export type Locale = 'en' | 'it' | 'pt';

export const locales: Record<Locale, Record<string, string>> = { en, it, pt };
export const localeCodes = Object.keys(locales) as Locale[];

/** Keys whose value is legitimately the same as English in a given locale. */
export const SAME_AS_ENGLISH: Partial<Record<Locale, Record<string, string>>> = {
  it: { emailLabel: '"Email" is the standard Italian term' },
};

export function messagesFor(locale: Locale): Messages {
  return locales[locale] as Messages;
}
