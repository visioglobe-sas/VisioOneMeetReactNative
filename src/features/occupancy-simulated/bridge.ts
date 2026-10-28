import { useMapBridge } from '../../bridge/MapBridge';

export interface OccupancyUpdate {
  planId: string;
  color?: string;
}

// Recolors each POI's surfaces (venue.updateSurface in the page, webview.js).
export const useOccupancySimulatedBridge = () => {
  const { send } = useMapBridge();
  return {
    updateOccupancy: (occupancy: OccupancyUpdate[]) => send('update_occupancy', { occupancy }),
  };
};
