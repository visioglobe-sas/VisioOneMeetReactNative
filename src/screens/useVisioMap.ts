import { useRef } from 'react';

import { WebView } from 'react-native-webview';

export interface OccupancyUpdate {
  planId: string;
  color?: string;
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
  };
};
