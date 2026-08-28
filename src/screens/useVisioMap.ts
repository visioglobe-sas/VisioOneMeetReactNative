import { useRef } from 'react';

import { WebView } from 'react-native-webview';

export interface OccupancyUpdate {
  planId: string;
  color?: string;
}

// WGS84 coordinate, same shape the SDK's PositionTrackerOptions.position expects --
// see injectTrackedPosition in useVisioMap.ts below, no conversion needed.
export interface Position {
  latitude: number;
  longitude: number;
  altitude?: number;
}

// Mirrors the SDK's View.UIPart type exactly (View.ts in visioone) -- these 5 string
// values are the only ones the SDK recognizes, case-sensitive, no others exist.
export type UIPart = 'floorSelector' | 'navigation' | 'poiDetails' | 'search' | 'userTracking';

// Mirrors the SDK's View.ExploreMode type exactly (ExploreMode.ts in visioone) -- see
// docs/features/explore-mode.md for what each of the 3 values actually does.
export type ExploreMode = 'global' | 'building' | 'floor';

// Mirrors the plain object shape sent from the WebView on 'poi_click' -- see the
// poiclick handler in visioOneHtml.ts/visioOne.html. Not the live SDK POI type:
// only serializable fields survive the WebView postMessage boundary.
export interface ClickedPoi {
  id: string;
  name: string;
  floorId?: string;
  categories: string[];
}

// Mirrors the plain object shape sent from the WebView in the 'ready' message's
// data.buildings -- see the buildings mapping in visioOneHtml.ts/visioOne.html, built from
// venue.venueLayout.buildings and resolved through venue.translator so labels match
// whatever the SDK's own default floor-selector widget displays.
export interface VenueFloor {
  id: string;
  label: string;
  levelIndex: number;
}

export interface VenueBuilding {
  id: string;
  label: string;
  defaultFloorID: string;
  floors: VenueFloor[];
}

export const useVisioMap = (hash: string) => {
  const webRef = useRef<WebView>(null);

  const sendMessage = (message: object) => {
    webRef.current?.postMessage(JSON.stringify(message));
  };

  const sendSetup = () => {
    if (!hash) {
      return;
    }
    setTimeout(() => {
      sendMessage({
        type: 'setup',
        data: { hash },
      });
    }, 500);
  };

  const resetMap = () => {
    sendMessage({ type: 'reset_map' });
  };

  const goToPlace = (placeId: string) => {
    sendMessage({
      type: 'select_place',
      data: { placeId },
    });
  };

  const clearPlace = () => {
    sendMessage({ type: 'clear_place' });
  };

  const goToFloor = (buildingId: string, floorId: string) => {
    sendMessage({
      type: 'select_floor',
      data: { buildingId, floorId },
    });
  };

  const goToBuilding = (buildingId: string) => {
    sendMessage({
      type: 'select_floor',
      data: { buildingId },
    });
  };

  const updateOccupancy = (occupancy: OccupancyUpdate[]) => {
    sendMessage({
      type: 'update_occupancy',
      data: { occupancy },
    });
  };

  const startItinerary = (origin: string, destination: string, isAccessible: boolean) => {
    sendMessage({
      type: 'start_itinerary',
      data: { origin, destination, isAccessible },
    });
  };

  const setUIPartVisible = (uiPart: UIPart, isVisible: boolean) => {
    sendMessage({
      type: 'set_ui_part_visible',
      data: { uiPart, isVisible },
    });
  };

  // Sets view.currentExploreMode directly -- see docs/features/explore-mode.md. Fire-and-
  // forget: the WebView side's 'exploremodechanged' listener reports back whatever the
  // mode ends up being (this call included, but also camera/click-driven changes the app
  // never asked for -- e.g. clicking in 'building' mode auto-switches to 'floor'), see
  // the 'explore_mode_changed' handling in VisioMapView.tsx.
  const setExploreMode = (mode: ExploreMode) => {
    sendMessage({
      type: 'set_explore_mode',
      data: { mode },
    });
  };

  // Resolves both place IDs to WGS84 positions on the WebView side (venue.pois lookup
  // only exists there) -- the response comes back asynchronously as either
  // 'poi_positions_resolved' or 'position_simulation_error', see VisioMapView.tsx.
  const resolvePositionSimulationPois = (originId: string, destinationId: string) => {
    sendMessage({
      type: 'resolve_poi_positions',
      data: { originId, destinationId },
    });
  };

  // The ping-pong interpolation timer lives on the native side (same idiom as
  // occupancy-simulated's color-cycling setInterval) -- this is called on every tick
  // with the already-interpolated position, the WebView handler just forwards it to
  // injectTrackedPosition (setting allowTracking on first call).
  const injectTrackedPosition = (position: Position, precisionCircleRadius: number) => {
    sendMessage({
      type: 'inject_tracked_position',
      data: { position, precisionCircleRadius },
    });
  };

  // No dedicated "stop" call exists on the SDK side -- this sets view.allowTracking
  // back to false, which is what removes the marker/circle from the map.
  const stopPositionSimulation = () => {
    sendMessage({ type: 'stop_position_simulation' });
  };

  // Binds/unbinds the camera's focus onto whatever position is currently being tracked
  // (camera-lock-on-position feature) -- view.lockCameraPositionOnTracking. Only has a
  // visible effect once view.allowTracking is true (see injectTrackedPosition above);
  // unlike injectTrackedPosition, setting this while allowTracking is still false is a
  // harmless no-op per the SDK's own doc comment, not an exception.
  const setCameraLockOnPosition = (locked: boolean) => {
    sendMessage({
      type: 'set_camera_lock_on_position',
      data: { locked },
    });
  };

  // Makes every surface of the given POI clickable (or not): once isInteractive is
  // true, the SDK itself swaps the surface's displayed color on hover/tap using
  // hoverColor/selectionColor -- no click listener needed on the app side for that
  // part. See setSurfaceInteractive in visioOneHtml.ts/visioOne.html.
  const setSurfaceInteractive = (placeId: string, interactive: boolean) => {
    sendMessage({
      type: 'set_surface_interactive',
      data: { placeId, interactive },
    });
  };

  // (Re)loads all CustomData from the server -- venue.refreshCustomData(). The cache
  // starts empty ({}) until this resolves at least once; the response comes back
  // asynchronously as 'custom_data_refreshed' or 'custom_data_refresh_error', see
  // VisioMapView.tsx. See docs/features/custom-data.md.
  const refreshCustomData = () => {
    sendMessage({ type: 'refresh_custom_data' });
  };

  // Synchronous lookup on the WebView side (venue.getPOICustomData(poi) only exists
  // there) -- the response comes back asynchronously as 'poi_custom_data_result',
  // see VisioMapView.tsx. Distinguishes "POI not found" (found: false) from "POI has
  // no CustomData" (found: true, customData: {}) -- both are normal, non-error states.
  const getPoiCustomData = (placeId: string) => {
    sendMessage({
      type: 'get_poi_custom_data',
      data: { placeId },
    });
  };

  // Requests the venue's full category list (venue.categories) -- the response comes
  // back asynchronously as 'categories_result', see VisioMapView.tsx. Same
  // request/response idiom as getPoiCustomData above.
  const getCategories = () => {
    sendMessage({ type: 'get_categories' });
  };

  // Highlights every POI carrying this category id by recoloring its surfaces --
  // fire-and-forget, no response expected. Reverting any previously-highlighted
  // category first (so only one is ever highlighted at a time) happens on the
  // WebView side, see highlightCategory in visioOneHtml.ts/visioOne.html.
  const highlightCategory = (categoryId: string) => {
    sendMessage({
      type: 'highlight_category',
      data: { categoryId },
    });
  };

  // Reverts whichever category is currently highlighted, if any -- fire-and-forget.
  const clearCategoryHighlight = () => {
    sendMessage({ type: 'clear_category_highlight' });
  };

  // dynamic-poi-crud feature: creates a POI at runtime (venue.createPOI) and attaches
  // a Label to it, copying its WGS84 position from an existing "anchor" POI (a bare
  // POI has no visual footprint of its own). The live POI/Label objects only exist on
  // the WebView side -- this needs a round trip to learn whether it succeeded (the
  // anchor id not resolving, the anchor having no position to copy, or newId already
  // being used all come back as normal, non-crash outcomes), see
  // 'dynamic_poi_create_result' in VisioMapView.tsx and docs/features/dynamic-poi-crud.md.
  const createDynamicPoi = (newId: string, anchorId: string, labelText: string) => {
    sendMessage({
      type: 'create_dynamic_poi',
      data: { newId, anchorId, labelText },
    });
  };

  // updatePOI itself can only ever touch categories, never anything visual -- editing
  // the dynamic POI's visible content means updating its attached Label's text
  // instead (venue.updateLabel). Fire-and-forget: always valid while a dynamic POI is
  // tracked, so no response is needed.
  const updateDynamicPoiLabel = (text: string) => {
    sendMessage({
      type: 'update_dynamic_poi_label',
      data: { text },
    });
  };

  // removePOI cascades: removing the tracked POI also removes its attached Label from
  // the view, no separate removeLabel call needed. Fire-and-forget, clears the WebView
  // side's tracking; the app clears its own local tracking state at the same time.
  const removeDynamicPoi = () => {
    sendMessage({ type: 'remove_dynamic_poi' });
  };

  // Requests the venue's available locales (venue.translator.allLocales) plus the
  // currently active one (venue.currentLocale) -- the response comes back
  // asynchronously as 'locales_result', see VisioMapView.tsx. Same request/response
  // idiom as getCategories above.
  const getLocales = () => {
    sendMessage({ type: 'get_locales' });
  };

  // Switches the map's displayed language at runtime -- venue.setCurrentLocale(locale).
  // Async on the SDK side: the response comes back as either 'locale_changed' or
  // 'locale_change_error', see VisioMapView.tsx and docs/features/runtime-locale.md.
  const setLocale = (locale: string) => {
    sendMessage({ type: 'set_locale', data: { locale } });
  };

  // add-locale feature: adds a brand-new 'es' locale at runtime --
  // venue.translator.addLocale('es', resources) -- one never authored in VisioMapEditor
  // for this map. The fixed dictionary itself lives on the WebView side (same idiom as
  // e.g. category-highlight's hardcoded highlight color), not passed over the bridge.
  // Fire-and-forget from here: the WebView immediately reads each key back via
  // venue.translator.translate(key, 'es') and reports the result as 'locale_added', see
  // VisioMapView.tsx and docs/features/add-locale.md.
  const addLocale = () => {
    sendMessage({ type: 'add_locale' });
  };

  // geofencing feature: a "zone" is just an existing POI's Surface polygon -- there's
  // no separate geofence concept on the SDK side. Resolves that POI's surfaces on the
  // WebView side (venue.pois lookup only exists there); the response comes back
  // asynchronously as 'geofence_zone_resolved' or 'geofence_zone_error', see
  // VisioMapView.tsx and docs/features/geofencing.md.
  const resolveGeofenceZone = (placeId: string) => {
    sendMessage({ type: 'resolve_geofence_zone', data: { placeId } });
  };

  // Recolors the zone POI's surfaces to flag whether the tracked position is currently
  // inside it. The containment check itself happens on the React side (see
  // GeofencingOverlay.tsx, piggybacked onto simulated-position's tick loop) -- the SDK
  // has no point-in-polygon primitive of its own, this just applies the visual result.
  const setGeofenceAlert = (placeId: string, active: boolean) => {
    sendMessage({ type: 'set_geofence_alert', data: { placeId, active } });
  };

  return {
    webRef,
    resetMap,
    goToPlace,
    goToFloor,
    clearPlace,
    goToBuilding,
    sendSetup,
    updateOccupancy,
    startItinerary,
    setUIPartVisible,
    setExploreMode,
    resolvePositionSimulationPois,
    injectTrackedPosition,
    stopPositionSimulation,
    setCameraLockOnPosition,
    setSurfaceInteractive,
    refreshCustomData,
    getPoiCustomData,
    getCategories,
    highlightCategory,
    clearCategoryHighlight,
    createDynamicPoi,
    updateDynamicPoiLabel,
    removeDynamicPoi,
    getLocales,
    setLocale,
    addLocale,
    resolveGeofenceZone,
    setGeofenceAlert,
  };
};
