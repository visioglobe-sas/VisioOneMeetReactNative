import { useMapBridge } from '../../bridge/MapBridge';

export const usePositionTrackerStyleBridge = () => {
  const { send } = useMapBridge();
  return {
    // view.updatePositionTrackerGraphicOptions({ color, opacity }) -- recolors the
    // tracked position's precision circle (the center arrow is a fixed image the options
    // don't touch). The SDK only stores these options and applies them on the next
    // injected position, and resets them to its defaults whenever tracking stops, so the
    // panel re-sends its current selection on every Start.
    setPositionTrackerStyle: (color: string, opacity: number) =>
      send('set_position_tracker_style', { color, opacity }),
  };
};
