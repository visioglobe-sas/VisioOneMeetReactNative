import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PositionSimulationResolution, VisioMapBridge } from '../components/VisioMapView';
import { useLocale } from '../i18n/useLocale';
import { StringKey } from '../i18n/strings';
import SimulatedPositionOverlay from './SimulatedPositionOverlay';

// Two POIs on the shared demo map that resolve to a position and are far enough apart
// to see the dot move.
const DEFAULT_ORIGIN_ID = 'B4-UL00-ID0009';
const DEFAULT_DESTINATION_ID = 'B4-UL00-ID0010';
const DEFAULT_RADIUS = 6;

const COLOR_PRESETS: { value: string; labelKey: StringKey }[] = [
  { value: '#0094f0', labelKey: 'accuracyCircleStyle.colorDefault' },
  { value: '#e53935', labelKey: 'accuracyCircleStyle.colorRed' },
  { value: '#43a047', labelKey: 'accuracyCircleStyle.colorGreen' },
  { value: '#8e24aa', labelKey: 'accuracyCircleStyle.colorPurple' },
];

// Opacity is handled in tenths (1..10) to avoid floating-point drift on the stepper.
// The minimum is 0.1, not 0: the SDK skips its opacity validation on a falsy value, so
// 0 isn't a meaningful "fully transparent" setting.
const OPACITY_TENTHS_MIN = 1;
const OPACITY_TENTHS_MAX = 10;

export interface PositionTrackerStyle {
  color: string;
  opacity: number;
}

// The SDK's own defaults, i.e. what it resets to whenever tracking stops.
export const DEFAULT_POSITION_TRACKER_STYLE: PositionTrackerStyle = {
  color: COLOR_PRESETS[0].value,
  opacity: 0.3,
};

interface Props {
  resolvePois: VisioMapBridge['resolvePositionSimulationPois'];
  injectTrackedPosition: VisioMapBridge['injectTrackedPosition'];
  stopSimulation: VisioMapBridge['stopPositionSimulation'];
  resolution: PositionSimulationResolution | null;
  error: string | null;
  setPositionTrackerStyle: VisioMapBridge['setPositionTrackerStyle'];
  // Owned by the parent screen so it survives the bottom sheet being closed/reopened
  // (there's no getter for the current graphic options on the SDK side).
  style: PositionTrackerStyle;
  onStyleChange: (style: PositionTrackerStyle) => void;
}

const AccuracyCircleStyleOverlay = ({
  resolvePois,
  injectTrackedPosition,
  stopSimulation,
  resolution,
  error,
  setPositionTrackerStyle,
  style,
  onStyleChange,
}: Props) => {
  const { t } = useLocale();
  const opacityTenths = Math.round(style.opacity * 10);

  // Read by the tracking-start callback, which is captured once per run by
  // SimulatedPositionOverlay's interval effect.
  const styleRef = React.useRef(style);
  styleRef.current = style;

  const applyStyle = (next: PositionTrackerStyle) => {
    setPositionTrackerStyle(next.color, next.opacity);
    onStyleChange(next);
  };

  // The SDK resets color/opacity to its defaults on every stop, so re-apply the
  // selection on every start, right before the first injected position.
  const handleTrackingStarted = () => {
    setPositionTrackerStyle(styleRef.current.color, styleRef.current.opacity);
  };

  const adjustOpacity = (delta: number) => {
    const tenths = Math.min(OPACITY_TENTHS_MAX, Math.max(OPACITY_TENTHS_MIN, opacityTenths + delta));
    applyStyle({ ...style, opacity: tenths / 10 });
  };

  return (
    <View style={styles.column}>
      <SimulatedPositionOverlay
        resolvePois={resolvePois}
        injectTrackedPosition={injectTrackedPosition}
        stopSimulation={stopSimulation}
        resolution={resolution}
        error={error}
        onTrackingStarted={handleTrackingStarted}
        initialOriginId={DEFAULT_ORIGIN_ID}
        initialDestinationId={DEFAULT_DESTINATION_ID}
        initialRadius={DEFAULT_RADIUS}
      />

      <Text style={styles.label}>{t('accuracyCircleStyle.color')}</Text>
      <View style={styles.chips}>
        {COLOR_PRESETS.map(({ value, labelKey }) => {
          const isActive = value === style.color;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => applyStyle({ ...style, color: value })}>
              <View style={[styles.swatch, { backgroundColor: value }]} />
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{t(labelKey)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.opacityRow}>
        <Text style={styles.label}>
          {t('accuracyCircleStyle.opacity')}: {style.opacity.toFixed(1)}
        </Text>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepperButton}
            disabled={opacityTenths <= OPACITY_TENTHS_MIN}
            onPress={() => adjustOpacity(-1)}>
            <Text style={styles.stepperText}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.stepperButton}
            disabled={opacityTenths >= OPACITY_TENTHS_MAX}
            onPress={() => adjustOpacity(1)}>
            <Text style={styles.stepperText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.hint}>{t('accuracyCircleStyle.hint')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    gap: 10,
  },
  label: {
    color: '#fff',
    fontSize: 15,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#222',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipActive: {
    borderColor: '#fff',
    backgroundColor: '#333',
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  chipText: {
    color: '#bbb',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  opacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  stepperText: {
    color: '#fff',
    fontWeight: '600',
  },
  hint: {
    color: '#999',
    fontSize: 12,
  },
});

export default AccuracyCircleStyleOverlay;
