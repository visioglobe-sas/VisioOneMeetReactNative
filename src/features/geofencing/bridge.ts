import * as React from 'react';

import { Position, useMapBridge, useMapEvent } from '../../bridge/MapBridge';

// Answer to 'resolve_geofence_zone' -- a "zone" is just an existing POI's Surface
// polygon(s). Each entry of `surfaces` is one surface's WGS84 boundary vertices (a POI
// can have more than one Surface); a position is "inside" the zone if it falls within
// any of them.
export interface GeofenceZone {
  placeId: string;
  surfaces: Position[][];
}

export const useGeofencingBridge = () => {
  const { send } = useMapBridge();
  const [zone, setZone] = React.useState<GeofenceZone | null>(null);
  const [zoneError, setZoneError] = React.useState<string | null>(null);

  useMapEvent<GeofenceZone>('geofence_zone_resolved', (data) => {
    setZoneError(null);
    setZone(data);
  });
  useMapEvent('geofence_zone_error', (data) => {
    setZone(null);
    setZoneError(String(data?.message ?? data));
  });

  return {
    zone,
    zoneError,
    // Resolves that POI's surfaces on the page side (venue.pois only exists there);
    // answered with 'geofence_zone_resolved' or 'geofence_zone_error'.
    resolveGeofenceZone: (placeId: string) => send('resolve_geofence_zone', { placeId }),
    // Recolors the zone POI's surfaces to flag whether the tracked position is inside.
    // The containment check itself happens on the React Native side -- the SDK has no
    // point-in-polygon primitive of its own.
    setGeofenceAlert: (placeId: string, active: boolean) =>
      send('set_geofence_alert', { placeId, active }),
  };
};
