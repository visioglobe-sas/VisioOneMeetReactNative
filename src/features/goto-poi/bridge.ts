import { useMapBridge } from '../../bridge/MapBridge';

// Moves the camera onto a POI and pins it (view.goToPOI + venue.createImage in the
// page, webview.js). An unknown id comes back as a 'command_error' for 'select_place'.
export const useGoToPoiBridge = () => {
  const { send } = useMapBridge();
  return {
    goToPlace: (placeId: string) => send('select_place', { placeId }),
    clearPlace: () => send('clear_place'),
  };
};
