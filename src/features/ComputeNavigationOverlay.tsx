import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { VisioMapBridge } from '../components/VisioMapView';
import { NavigationTraceStyle } from '../screens/useVisioMap';

// custom-navigation-trace feature: a fixed catalogue of NavigationTraceUpdateOptions
// (colors only, see docs/features/custom-navigation-trace.md) applied via
// venue.updateNavigationTrace(). The SDK has no "reset to default" call, so
// 'visioglobeBlue' isn't a fake no-op -- it re-states the Line defaults documented in
// the SDK's own typings (progressColor '#0094F0', previewColor '#C5C5C5') as an
// explicit preset like any other.
export const TRACE_PRESETS: Record<string, NavigationTraceStyle> = {
  visioglobeBlue: {
    progressColor: '#0094F0',
    progressOutlineColor: '#FFFFFF',
    progressFutureColor: '#C5C5C5',
    previewColor: '#C5C5C5',
    previewOutlineColor: '#FFFFFF',
  },
  brandRed: {
    progressColor: '#E53935',
    progressOutlineColor: '#FFFFFF',
    progressFutureColor: '#F8C9C7',
    previewColor: '#F8C9C7',
    previewOutlineColor: '#FFFFFF',
  },
  brandGreen: {
    progressColor: '#2E7D32',
    progressOutlineColor: '#FFFFFF',
    progressFutureColor: '#C8E6C9',
    previewColor: '#C8E6C9',
    previewOutlineColor: '#FFFFFF',
  },
  brandPurple: {
    progressColor: '#6A1B9A',
    progressOutlineColor: '#FFFFFF',
    progressFutureColor: '#E1BEE7',
    previewColor: '#E1BEE7',
    previewOutlineColor: '#FFFFFF',
  },
};
export type TracePresetKey = keyof typeof TRACE_PRESETS;
const TRACE_PRESET_KEYS = Object.keys(TRACE_PRESETS) as TracePresetKey[];
const DEFAULT_TRACE_PRESET: TracePresetKey = 'visioglobeBlue';

interface Props {
  startItinerary: VisioMapBridge['startItinerary'];
  // Optional: only the custom-navigation-trace feature passes this, which is what makes
  // the color-preset swatch row below appear at all -- the plain compute-navigation
  // feature renders the same component without it.
  updateNavigationTrace?: VisioMapBridge['updateNavigationTrace'];
}

const ComputeNavigationOverlay = ({ startItinerary, updateNavigationTrace }: Props) => {
  const [origin, setOrigin] = React.useState('');
  const [destination, setDestination] = React.useState('');
  // custom-navigation-trace feature only -- remembers the last-tapped preset so the
  // *next* computed itinerary is styled with it too, not just whatever trace is
  // currently on screen.
  const [selectedPreset, setSelectedPreset] = React.useState<TracePresetKey>(DEFAULT_TRACE_PRESET);

  const handleCompute = () => {
    startItinerary(origin, destination, false);
    if (updateNavigationTrace) {
      // Sent right after start_itinerary -- the WebView handles messages in the order
      // it receives them, so by the time this one runs, the trace startItinerary just
      // created is already the one tracked on the WebView side. See
      // docs/features/custom-navigation-trace.md.
      updateNavigationTrace(TRACE_PRESETS[selectedPreset]);
    }
  };

  const handleSelectPreset = (key: TracePresetKey) => {
    setSelectedPreset(key);
    // Restyles whatever trace is already displayed, if any -- a no-op on the WebView
    // side otherwise (see updateNavigationTrace in useVisioMap.ts).
    updateNavigationTrace?.(TRACE_PRESETS[key]);
  };

  return (
    <View style={updateNavigationTrace ? styles.column : styles.row}>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="From (place ID)"
          value={origin}
          onChangeText={setOrigin}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="To (place ID)"
          value={destination}
          onChangeText={setDestination}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={handleCompute}>
          <Text style={styles.buttonText}>Itinerary</Text>
        </TouchableOpacity>
      </View>

      {updateNavigationTrace ? (
        <View style={styles.swatchRow}>
          {TRACE_PRESET_KEYS.map((key) => (
            <TouchableOpacity
              key={key}
              accessibilityLabel={key}
              style={[
                styles.swatch,
                { backgroundColor: TRACE_PRESETS[key].progressColor },
                selectedPreset === key && styles.swatchSelected,
              ]}
              onPress={() => handleSelectPreset(key)}
            />
          ))}
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
  swatchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: '#fff',
  },
});

export default ComputeNavigationOverlay;
