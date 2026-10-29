import { useMapBridge } from '../../bridge/MapBridge';

// Makes every surface of the given POI clickable (or not): once isInteractive is true,
// the SDK itself swaps the surface's displayed color on hover/tap using
// hoverColor/selectionColor -- no click listener needed on the app side for that part.
// See the page side in webview.js.
export const useClickableSurfaceBridge = () => {
  const { send } = useMapBridge();
  return {
    setSurfaceInteractive: (placeId: string, interactive: boolean) =>
      send('set_surface_interactive', { placeId, interactive }),
  };
};
