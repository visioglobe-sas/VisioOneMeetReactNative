import * as React from 'react';
import { StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { VisioMapBridge } from '../components/VisioMapView';
import { RADIUS_MAX, RADIUS_MIN, SimulatedPositionSession } from './useSimulatedPositionSession';

const RADIUS_STEP = 1;

// Purely presentational: the simulation state and its tick loop live in
// useSimulatedPositionSession, owned by the feature screen, so they survive this
// panel being closed and reopened -- see docs/features/simulated-position.md.
interface Props {
  session: SimulatedPositionSession;
  // Optional: only the camera-lock-on-position feature passes this, which is what
  // makes the "Recenter camera on position" toggle below appear at all -- the plain
  // simulated-position feature renders the same component without it.
  setCameraLockOnPosition?: VisioMapBridge['setCameraLockOnPosition'];
  // Mirror of the SDK's view.lockCameraPositionOnTracking (camera-lock-on-position
  // only), pushed from the WebView on every trackingon/trackingoff/trackingchanged
  // event. The toggle shows this value rather than an app-side copy, because the SDK
  // changes the lock by itself: on when tracking starts, off on a user pan, off when
  // tracking stops.
  cameraLockOnPosition?: boolean;
}

const SimulatedPositionOverlay = ({
  session,
  setCameraLockOnPosition,
  cameraLockOnPosition = false,
}: Props) => {
  const {
    originId,
    setOriginId,
    destinationId,
    setDestinationId,
    radius,
    adjustRadius,
    running,
    awaitingResolution,
    error,
    start,
    stop,
  } = session;

  // Only asks the SDK -- the Switch then follows the 'trackingchanged' event the SDK
  // dispatches back (see cameraLockOnPosition above).
  const handleCameraLockToggle = (locked: boolean) => {
    setCameraLockOnPosition?.(locked);
  };

  const startDisabled = awaitingResolution || (!originId.trim() || !destinationId.trim());

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
        onPress={running ? stop : start}>
        <Text style={styles.buttonText}>
          {running
            ? 'Stop position simulation'
            : awaitingResolution
              ? 'Resolving…'
              : 'Simulate position between POIs'}
        </Text>
      </TouchableOpacity>

      {setCameraLockOnPosition ? (
        <View style={styles.lockRow}>
          <Text style={styles.label}>Recenter camera on position</Text>
          <Switch value={cameraLockOnPosition} onValueChange={handleCameraLockToggle} disabled={!running} />
        </View>
      ) : null}
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
  lockRow: {
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
