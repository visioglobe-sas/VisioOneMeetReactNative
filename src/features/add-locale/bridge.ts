import * as React from 'react';

import { useMapBridge, useMapEvent } from '../../bridge/MapBridge';

// Answer to 'add_locale': each key of the page's fixed Spanish dictionary, read back
// via venue.translator.translate(key, 'es') right after addLocale -- the primary proof
// the round trip succeeded, independent of whether any SDK UI text is visible.
export interface AddLocaleResult {
  translations: Record<string, string>;
}

export const useAddLocaleBridge = () => {
  const { send } = useMapBridge();
  const [addLocaleResult, setAddLocaleResult] = React.useState<AddLocaleResult | null>(null);

  useMapEvent('locale_added', (data) => setAddLocaleResult({ translations: data?.translations ?? {} }));

  return {
    addLocaleResult,
    // venue.translator.addLocale('es', resources) -- a locale never authored in
    // VisioMapEditor for this map. The dictionary itself lives on the page side.
    addLocale: () => send('add_locale'),
  };
};
