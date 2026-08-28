import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { visioOneHtml } from '../assets/visioOneHtml';
import { ClickedPoi, ExploreMode, Position, useVisioMap, VenueBuilding } from '../screens/useVisioMap';

// Replace with a hash of your own venue from https://my.visioglobe.com
// This one points at a Visioglobe demo venue.
const DEMO_MAP_HASH = 'kbae8e6c066cca4b02c2afac2bc963a643d87437a';

type Status = 'loading' | 'ready' | 'error';

export type VisioMapBridge = ReturnType<typeof useVisioMap>;

// Forwarded from the WebView's 'ready'/'floor_changed' messages -- see the buildings
// mapping and the 'currentfloorchanged' listener in visioOneHtml.ts/visioOne.html.
export interface VenueLayoutInfo {
  buildings: VenueBuilding[];
  currentBuildingId?: string;
  currentFloorId?: string;
}

// Result of the WebView resolving both place IDs passed to the simulated-position
// feature's 'resolve_poi_positions' message -- see VisioMapBridge.resolvePositionSimulationPois.
export interface PositionSimulationResolution {
  origin: Position;
  destination: Position;
}

// Result of the WebView resolving the 'get_poi_custom_data' message -- see
// VisioMapBridge.getPoiCustomData. `found: false` means the id didn't resolve to a
// POI at all; `found: true` with an empty `customData` means the POI resolved but
// carries no CustomData -- both are normal, non-error states (see custom-data.md).
export interface CustomDataLookupResult {
  placeId: string;
  found: boolean;
  customData: Record<string, string>;
}

// Outcome of the most recent 'refresh_custom_data' round trip (venue.refreshCustomData()).
// `at` is a fresh timestamp on every response so repeating the same outcome (e.g.
// refreshing twice with nothing changed on the server) still updates state.
export interface CustomDataRefreshOutcome {
  ok: boolean;
  error: string | null;
  at: number;
}

// Response to the 'get_categories' request -- venue.categories mapped down to an
// { id, label } pair each: id is the raw internal identifier used for
// filtering/highlighting, label is the human-readable name resolved via
// venue.translator.translateCategory() for display only. See
// docs/features/category-highlight.md.
export interface CategoryOption {
  id: string;
  label: string;
}

export interface CategoriesResult {
  categories: CategoryOption[];
}

// Result of the WebView resolving a 'create_dynamic_poi' request -- see
// VisioMapBridge.createDynamicPoi. `ok: false` covers three distinct, non-crash
// outcomes distinguished by `reason` (the anchor id didn't resolve to a POI at all,
// the anchor resolved but has no label/marker position to copy, or `newId` is already
// used in the venue -- venue.createPOI's POIAlreadyExistsError). `ok: true` carries
// back the id/text that are now tracked. See docs/features/dynamic-poi-crud.md.
export interface DynamicPoiCreateResult {
  ok: boolean;
  id?: string;
  text?: string;
  reason?: 'anchor_not_found' | 'no_position' | 'duplicate_id' | 'already_tracked';
  message?: string;
}

// Response to the 'get_locales' request -- venue.translator.allLocales, with 'default'
// already filtered out on the WebView side (it's a byte-identical duplicate of 'fr' on
// this repo's shared demo map, see getLocales in visioOneHtml.ts/visioOne.html and
// docs/features/runtime-locale.md), plus venue.currentLocale so the panel can highlight
// the active one. Both start empty/null until the venue is ready.
export interface LocaleInfo {
  locales: string[];
  currentLocale: string | null;
}

// Result of the WebView resolving an 'add_locale' request -- see VisioMapBridge.addLocale
// and docs/features/add-locale.md. `translations` is keyed by the same fixed dictionary
// keys the WebView's addSpanishLocale hardcodes, each value already resolved via
// venue.translator.translate(key, 'es') right after addLocale -- this is the primary
// proof the round trip succeeded, independent of whether any SDK UI text is visible.
// null until the "Add Spanish locale" button has been pressed at least once.
export interface AddLocaleResult {
  translations: Record<string, string>;
}

// Result of the WebView resolving the geofencing feature's 'resolve_geofence_zone'
// message -- a "zone" is just an existing POI's Surface polygon(s), see
// docs/features/geofencing.md. Each entry of `surfaces` is one surface's WGS84
// boundary vertices (a POI can have more than one Surface); the app treats a position
// as "inside" the zone if it falls within any of them.
export interface GeofenceZone {
  placeId: string;
  surfaces: Position[][];
}

interface VisioMapViewProps {
  // Overrides the shared DEMO_MAP_HASH for this screen only -- e.g. the custom-data
  // feature points at a dedicated, already-published map that actually carries
  // CustomData (the shared demo map has none), while every other screen keeps
  // getting DEMO_MAP_HASH by leaving this prop unset. See FeatureScreen.tsx and
  // docs/features/custom-data.md.
  mapHash?: string;
  renderOverlay?: (
    bridge: VisioMapBridge,
    status: Status,
    clickedPois: ClickedPoi[],
    venueLayout: VenueLayoutInfo,
    positionSimulation: {
      resolution: PositionSimulationResolution | null;
      error: string | null;
    },
    customData: {
      refresh: CustomDataRefreshOutcome | null;
      lookup: CustomDataLookupResult | null;
    },
    categories: CategoryOption[],
    dynamicPoiCreateResult: DynamicPoiCreateResult | null,
    locale: { info: LocaleInfo; error: string | null },
    addLocaleResult: AddLocaleResult | null,
    // Forwarded from the WebView's 'ready' message (initial value) and every
    // 'exploremodechanged' event after (see the explore-mode feature) -- kept in sync
    // even when the mode changes from direct camera/map interaction rather than a call
    // to bridge.setExploreMode, same idiom as venueLayout.currentFloorId above.
    exploreMode: ExploreMode,
    // geofencing feature: the currently-loaded zone (an existing POI's Surface
    // polygon(s)) plus the last resolution error, if any -- see
    // docs/features/geofencing.md.
    geofencing: { zone: GeofenceZone | null; error: string | null },
  ) => React.ReactNode;
  // Fired from the WebView's onMessage handler (an event, not during render) so the
  // parent can safely react -- e.g. open its own controls -- without the "setState
  // during a different component's render" pitfall a render-phase call would hit.
  onPoiClick?: (pois: ClickedPoi[]) => void;
}

const VisioMapView = ({ mapHash, renderOverlay, onPoiClick }: VisioMapViewProps) => {
  const [status, setStatus] = React.useState<Status>('loading');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [clickedPois, setClickedPois] = React.useState<ClickedPoi[]>([]);
  const [venueLayout, setVenueLayout] = React.useState<VenueLayoutInfo>({ buildings: [] });
  const [positionSimulationResolution, setPositionSimulationResolution] =
    React.useState<PositionSimulationResolution | null>(null);
  const [positionSimulationError, setPositionSimulationError] = React.useState<string | null>(
    null,
  );
  const [customDataRefresh, setCustomDataRefresh] = React.useState<CustomDataRefreshOutcome | null>(
    null,
  );
  const [customDataLookup, setCustomDataLookup] = React.useState<CustomDataLookupResult | null>(
    null,
  );
  const [categories, setCategories] = React.useState<CategoryOption[]>([]);
  const [dynamicPoiCreateResult, setDynamicPoiCreateResult] =
    React.useState<DynamicPoiCreateResult | null>(null);
  const [localeInfo, setLocaleInfo] = React.useState<LocaleInfo>({
    locales: [],
    currentLocale: null,
  });
  const [localeError, setLocaleError] = React.useState<string | null>(null);
  const [addLocaleResult, setAddLocaleResult] = React.useState<AddLocaleResult | null>(null);
  // The SDK's own default is 'global' -- mirrored here until the first 'ready'/
  // 'explore_mode_changed' message reports the real value (see docs/features/explore-mode.md).
  const [exploreMode, setExploreModeState] = React.useState<ExploreMode>('global');
  const [geofenceZone, setGeofenceZone] = React.useState<GeofenceZone | null>(null);
  const [geofenceZoneError, setGeofenceZoneError] = React.useState<string | null>(null);

  const bridge = useVisioMap(mapHash ?? DEMO_MAP_HASH);
  const { webRef, sendSetup, getCategories, getLocales } = bridge;

  const handleWebMessage = (event: WebViewMessageEvent) => {
    const raw = event.nativeEvent.data;
    const evt = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (evt.type === 'ready') {
      setStatus('ready');
      setErrorMessage(null);
      setVenueLayout({
        buildings: evt.data?.buildings ?? [],
        currentBuildingId: evt.data?.currentBuildingId,
        currentFloorId: evt.data?.currentFloorId,
      });
      setExploreModeState(evt.data?.currentExploreMode ?? 'global');
      // Fetches venue.categories once the venue is loaded -- see the
      // 'get_categories' / 'categories_result' round trip in
      // visioOneHtml.ts/visioOne.html and docs/features/category-highlight.md.
      getCategories();
      // Fetches the venue's available locales + the current one once the venue is
      // loaded -- see the 'get_locales' / 'locales_result' round trip in
      // visioOneHtml.ts/visioOne.html and docs/features/runtime-locale.md.
      getLocales();
    } else if (evt.type === 'error') {
      setStatus('error');
      setErrorMessage(String(evt.data));
    } else if (evt.type === 'poi_click') {
      setClickedPois(evt.data.pois);
      onPoiClick?.(evt.data.pois);
    } else if (evt.type === 'floor_changed') {
      // Also fires when the SDK's own default floor-selector widget (not this app's UI)
      // is the one driving the change -- see the 'currentfloorchanged' listener in
      // visioOneHtml.ts/visioOne.html. Keeps the app's own selector highlight in sync either way.
      setVenueLayout((prev) => ({
        ...prev,
        currentBuildingId: evt.data.buildingId,
        currentFloorId: evt.data.floorId,
      }));
    } else if (evt.type === 'itinerary_instructions') {
      console.log('[VisioMap] itinerary instructions:', evt.data);
    } else if (evt.type === 'poi_positions_resolved') {
      setPositionSimulationError(null);
      setPositionSimulationResolution(evt.data);
    } else if (evt.type === 'position_simulation_error') {
      setPositionSimulationResolution(null);
      setPositionSimulationError(String(evt.data?.message ?? evt.data));
    } else if (evt.type === 'custom_data_refreshed') {
      setCustomDataRefresh({ ok: true, error: null, at: Date.now() });
    } else if (evt.type === 'custom_data_refresh_error') {
      setCustomDataRefresh({ ok: false, error: String(evt.data?.message ?? evt.data), at: Date.now() });
    } else if (evt.type === 'poi_custom_data_result') {
      setCustomDataLookup(evt.data);
    } else if (evt.type === 'categories_result') {
      setCategories(evt.data?.categories ?? []);
    } else if (evt.type === 'dynamic_poi_create_result') {
      setDynamicPoiCreateResult(evt.data);
    } else if (evt.type === 'locales_result') {
      setLocaleInfo({
        locales: evt.data?.locales ?? [],
        currentLocale: evt.data?.currentLocale ?? null,
      });
    } else if (evt.type === 'locale_changed') {
      setLocaleError(null);
      setLocaleInfo((prev) => ({ ...prev, currentLocale: evt.data?.currentLocale ?? prev.currentLocale }));
    } else if (evt.type === 'locale_change_error') {
      setLocaleError(String(evt.data?.message ?? evt.data));
    } else if (evt.type === 'locale_added') {
      setAddLocaleResult({ translations: evt.data?.translations ?? {} });
    } else if (evt.type === 'explore_mode_changed') {
      // Also fires when the mode changes from direct camera/map interaction (e.g. a
      // click in 'building' mode auto-switches to 'floor') rather than the app's own
      // bridge.setExploreMode call -- see the 'exploremodechanged' listener in
      // visioOneHtml.ts/visioOne.html and docs/features/explore-mode.md.
      setExploreModeState(evt.data?.currentExploreMode ?? 'global');
    } else if (evt.type === 'geofence_zone_resolved') {
      setGeofenceZoneError(null);
      setGeofenceZone(evt.data);
    } else if (evt.type === 'geofence_zone_error') {
      setGeofenceZone(null);
      setGeofenceZoneError(String(evt.data?.message ?? evt.data));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <WebView
        ref={webRef}
        style={styles.webview}
        originWhitelist={['*']}
        // Loaded inline with an explicit baseUrl rather than via require('./visioOne.html') —
        // see docs/SDK_NOTES.md for why this matters in Debug builds connected to Metro.
        source={{ html: visioOneHtml, baseUrl: 'https://cdn.visioglobe.com/' }}
        onLoadEnd={sendSetup}
        onMessage={handleWebMessage}
        allowUniversalAccessFromFileURLs
        mixedContentMode="compatibility"
        javaScriptEnabled
        domStorageEnabled
      />

      <View style={styles.statusBadge}>
        <Text style={styles.status}>
          {status === 'loading' && 'Loading venue…'}
          {status === 'ready' && 'Venue ready'}
          {status === 'error' && `Error: ${errorMessage}`}
        </Text>
      </View>

      {renderOverlay?.(
        bridge,
        status,
        clickedPois,
        venueLayout,
        {
          resolution: positionSimulationResolution,
          error: positionSimulationError,
        },
        {
          refresh: customDataRefresh,
          lookup: customDataLookup,
        },
        categories,
        dynamicPoiCreateResult,
        { info: localeInfo, error: localeError },
        addLocaleResult,
        exploreMode,
        { zone: geofenceZone, error: geofenceZoneError },
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: '#111',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  status: {
    color: '#fff',
    fontSize: 13,
  },
});

export default VisioMapView;
