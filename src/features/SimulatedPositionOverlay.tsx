import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { PositionSimulationResolution, VisioMapBridge } from '../components/VisioMapView';

// Stand-in for a real positioning feed: linearly interpolates between two resolved POI
// positions and ping-pongs back and forth on a timer, calling injectTrackedPosition on
// every tick. See docs/features/simulated-position.md. Same idiom as occupancy-simulated's
// color-cycling setInterval -- the timer lives on the native side, not in the WebView.
const TICK_MS = 150;
const STEP_PER_TICK = 0.02; // fraction of the origin->destination leg advanced per tick
const RADIUS_MIN = 1;
const RADIUS_MAX = 20;
const RADIUS_DEFAULT = 5;
const RADIUS_STEP = 1;

interface Props {
  resolvePois: VisioMapBridge['resolvePositionSimulationPois'];
  injectTrackedPosition: VisioMapBridge['injectTrackedPosition'];
  stopSimulation: VisioMapBridge['stopPositionSimulation'];
  resolution: PositionSimulationResolution | null;
  error: string | null;
}

const SimulatedPositionOverlay = ({
  resolvePois,
  injectTrackedPosition,
  stopSimulation,
  resolution,
  error,
}: Props) => {
  const [originId, setOriginId] = React.useState('');
  const [destinationId, setDestinationId] = React.useState('');
  const [radius, setRadius] = React.useState(RADIUS_DEFAULT);
  const [running, setRunning] = React.useState(false);
  // True from the moment Start is pressed until the WebView's async POI-lookup
  // response ('poi_positions_resolved' or 'position_simulation_error') comes back.
  const [awaitingResolution, setAwaitingResolution] = React.useState(false);

  // Read by the interpolation loop below without being a dependency of it -- so moving
  // the slider/stepper while the simulation is running changes the radius used on the
  // next tick without restarting the loop (and by extension, without ever resetting
  // the ping-pong progress).
  const radiusRef = React.useRef(radius);
  React.useEffect(() => {
    radiusRef.current = radius;
  }, [radius]);

  React.useEffect(() => {
    if (!awaitingResolution) {
      return;
    }
    if (resolution) {
      setAwaitingResolution(false);
      setRunning(true);
    } else if (error) {
      setAwaitingResolution(false);
    }
  }, [resolution, error, awaitingResolution]);

  React.useEffect(() => {
    if (!running || !resolution) {
      return;
    }

    const { origin, destination } = resolution;
    let progress = 0;
    let direction = 1;

    const tick = () => {
      const hasAltitude = origin.altitude != null && destination.altitude != null;
      injectTrackedPosition(
        {
          latitude: origin.latitude + (destination.latitude - origin.latitude) * progress,
          longitude: origin.longitude + (destination.longitude - origin.longitude) * progress,
          altitude: hasAltitude
            ? origin.altitude! + (destination.altitude! - origin.altitude!) * progress
            : undefined,
        },
        radiusRef.current,
      );

      progress += direction * STEP_PER_TICK;
      if (progress >= 1) {
        progress = 1;
        direction = -1;
      } else if (progress <= 0) {
        progress = 0;
        direction = 1;
      }
    };

    tick(); // place the marker at the origin immediately instead of waiting a full tick
    const timer = setInterval(tick, TICK_MS);

    return () => {
      clearInterval(timer);
      // No dedicated stop call on the SDK -- this is what removes the marker/circle.
      stopSimulation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, resolution]);

  const handleStart = () => {
    const origin = originId.trim();
    const destination = destinationId.trim();
    if (!origin || !destination) {
      return;
    }
    setAwaitingResolution(true);
    resolvePois(origin, destination);
  };

  const handleStop = () => {
    setRunning(false);
  };

  const adjustRadius = (delta: number) => {
    setRadius((prev) => Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, prev + delta)));
  };

  const startDisabled = awaitingResolution || (!originId.trim() && !destinationId.trim());

  return (
    <View style={styles.column}>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Origin POI ID"
          value={originId}
          onChangeText={setOriginId}
          autoCapitalize="none"
          editable={!running}
        />
        <TextInput
          style={styles.input}
          placeholder="Destination POI ID"
          value={destinationId}
          onChangeText={setDestinationId}
          autoCapitalize="none"
          editable={!running}
        />
      </View>

      <View style={styles.radiusRow}>
        <Text style={styles.label}>Accuracy radius: {radius} m</Text>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepperButton}
            disabled={radius <= RADIUS_MIN}
            onPress={() => adjustRadius(-RADIUS_STEP)}>
            <Text style={styles.buttonText}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.stepperButton}
            disabled={radius >= RADIUS_MAX}
            onPress={() => adjustRadius(RADIUS_STEP)}>
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={running ? styles.buttonSecondary : styles.button}
        disabled={running ? false : startDisabled}
        onPress={running ? handleStop : handleStart}>
        <Text style={styles.buttonText}>
          {running
            ? 'Stop position simulation'
            : awaitingResolution
              ? 'Resolving…'
              : 'Simulate position between POIs'}
        </Text>
      </TouchableOpacity>
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
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: '#fff',
    fontSize: 15,
  },
  stepper: {
    flexDirection: 'row',
    gap: 8,
  },
  stepperButton: {
    backgroundColor: '#333',
    borderRadius: 6,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: '#E74C3C',
    fontSize: 13,
  },
  button: {
    backgroundColor: '#057DBC',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#333',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default SimulatedPositionOverlay;
