import * as React from 'react';

import { useMapBridge, useMapEvent } from '../../bridge/MapBridge';

// Answer to 'get_locales' -- venue.translator.allLocales, with 'default' already
// filtered out on the page side (it's a byte-identical duplicate of 'fr' on this
// repo's shared demo map), plus venue.currentLocale so the panel can highlight the
// active one. Both start empty/null until the venue is ready.
export interface LocaleInfo {
  locales: string[];
  currentLocale: string | null;
}

// Shared by runtime-locale and add-locale.
export const useLocalesBridge = () => {
  const { send } = useMapBridge();
  const [localeInfo, setLocaleInfo] = React.useState<LocaleInfo>({ locales: [], currentLocale: null });
  const [error, setError] = React.useState<string | null>(null);

  // Asks for the venue's locales + the current one once the venue is loaded.
  useMapEvent('ready', () => send('get_locales'));
  useMapEvent('locales_result', (data) =>
    setLocaleInfo({ locales: data?.locales ?? [], currentLocale: data?.currentLocale ?? null }),
  );
  useMapEvent('locale_changed', (data) => {
    setError(null);
    setLocaleInfo((prev) => ({ ...prev, currentLocale: data?.currentLocale ?? prev.currentLocale }));
  });
  useMapEvent('locale_change_error', (data) => setError(String(data?.message ?? data)));

  return {
    localeInfo,
    error,
    // venue.setCurrentLocale(locale), async on the SDK side: answered with
    // 'locale_changed' or 'locale_change_error'.
    setLocale: (locale: string) => send('set_locale', { locale }),
  };
};
