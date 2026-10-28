import { useMapBridge } from '../../bridge/MapBridge';

// Mirrors the SDK's View.UIPart type exactly (View/View.d.ts in the SDK typings) --
// these 5 string values are the only ones the SDK recognizes, case-sensitive.
export type UIPart = 'floorSelector' | 'navigation' | 'poiDetails' | 'search' | 'userTracking';

// view.setUIPartVisible(uiPart, isVisible) in the page (webview.js). Shared by
// ui-part-visibility and native-ui-replacement.
export const useUIPartVisibilityBridge = () => {
  const { send } = useMapBridge();
  return {
    setUIPartVisible: (uiPart: UIPart, isVisible: boolean) =>
      send('set_ui_part_visible', { uiPart, isVisible }),
  };
};
