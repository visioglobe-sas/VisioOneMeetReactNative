import { useRef } from 'react';

import { WebView } from 'react-native-webview';

export interface OccupancyUpdate {
  planId: string;
  color?: string;
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
  };
};
