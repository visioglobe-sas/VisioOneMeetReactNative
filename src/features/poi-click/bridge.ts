import { useMapEvent } from '../../bridge/MapBridge';

// Mirrors the plain object shape sent by the page's 'poiclick' listener (webview.js).
// Not the live SDK POI type: only serializable fields survive the WebView postMessage
// boundary.
export interface ClickedPoi {
  id: string;
  name: string;
  floorId?: string;
  categories: string[];
}

// Calls `onClick` with every POI under each tap on the map.
export const usePoiClick = (onClick: (pois: ClickedPoi[]) => void) => {
  useMapEvent<{ pois: ClickedPoi[] }>('poi_click', (data) => onClick(data.pois));
};
