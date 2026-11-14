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

/**
 * Compares every locale with English and lists what is wrong: missing, empty, untranslated
 * (unless allowed in SAME_AS_ENGLISH) or extra keys, and placeholders like {name} that were lost.
 */
export function translationProblems(): string[] {
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

      for (const placeholder of en[key].match(/\{\w+\}/g) ?? []) {
        if (value && !value.includes(placeholder)) problems.push(`${locale}.${key}: lost ${placeholder}`);
      }
    }
    for (const key of Object.keys(messages)) {
      if (!(key in en)) problems.push(`${locale}.${key}: extra key not in English`);
    }
  }

  return problems;
}
