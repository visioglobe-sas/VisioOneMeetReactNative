import { useMapBridge } from '../../bridge/MapBridge';

// view.goToGlobal() in the page (webview.js).
export const useResetViewBridge = () => {
  const { send } = useMapBridge();
  return {
    resetMap: () => send('reset_map'),
  };
};
