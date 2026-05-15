import { DEFAULT_LOCALE, type SupportedLocale } from './locale';
import { ptBrMessages, type Messages } from './pt-br';

export { DEFAULT_LOCALE, type SupportedLocale } from './locale';
export { ptBrMessages, type Messages, type ListItemParams, type ListNameParams } from './pt-br';

export function getMessages(_locale?: SupportedLocale): Messages {
  return ptBrMessages;
}

export function resolveLocale(locale?: string): SupportedLocale {
  if (locale === DEFAULT_LOCALE) {
    return DEFAULT_LOCALE;
  }
  return DEFAULT_LOCALE;
}
