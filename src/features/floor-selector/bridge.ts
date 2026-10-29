import * as React from 'react';

import { useMapBridge, useMapEvent } from '../../bridge/MapBridge';

// Mirrors the plain object shape of the 'ready' message's data.buildings (webview.js),
// built from venue.venueLayout.buildings and resolved through venue.translator so
// labels match whatever the SDK's own default floor-selector widget displays.
export interface VenueFloor {
  id: string;
  label: string;
  levelIndex: number;
}

export interface VenueBuilding {
  id: string;
  label: string;
  defaultFloorID: string;
  floors: VenueFloor[];
}

export interface VenueLayoutInfo {
  buildings: VenueBuilding[];
  currentBuildingId?: string;
  currentFloorId?: string;
}

// The venue's buildings/floors (from 'ready') and the current building/floor, kept
// current by 'floor_changed' -- which also fires when the SDK's own floor-selector
// widget (not this app's UI) drives the change. Shared by floor-selector and
// native-ui-replacement.
export const useFloorSelectorBridge = () => {
  const { send } = useMapBridge();
  const [venueLayout, setVenueLayout] = React.useState<VenueLayoutInfo>({ buildings: [] });

  useMapEvent('ready', (data) =>
    setVenueLayout({
      buildings: data?.buildings ?? [],
      currentBuildingId: data?.currentBuildingId,
      currentFloorId: data?.currentFloorId,
    }),
  );
  useMapEvent('floor_changed', (data) =>
    setVenueLayout((prev) => ({
      ...prev,
      currentBuildingId: data.buildingId,
      currentFloorId: data.floorId,
    })),
  );

  return {
    venueLayout,
    // view.goToFloor(floor) in the page.
    goToFloor: (buildingId: string, floorId: string) => send('select_floor', { buildingId, floorId }),
    // view.goToBuilding(building) in the page.
    goToBuilding: (buildingId: string) => send('select_floor', { buildingId }),
  };
};
