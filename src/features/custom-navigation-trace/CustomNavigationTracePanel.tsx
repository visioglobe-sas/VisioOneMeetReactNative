import * as React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import BottomSheet from '../../components/BottomSheet';
import ItineraryForm, { useItineraryFields } from '../../components/ItineraryForm';
import { ITINERARY_FROM, ITINERARY_TO } from '../../demoMap';
import { useItineraryBridge } from '../compute-navigation/bridge';
import { PanelProps } from '../types';
import { NavigationTraceStyle, useNavigationTraceBridge } from './bridge';

// A fixed catalogue of NavigationTraceUpdateOptions
// (colors only, see docs/features/custom-navigation-trace.md) applied via
// venue.updateNavigationTrace(). The SDK has no "reset to default" call, so
// 'visioglobeBlue' isn't a fake no-op -- it re-states the Line defaults documented in
// the SDK's own typings (progressColor '#0094F0', previewColor '#C5C5C5') as an
// explicit preset like any other.
const TRACE_PRESETS: Record<string, NavigationTraceStyle> = {
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
type TracePresetKey = keyof typeof TRACE_PRESETS;
const TRACE_PRESET_KEYS = Object.keys(TRACE_PRESETS) as TracePresetKey[];
const DEFAULT_TRACE_PRESET: TracePresetKey = 'visioglobeBlue';

// The compute-navigation form plus the color-preset swatch row.
const CustomNavigationTracePanel = ({ sheet }: PanelProps) => {
  const { startItinerary } = useItineraryBridge();
  const { updateNavigationTrace } = useNavigationTraceBridge();
  const fields = useItineraryFields(ITINERARY_FROM, ITINERARY_TO);
  // The last-tapped preset, so the *next* computed itinerary is styled with it too, not
  // just whatever trace is currently on screen.
  const [selectedPreset, setSelectedPreset] = React.useState<TracePresetKey>(DEFAULT_TRACE_PRESET);

  const handleCompute = () => {
    fields.markSubmitted();
    startItinerary(fields.origin.trim(), fields.destination.trim(), false);
    // Sent right after start_itinerary -- the page handles messages in the order it
    // receives them, so by the time this one runs, the trace start_itinerary just
    // created is already the one tracked on the page side. See
    // docs/features/custom-navigation-trace.md.
    updateNavigationTrace(TRACE_PRESETS[selectedPreset]);
  };

  const handleSelectPreset = (key: TracePresetKey) => {
    setSelectedPreset(key);
    // Restyles whatever trace is already displayed, if any -- a no-op on the page side
    // otherwise.
    updateNavigationTrace(TRACE_PRESETS[key]);
  };

  return (
    <BottomSheet {...sheet}>
      <ItineraryForm
        origin={fields.origin}
        destination={fields.destination}
        onChangeOrigin={fields.setOrigin}
        onChangeDestination={fields.setDestination}
        onSubmit={handleCompute}
        submittedAt={fields.submittedAt}
      />

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
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  swatchRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
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

export default CustomNavigationTracePanel;
