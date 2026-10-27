import { getLocales } from 'react-native-localize';

import { Locale, StringKey, strings } from './strings';

const SUPPORTED_LOCALES = Object.keys(strings) as Locale[];

export const resolveLocale = (): Locale => {
  const match = getLocales().find((locale) =>
    SUPPORTED_LOCALES.includes(locale.languageCode as Locale),
  );
  return (match?.languageCode as Locale) ?? 'en';
};

export type Translate = (key: StringKey, params?: Record<string, string | number>) => string;

// `{name}` placeholders in a string are replaced by params.name.
export const useLocale = () => {
  const locale = resolveLocale();
  const t: Translate = (key, params) => {
    const text: string = strings[locale][key] ?? strings.en[key];
    if (!params) {
      return text;
    }
    return Object.keys(params).reduce(
      (result, name) => result.split(`{${name}}`).join(String(params[name])),
      text,
    );
  };
  return { locale, t };
};
