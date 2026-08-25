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
    resolvePositionSimulationPois,
    injectTrackedPosition,
    stopPositionSimulation,
    setCameraLockOnPosition,
  };
};
