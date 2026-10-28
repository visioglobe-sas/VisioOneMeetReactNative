import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import BottomSheet from '../../components/BottomSheet';
import { OCCUPANCY_POI_ID } from '../../demoMap';
import { useLocale } from '../../i18n/useLocale';
import { PanelProps } from '../types';
import { useOccupancySimulatedBridge } from './bridge';

// Stand-in for a real occupancy sensor feed: cycles a POI's surface through these
// colors on a timer. See docs/features/occupancy-simulated.md.
const OCCUPANCY_COLORS = ['#2ECC71', '#F1C40F', '#E74C3C']; // free, about to be occupied, occupied
const OCCUPANCY_INTERVAL_MS = 2500;

// The place id, the running flag and the timer live in this component, which stays
// mounted for the whole screen: closing the panel doesn't stop the simulation, and
// reopening it shows Stop while it runs. Exactly one timer; leaving the screen stops it.
const OccupancySimulatedPanel = ({ sheet }: PanelProps) => {
  const { t } = useLocale();
  const { updateOccupancy } = useOccupancySimulatedBridge();
  const [placeId, setPlaceId] = React.useState(OCCUPANCY_POI_ID);
  // The place being simulated, null when stopped. Fixed for the duration of a run, so
  // editing the field doesn't restart or retarget the running loop.
  const [runningPlaceId, setRunningPlaceId] = React.useState<string | null>(null);
  const updateOccupancyRef = React.useRef(updateOccupancy);
  updateOccupancyRef.current = updateOccupancy;

  React.useEffect(() => {
    if (!runningPlaceId) {
      return;
    }
    let colorIndex = 0;
    const apply = (color: string | undefined) =>
      updateOccupancyRef.current([{ planId: runningPlaceId, color }]);
    apply(OCCUPANCY_COLORS[colorIndex]);
    const timer = setInterval(() => {
      colorIndex = (colorIndex + 1) % OCCUPANCY_COLORS.length;
      apply(OCCUPANCY_COLORS[colorIndex]);
    }, OCCUPANCY_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      // Back to the map's own color rather than leaving the last simulated one.
      apply('initial');
    };
  }, [runningPlaceId]);

  const running = runningPlaceId !== null;
  const toggle = () => setRunningPlaceId(running ? null : placeId.trim() || null);

  return (
    <BottomSheet {...sheet}>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder={t('common.placeId')}
          placeholderTextColor="#666"
          value={placeId}
          onChangeText={setPlaceId}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!running}
        />
        <TouchableOpacity
          style={[running ? styles.button : styles.buttonSecondary, !running && !placeId.trim() && styles.disabled]}
          disabled={!running && !placeId.trim()}
          onPress={toggle}>
          <Text style={styles.buttonText}>
            {running ? t('occupancySimulated.stop') : t('occupancySimulated.start')}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
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
    flexShrink: 1,
    backgroundColor: '#057DBC',
    borderRadius: 6,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  buttonSecondary: {
    flexShrink: 1,
    backgroundColor: '#333',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default OccupancySimulatedPanel;
