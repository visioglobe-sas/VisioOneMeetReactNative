import * as React from 'react';

import { useMapBridge, useMapEvent } from '../../bridge/MapBridge';

// Answer to 'get_poi_custom_data'. `found: false` means the id didn't resolve to a POI
// at all; `found: true` with an empty `customData` means the POI resolved but carries
// no CustomData -- both are normal, non-error states.
export interface CustomDataLookupResult {
  placeId: string;
  found: boolean;
  customData: Record<string, string>;
}

// Outcome of the most recent 'refresh_custom_data' round trip
// (venue.refreshCustomData()). `at` is a fresh timestamp on every response so repeating
// the same outcome (e.g. refreshing twice with nothing changed on the server) still
// updates state.
export interface CustomDataRefreshOutcome {
  ok: boolean;
  error: string | null;
  at: number;
}

export const useCustomDataBridge = () => {
  const { send } = useMapBridge();
  const [refresh, setRefresh] = React.useState<CustomDataRefreshOutcome | null>(null);
  const [lookup, setLookup] = React.useState<CustomDataLookupResult | null>(null);

  useMapEvent('custom_data_refreshed', () => setRefresh({ ok: true, error: null, at: Date.now() }));
  useMapEvent('custom_data_refresh_error', (data) =>
    setRefresh({ ok: false, error: String(data?.message ?? data), at: Date.now() }),
  );
  useMapEvent<CustomDataLookupResult>('poi_custom_data_result', setLookup);

  return {
    refresh,
    lookup,
    // (Re)loads all CustomData from the server -- venue.refreshCustomData(). The cache
    // starts empty ({}) until this resolves at least once; answered with
    // 'custom_data_refreshed' or 'custom_data_refresh_error'.
    refreshCustomData: () => send('refresh_custom_data'),
    // venue.getPOICustomData(poi) in the page, answered with 'poi_custom_data_result'.
    getPoiCustomData: (placeId: string) => send('get_poi_custom_data', { placeId }),
  };
};
