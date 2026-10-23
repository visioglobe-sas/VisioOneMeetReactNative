import * as React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import BottomSheet from '../components/BottomSheet';
import ItineraryForm, { useItineraryFields } from '../components/ItineraryForm';
import { ITINERARY_FROM, ITINERARY_TO } from '../demoMap';
import { NavigationTraceStyle } from '../screens/useVisioMap';
import { FeatureProps } from './types';

// custom-navigation-trace feature: a fixed catalogue of NavigationTraceUpdateOptions
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

interface Props extends FeatureProps {
  // custom-navigation-trace only: shows the color-preset swatch row. The plain
  // compute-navigation feature renders the same component without it.
  withTraceStyle?: boolean;
}

const ComputeNavigationFeature = ({ ctx, sheet, withTraceStyle = false }: Props) => {
  const { startItinerary, updateNavigationTrace } = ctx.bridge;
  const fields = useItineraryFields(ITINERARY_FROM, ITINERARY_TO);
  // custom-navigation-trace only -- the last-tapped preset, so the *next* computed
  // itinerary is styled with it too, not just whatever trace is currently on screen.
  const [selectedPreset, setSelectedPreset] = React.useState<TracePresetKey>(DEFAULT_TRACE_PRESET);

  const handleCompute = () => {
    fields.markSubmitted();
    startItinerary(fields.origin.trim(), fields.destination.trim(), false);
    if (withTraceStyle) {
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
    // side otherwise.
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
        commandError={ctx.commandError}
        submittedAt={fields.submittedAt}
      />

      {withTraceStyle ? (
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

export default ComputeNavigationFeature;
