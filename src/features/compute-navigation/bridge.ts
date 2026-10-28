import { useMapBridge } from '../../bridge/MapBridge';

// venue.computeNavigation + venue.createNavigationTrace + view.setCurrentNavigationTrace
// in the page (webview.js). Shared by compute-navigation, custom-navigation-trace,
// accessible-mode and navigation-exclude-modalities. An unknown place ID or no route
// comes back as a 'command_error' for 'start_itinerary' (see ItineraryForm).
//
// excludedAttributes (navigation-exclude-modalities only) is forwarded straight into
// computeNavigation's excludedAttributes option -- an array of segment-particularity
// attribute strings (e.g. an elevator hop) the computed route must not use. See
// docs/features/navigation-exclude-modalities.md, including why the attribute string
// to exclude an elevator is 'lift', not 'elevator' as the SDK's own JSDoc suggests.
export const useItineraryBridge = () => {
  const { send } = useMapBridge();
  return {
    startItinerary: (
      origin: string,
      destination: string,
      isAccessible: boolean,
      excludedAttributes?: string[],
    ) => send('start_itinerary', { origin, destination, isAccessible, excludedAttributes }),
  };
};
