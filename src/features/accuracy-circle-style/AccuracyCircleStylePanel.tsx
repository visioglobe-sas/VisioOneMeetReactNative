import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import BottomSheet from '../../components/BottomSheet';
import ColorChips from '../../components/ColorChips';
import { TRACKING_FROM, TRACKING_TO } from '../../demoMap';
import { useLocale } from '../../i18n/useLocale';
import { StringKey } from '../../i18n/strings';
import SimulatedPositionControls from '../../shared/positionTracking/SimulatedPositionControls';
import {
  SimulatedPositionSession,
  useSimulatedPositionSession,
} from '../../shared/positionTracking/useSimulatedPositionSession';
import { PanelProps } from '../types';
import { usePositionTrackerStyleBridge } from './bridge';

// Pre-filled radius for the session; the origin/destination POIs come from demoMap.ts
// like on the other tracking screens.
const DEFAULT_RADIUS = 6;

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

interface PositionTrackerStyle {
  color: string;
  opacity: number;
}

// The SDK's own defaults, i.e. what it resets to whenever tracking stops.
const DEFAULT_POSITION_TRACKER_STYLE: PositionTrackerStyle = {
  color: COLOR_PRESETS[0].value,
  opacity: 0.3,
};

// The tracking session (fields, loop) is owned by the panel component below -- see
// useSimulatedPositionSession. It also re-applies the selected style on every Start
// through the session's onTrackingStarted (the SDK resets color/opacity to its defaults
// whenever tracking stops).
interface Props {
  session: SimulatedPositionSession;
  setPositionTrackerStyle: (color: string, opacity: number) => void;
  // Owned by the panel component so it survives the bottom sheet being closed/reopened
  // (there's no getter for the current graphic options on the SDK side).
  style: PositionTrackerStyle;
  onStyleChange: (style: PositionTrackerStyle) => void;
}

const AccuracyCircleStyleControls = ({ session, setPositionTrackerStyle, style, onStyleChange }: Props) => {
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
      <SimulatedPositionControls session={session} />

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

// Same tracking UI as simulated-position (pre-filled POIs, 6 m radius) plus
// color/opacity controls.
const AccuracyCircleStylePanel = ({ sheet }: PanelProps) => {
  const { setPositionTrackerStyle } = usePositionTrackerStyleBridge();
  const [trackerStyle, setTrackerStyle] = React.useState<PositionTrackerStyle>(
    DEFAULT_POSITION_TRACKER_STYLE,
  );
  const trackerStyleRef = React.useRef(trackerStyle);
  trackerStyleRef.current = trackerStyle;

  const session = useSimulatedPositionSession({
    // The SDK resets color/opacity to its defaults on every stop, so re-apply the
    // selection on every start, right before the first injected position.
    onTrackingStarted: () =>
      setPositionTrackerStyle(trackerStyleRef.current.color, trackerStyleRef.current.opacity),
    // Same pre-filled pair on the 4 tracking screens (see demoMap.ts).
    initialOriginId: TRACKING_FROM,
    initialDestinationId: TRACKING_TO,
    initialRadius: DEFAULT_RADIUS,
  });

  return (
    <BottomSheet {...sheet}>
      <AccuracyCircleStyleControls
        session={session}
        setPositionTrackerStyle={setPositionTrackerStyle}
        style={trackerStyle}
        onStyleChange={setTrackerStyle}
      />
    </BottomSheet>
  );
};

export default AccuracyCircleStylePanel;
