import { getLocales } from 'react-native-localize';

import { Locale, StringKey, strings } from './strings';

const SUPPORTED_LOCALES = Object.keys(strings) as Locale[];

const resolveLocale = (): Locale => {
  const match = getLocales().find((locale) =>
    SUPPORTED_LOCALES.includes(locale.languageCode as Locale),
  );
  return (match?.languageCode as Locale) ?? 'en';
};

export const useLocale = () => {
  const locale = resolveLocale();
  const t = (key: StringKey) => strings[locale][key] ?? strings.en[key];
  return { locale, t };
};
