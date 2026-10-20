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

// custom-navigation-trace feature: mirrors the SDK's NavigationTraceUpdateOptions type
// exactly (Navigation/NavigationTraceUpdateOptions.d.ts in visioone) -- colors only.
// The type also has textureRepeat/animationSpeed, omitted here since they only matter
// for the 'textured' displayMode, which createNavigationTrace() has no option to select
// in the first place. See docs/features/custom-navigation-trace.md.
export interface NavigationTraceStyle {
  progressColor?: string;
  progressOutlineColor?: string;
  progressFutureColor?: string;
  previewColor?: string;
  previewOutlineColor?: string;
}

// Mirrors the SDK's View.UIPart type exactly (View.ts in visioone) -- these 5 string
// values are the only ones the SDK recognizes, case-sensitive, no others exist.
export type UIPart = 'floorSelector' | 'navigation' | 'poiDetails' | 'search' | 'userTracking';

// Mirrors the SDK's View.ExploreMode type exactly (ExploreMode.ts in visioone) -- see
// docs/features/explore-mode.md for what each of the 3 values actually does.
export type ExploreMode = 'global' | 'building' | 'floor';

// Mirrors the SDK's OrientationType exactly (Venue/OrientationType.ts in visioone):
// 'fixed' = flat on the ground with a fixed heading, 'flat' = flat on the ground but
// turning to face the camera, 'facing' = always camera-facing (the SDK default). See
// docs/features/3d-icon-marker.md.
export type ImageOrientationType = 'fixed' | 'flat' | 'facing';

// Subset of the SDK's ImageCreateOptions that can cross the bridge -- `poi` and
// `position` are resolved on the WebView side from an anchor POI id instead, since a
// live POI object can't be serialized. width/height are in meters; url can be any image
// URL, including a data: URL.
export interface IconMarkerOptions {
  width: number;
  height?: number;
  url: string;
  orientationType: ImageOrientationType;
}

// Subset of the SDK's LabelCreateOptions that can cross the bridge -- `poi` and
// `position` are resolved on the WebView side from an anchor POI id instead (a live POI
// object can't be serialized). width/height are in meters and always both sent:
// createLabel defaults height to width when omitted. rotation is in degrees, relative
// to the map's orientation. color is a hex / rgb() / hsl() string. See
// docs/features/custom-text-label.md.
export interface TextLabelOptions {
  text: string;
  color: string;
  width: number;
  height: number;
  rotation: number;
}

// Mirrors the subset of the SDK's LabelUpdateOptions this demo uses. width and height
// go together (updateLabel with width alone also sets height = width); rotation is
// absent on purpose -- it isn't part of LabelUpdateOptions.
export type TextLabelUpdate =
  | { text: string }
  | { color: string }
  | { width: number; height: number };

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

// baseURL is the custom-base-url feature's override of LoadOptions.baseURL -- undefined
// means "let the WebView page fall back to the SDK's own default"
// (https://mapserver.visioglobe.com/), same as every other screen. See
// docs/features/custom-base-url.md.
// enableShadows is the custom-theme feature's createView option -- only that screen
// sets it (view themes only change the scene lights, which are only rendered with
// shadows enabled), undefined keeps the SDK's own default everywhere else. See
// docs/features/custom-theme.md.
export const useVisioMap = (hash: string, baseURL?: string, enableShadows?: boolean) => {
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
        data: { hash, baseURL, enableShadows },
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

  // navigation-exclude-modalities feature: excludedAttributes is an optional 4th field
  // forwarded straight into venue.computeNavigation({ ..., excludedAttributes }) on the
  // WebView side -- an array of segment-particularity attribute strings (e.g. an
  // elevator hop) the computed route must not use. Omitted (undefined) by every other
  // caller of startItinerary, which behaves exactly as before. See
  // docs/features/navigation-exclude-modalities.md, including why the attribute string
  // to exclude an elevator is 'lift', not 'elevator' as the SDK's own JSDoc suggests.
  const startItinerary = (
    origin: string,
    destination: string,
    isAccessible: boolean,
    excludedAttributes?: string[],
  ) => {
    sendMessage({
      type: 'start_itinerary',
      data: { origin, destination, isAccessible, excludedAttributes },
    });
  };

  // custom-navigation-trace feature: restyles whichever NavigationTrace is currently
  // tracked on the WebView side (the one created by the last startItinerary call) --
  // venue.updateNavigationTrace(trace, style). Fire-and-forget: colors only affect a
  // trace that already exists, a harmless no-op on the WebView side if none is tracked
  // yet. See docs/features/custom-navigation-trace.md, including the SDK's own
  // throwing-but-still-applying quirk this call can hit on this demo venue.
  const updateNavigationTrace = (style: NavigationTraceStyle) => {
    sendMessage({
      type: 'update_navigation_trace',
      data: { style },
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
  // (camera-lock-on-position feature) -- view.lockCameraPositionOnTracking. Only has an
  // effect once view.allowTracking is true (see injectTrackedPosition above); unlike
  // injectTrackedPosition, setting this while allowTracking is still false is a silent
  // no-op, not an exception. The resulting state comes back as a 'camera_lock_changed'
  // message (SDK 'trackingchanged' event), which is what the UI displays.
  const setCameraLockOnPosition = (locked: boolean) => {
    sendMessage({
      type: 'set_camera_lock_on_position',
      data: { locked },
    });
  };

  // accuracy-circle-style feature: view.updatePositionTrackerGraphicOptions({ color,
  // opacity }) -- recolors the tracked position's precision circle (the SDK's "blue
  // dot" mesh; the center arrow is a fixed image the options don't touch).
  // The SDK only stores these options and applies them on the next injectTrackedPosition
  // call, and resets them to its defaults whenever tracking stops (allowTracking = false),
  // so the app re-sends its current selection on every Start. See
  // docs/features/accuracy-circle-style.md.
  const setPositionTrackerStyle = (color: string, opacity: number) => {
    sendMessage({
      type: 'set_position_tracker_style',
      data: { color, opacity },
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

  // 3d-icon-marker feature: venue.createImage owned by an existing "anchor" POI, at the
  // position copied from it (same anchor-position resolution as createDynamicPoi). The
  // live Image object only exists on the WebView side, keyed by `imageId`; the outcome
  // comes back as 'icon_marker_create_result' (anchor not found / no position are
  // normal, non-crash outcomes), see VisioMapView.tsx and docs/features/3d-icon-marker.md.
  const createIconMarker = (imageId: string, anchorId: string, options: IconMarkerOptions) => {
    sendMessage({ type: 'create_icon_marker', data: { imageId, anchorId, options } });
  };

  // venue.updateImage(image, { orientationType }) on the Image tracked under `imageId`
  // -- fire-and-forget, a no-op on the WebView side if nothing is placed.
  const updateIconMarkerOrientation = (imageId: string, orientationType: ImageOrientationType) => {
    sendMessage({ type: 'update_icon_marker_orientation', data: { imageId, orientationType } });
  };

  // venue.removeImage(image) on the Image tracked under `imageId` -- fire-and-forget.
  const removeIconMarker = (imageId: string) => {
    sendMessage({ type: 'remove_icon_marker', data: { imageId } });
  };

  // custom-text-label feature: venue.createLabel owned by an existing "anchor" POI, at
  // the position copied from it (same anchor-position resolution as createDynamicPoi /
  // createIconMarker), offset by ~4 m. The live Label object only exists on the WebView
  // side, keyed by `labelId`; the outcome comes back as 'text_label_create_result'
  // (empty text / anchor not found / no position are normal, non-crash outcomes), see
  // VisioMapView.tsx and docs/features/custom-text-label.md. Creating again under the
  // same id replaces the previous label. `moveCamera: false` skips the camera move
  // after creation -- used when only recreating the label to change its rotation.
  const createTextLabel = (
    labelId: string,
    anchorId: string,
    options: TextLabelOptions,
    moveCamera = true,
  ) => {
    sendMessage({ type: 'create_text_label', data: { labelId, anchorId, options, moveCamera } });
  };

  // venue.updateLabel(label, update) on the Label tracked under `labelId` --
  // fire-and-forget, a no-op on the WebView side if nothing is placed.
  const updateTextLabel = (labelId: string, update: TextLabelUpdate) => {
    sendMessage({ type: 'update_text_label', data: { labelId, update } });
  };

  // venue.removeLabel(label) on the Label tracked under `labelId` -- fire-and-forget,
  // a no-op on the WebView side if nothing is placed.
  const removeTextLabel = (labelId: string) => {
    sendMessage({ type: 'remove_text_label', data: { labelId } });
  };

  // html-overlay-marker feature: venue.createMarker with an HTML element (a badge
  // showing `text`) owned by an existing "anchor" POI, at the position copied from it
  // (same anchor-position resolution as createDynamicPoi / createIconMarker /
  // createTextLabel), offset by ~4 m. The element is created by the WebView page, never
  // crosses the bridge; the live Marker only exists on the WebView side, keyed by
  // `markerId`. The outcome comes back as 'html_marker_create_result' (empty text /
  // anchor not found / no position are normal, non-crash outcomes, and leave any
  // current badge in place), and every tap on the badge as 'html_marker_tapped' -- see
  // VisioMapView.tsx and docs/features/html-overlay-marker.md. Creating again under the
  // same id replaces the previous badge.
  const createHtmlMarker = (markerId: string, anchorId: string, text: string) => {
    sendMessage({ type: 'create_html_marker', data: { markerId, anchorId, text } });
  };

  // Replaces the badge's text content (a plain DOM edit on marker.element, no SDK
  // call) -- fire-and-forget, a no-op on the WebView side if nothing is placed.
  const updateHtmlMarkerText = (markerId: string, text: string) => {
    sendMessage({ type: 'update_html_marker_text', data: { markerId, text } });
  };

  // venue.updateMarker(marker, { isVisible }) -- fire-and-forget.
  const setHtmlMarkerVisible = (markerId: string, isVisible: boolean) => {
    sendMessage({ type: 'set_html_marker_visible', data: { markerId, isVisible } });
  };

  // venue.removeMarker(marker), which also detaches the element -- fire-and-forget, a
  // no-op on the WebView side if nothing is placed.
  const removeHtmlMarker = (markerId: string) => {
    sendMessage({ type: 'remove_html_marker', data: { markerId } });
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

  // custom-theme feature: switches the 3D scene's lighting theme. `theme` must be one
  // of view.themes (forwarded in the 'ready' message) -- setTheme throws on any other
  // id. See docs/features/custom-theme.md.
  const setTheme = (theme: string) => {
    sendMessage({ type: 'set_theme', data: { theme } });
  };

  // custom-theme feature: view.accentColor / view.textAccentColor recolor the SDK's own
  // UI buttons (e.g. the place card's "Go" button) live. Either field can be omitted.
  const setAccentColors = (colors: { accentColor?: string; textAccentColor?: string }) => {
    sendMessage({ type: 'set_accent_colors', data: colors });
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
    updateNavigationTrace,
    setUIPartVisible,
    setExploreMode,
    resolvePositionSimulationPois,
    injectTrackedPosition,
    stopPositionSimulation,
    setCameraLockOnPosition,
    setPositionTrackerStyle,
    setSurfaceInteractive,
    refreshCustomData,
    getPoiCustomData,
    getCategories,
    highlightCategory,
    clearCategoryHighlight,
    createDynamicPoi,
    updateDynamicPoiLabel,
    removeDynamicPoi,
    createIconMarker,
    updateIconMarkerOrientation,
    removeIconMarker,
    createTextLabel,
    updateTextLabel,
    removeTextLabel,
    createHtmlMarker,
    updateHtmlMarkerText,
    setHtmlMarkerVisible,
    removeHtmlMarker,
    getLocales,
    setLocale,
    addLocale,
    resolveGeofenceZone,
    setGeofenceAlert,
    setTheme,
    setAccentColors,
  };
};
