// Values of Visioglobe's shared demo map: replace them with your own map's hash and ids.

// Map loaded by every screen (see VisioMapView.tsx).
export const DEMO_MAP_HASH = 'kbae8e6c066cca4b02c2afac2bc963a643d87437a';
// custom-data only: a dedicated map with real, published CustomData (the shared demo map
// has none). See docs/features/custom-data.md.
export const CUSTOM_DATA_MAP_HASH = 'kd9426d8cb3f1c532f22b5bcbd325c280bd351feb';

// goto-poi
export const GOTO_POI_ID = 'B3-UL00-ID0076';
// occupancy-simulated
export const OCCUPANCY_POI_ID = 'B3-UL00-ID0065';
// clickable-surface
export const CLICKABLE_SURFACE_POI_ID = 'B3-UL00-ID0064';

// compute-navigation and custom-navigation-trace
export const ITINERARY_FROM = 'B4-UL00-ID0009';
export const ITINERARY_TO = 'B3-UL00-ID0064';
// navigation-exclude-modalities: the unrestricted route takes an elevator, so avoiding
// it gives a visibly different route.
export const EXCLUDE_MODALITIES_FROM = 'B1-LL01-ID0013';
export const EXCLUDE_MODALITIES_TO = 'B1-UL02-ID0012';
// accessible-mode: the default route takes stairs, the accessible one an elevator.
export const ACCESSIBLE_FROM = 'B4-UL00-ID0010';
export const ACCESSIBLE_TO = 'B4-UL01-ID0014';

// simulated-position, camera-lock-on-position, geofencing, accuracy-circle-style:
// the simulated position moves back and forth between these two POIs.
export const TRACKING_FROM = 'B4-UL00-ID0009';
export const TRACKING_TO = 'B4-UL00-ID0010';
// geofencing: a POI with a surface, on the tracking path.
export const GEOFENCE_ZONE_ID = 'B4-UL00-ID0010';

// custom-data (on CUSTOM_DATA_MAP_HASH): POIs with real CustomData, shown as quick-select
// chips; the first non-building one prefills the field.
export const CUSTOM_DATA_POI_ID = 'B3-UL00-ID0065';
export const CUSTOM_DATA_KNOWN_POI_IDS = ['B1', 'B3-UL00-ID0065', 'B3-UL00-ID0064'];

// dynamic-poi-crud: the id given to the new POI (must not exist on the map yet).
export const DYNAMIC_POI_NEW_ID = 'demo-poi';

// dynamic-poi-crud, 3d-icon-marker, custom-text-label, html-overlay-marker: a POI (a
// restaurant, ground floor of building B4) with a label position to copy.
export const ANCHOR_POI_ID = 'B4-UL00-ID0009';

// camera-showcase-carousel: the tour's stops, across 3 buildings. Sent to the WebView
// with the start message.
export const CAROUSEL_STOP_IDS = ['B4-UL00-ID0009', 'B1-LL01-ID0152', 'B3-UL00-ID0064', 'B4-UL03-ID0015'];
