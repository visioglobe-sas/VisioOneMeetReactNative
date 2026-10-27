import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ColorChips from '../components/ColorChips';
import { VisioMapBridge } from '../components/VisioMapView';
import { useLocale } from '../i18n/useLocale';
import { StringKey } from '../i18n/strings';
import SimulatedPositionOverlay from './SimulatedPositionOverlay';
import { SimulatedPositionSession } from './useSimulatedPositionSession';

// Pre-filled radius for the session (owned by the screen, see TrackingFeatureHost); the
// origin/destination POIs come from demoMap.ts like on the other tracking screens.
export const DEFAULT_RADIUS = 6;

const COLOR_PRESETS: { value: string; labelKey: StringKey }[] = [
  { value: '#0094f0', labelKey: 'color.default' },
  { value: '#e53935', labelKey: 'color.red' },
  { value: '#43a047', labelKey: 'color.green' },
  { value: '#8e24aa', labelKey: 'color.purple' },
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

// The tracking session (fields, loop) is owned by the feature screen -- see
// useSimulatedPositionSession. The screen also re-applies the selected style on every
// Start through the session's onTrackingStarted (the SDK resets color/opacity to its
// defaults whenever tracking stops).
interface Props {
  session: SimulatedPositionSession;
  setPositionTrackerStyle: VisioMapBridge['setPositionTrackerStyle'];
  // Owned by the parent screen so it survives the bottom sheet being closed/reopened
  // (there's no getter for the current graphic options on the SDK side).
  style: PositionTrackerStyle;
  onStyleChange: (style: PositionTrackerStyle) => void;
}

const AccuracyCircleStyleOverlay = ({ session, setPositionTrackerStyle, style, onStyleChange }: Props) => {
  const { t } = useLocale();
  const opacityTenths = Math.round(style.opacity * 10);

  const applyStyle = (next: PositionTrackerStyle) => {
    setPositionTrackerStyle(next.color, next.opacity);
    onStyleChange(next);
  };

  const adjustOpacity = (delta: number) => {
    const tenths = Math.min(OPACITY_TENTHS_MAX, Math.max(OPACITY_TENTHS_MIN, opacityTenths + delta));
    applyStyle({ ...style, opacity: tenths / 10 });
  };

  return (
    <View style={styles.column}>
      <SimulatedPositionOverlay session={session} />

      <Text style={styles.label}>{t('common.color')}</Text>
      <ColorChips
        options={COLOR_PRESETS.map(({ value, labelKey }) => ({ value, label: t(labelKey) }))}
        selected={style.color}
        onSelect={(value) => applyStyle({ ...style, color: value })}
      />

      <View style={styles.opacityRow}>
        <Text style={styles.label}>
          {t('accuracyCircleStyle.opacity', { value: style.opacity.toFixed(1) })}
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
