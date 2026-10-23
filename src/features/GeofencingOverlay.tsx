import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { GeofenceZone, VisioMapBridge } from '../components/VisioMapView';
import { GEOFENCE_ZONE_ID } from '../demoMap';
import { useLocale } from '../i18n/useLocale';
import { Position } from '../screens/useVisioMap';
import SimulatedPositionOverlay from './SimulatedPositionOverlay';
import { SimulatedPositionSession } from './useSimulatedPositionSession';

// Ray-casting point-in-polygon test, lat/lng treated as planar x/y -- accurate enough
// at building scale. Not an SDK method: the SDK has no geofencing/point-in-polygon
// primitive of its own, see docs/features/geofencing.md.
const isPointInPolygon = (point: Position, polygon: Position[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;
    const intersect =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
};

// Screen-level geofencing state (zone field, inside/outside flag, tick handlers),
// owned by the feature screen alongside useSimulatedPositionSession rather than by the
// bottom sheet's content -- so the zone check keeps running, and the panel shows the
// current state, while the sheet is closed. Its onPositionTick/onTrackingStopped are
// passed to useSimulatedPositionSession, piggybacking on that single tick loop.
interface GeofenceTracker {
  zonePlaceId: string;
  setZonePlaceId: (value: string) => void;
  inside: boolean;
  onPositionTick: (position: Position) => void;
  onTrackingStopped: () => void;
}

export const useGeofenceTracker = (
  zone: GeofenceZone | null,
  setGeofenceAlert: VisioMapBridge['setGeofenceAlert'],
): GeofenceTracker => {
  const [zonePlaceId, setZonePlaceId] = React.useState(GEOFENCE_ZONE_ID);
  const [inside, setInside] = React.useState(false);

  // Read/written by the tick callback below without being a render dependency.
  const zoneRef = React.useRef(zone);
  zoneRef.current = zone;
  const insideRef = React.useRef(false);

  // A freshly (re)loaded zone always starts unentered.
  React.useEffect(() => {
    insideRef.current = false;
    setInside(false);
  }, [zone]);

  const onPositionTick = (position: Position) => {
    const currentZone = zoneRef.current;
    if (!currentZone) {
      return;
    }
    const isInside = currentZone.surfaces.some((polygon) => isPointInPolygon(position, polygon));
    if (isInside !== insideRef.current) {
      insideRef.current = isInside;
      setInside(isInside);
      setGeofenceAlert(currentZone.placeId, isInside);
    }
  };

  const onTrackingStopped = () => {
    if (insideRef.current && zoneRef.current) {
      setGeofenceAlert(zoneRef.current.placeId, false);
    }
    insideRef.current = false;
    setInside(false);
  };

  return { zonePlaceId, setZonePlaceId, inside, onPositionTick, onTrackingStopped };
};

interface Props {
  session: SimulatedPositionSession;
  tracker: GeofenceTracker;
  resolveZone: VisioMapBridge['resolveGeofenceZone'];
  zone: GeofenceZone | null;
  zoneError: string | null;
}

const GeofencingOverlay = ({ session, tracker, resolveZone, zone, zoneError }: Props) => {
  const { t } = useLocale();
  const { zonePlaceId, setZonePlaceId, inside } = tracker;

  const handleLoadZone = () => {
    const id = zonePlaceId.trim();
    if (!id) {
      return;
    }
    resolveZone(id);
  };

  return (
    <View style={styles.column}>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder={t('geofencing.zonePoiId')}
          placeholderTextColor="#666"
          value={zonePlaceId}
          onChangeText={setZonePlaceId}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={handleLoadZone}>
          <Text style={styles.buttonText}>{t('geofencing.loadZone')}</Text>
        </TouchableOpacity>
      </View>

      {zoneError ? <Text style={styles.error}>{zoneError}</Text> : null}

      <Text style={styles.label}>
        {zone ? (inside ? t('geofencing.inside') : t('geofencing.outside')) : t('geofencing.noZone')}
      </Text>

      <SimulatedPositionOverlay session={session} />
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  button: {
    backgroundColor: '#057DBC',
    borderRadius: 6,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  label: {
    color: '#fff',
    fontSize: 15,
  },
  error: {
    color: '#E74C3C',
    fontSize: 13,
  },
});

export default GeofencingOverlay;
