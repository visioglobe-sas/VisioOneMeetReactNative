import { useMapBridge } from '../../bridge/MapBridge';

// Mirrors the SDK's NavigationTraceUpdateOptions type (colors only). The type also has
// textureRepeat/animationSpeed, omitted here since they only matter for the 'textured'
// displayMode, which createNavigationTrace() has no option to select in the first
// place.
export interface NavigationTraceStyle {
  progressColor?: string;
  progressOutlineColor?: string;
  progressFutureColor?: string;
  previewColor?: string;
  previewOutlineColor?: string;
}

// Restyles the trace the last 'start_itinerary' created --
// venue.updateNavigationTrace(trace, style) in the page (webview.js). Fire-and-forget:
// a no-op on the page side if no trace exists yet.
export const useNavigationTraceBridge = () => {
  const { send } = useMapBridge();
  return {
    updateNavigationTrace: (style: NavigationTraceStyle) =>
      send('update_navigation_trace', { style }),
  };
};
