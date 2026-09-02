import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { GeofenceZone, PositionSimulationResolution, VisioMapBridge } from '../components/VisioMapView';
import { Position } from '../screens/useVisioMap';
import SimulatedPositionOverlay from './SimulatedPositionOverlay';

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

interface Props {
  resolvePois: VisioMapBridge['resolvePositionSimulationPois'];
  injectTrackedPosition: VisioMapBridge['injectTrackedPosition'];
  stopSimulation: VisioMapBridge['stopPositionSimulation'];
  resolution: PositionSimulationResolution | null;
  error: string | null;
  resolveZone: VisioMapBridge['resolveGeofenceZone'];
  setGeofenceAlert: VisioMapBridge['setGeofenceAlert'];
  zone: GeofenceZone | null;
  zoneError: string | null;
}

const GeofencingOverlay = ({
  resolvePois,
  injectTrackedPosition,
  stopSimulation,
  resolution,
  error,
  resolveZone,
  setGeofenceAlert,
  zone,
  zoneError,
}: Props) => {
  const [zonePlaceId, setZonePlaceId] = React.useState('');
  const [inside, setInside] = React.useState(false);

  // Read/written by the tick callback below without being a render dependency -- same
  // reasoning as SimulatedPositionOverlay's own radiusRef.
  const zoneRef = React.useRef(zone);
  zoneRef.current = zone;
  const insideRef = React.useRef(false);

  // A freshly (re)loaded zone always starts unentered.
  React.useEffect(() => {
    insideRef.current = false;
    setInside(false);
  }, [zone]);

  const handleLoadZone = () => {
    const id = zonePlaceId.trim();
    if (!id) {
      return;
    }
    resolveZone(id);
  };

  const handlePositionTick = (position: Position) => {
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

  const handleTrackingStopped = () => {
    if (insideRef.current && zoneRef.current) {
      setGeofenceAlert(zoneRef.current.placeId, false);
    }
    insideRef.current = false;
    setInside(false);
  };

  return (
    <View style={styles.column}>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Zone POI ID"
          value={zonePlaceId}
          onChangeText={setZonePlaceId}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={handleLoadZone}>
          <Text style={styles.buttonText}>Load zone</Text>
        </TouchableOpacity>
      </View>

      {zoneError ? <Text style={styles.error}>{zoneError}</Text> : null}

      <Text style={styles.label}>
        {zone ? (inside ? 'Inside zone' : 'Outside zone') : 'No zone loaded'}
      </Text>

      <SimulatedPositionOverlay
        resolvePois={resolvePois}
        injectTrackedPosition={injectTrackedPosition}
        stopSimulation={stopSimulation}
        resolution={resolution}
        error={error}
        onPositionTick={handlePositionTick}
        onTrackingStopped={handleTrackingStopped}
      />
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
