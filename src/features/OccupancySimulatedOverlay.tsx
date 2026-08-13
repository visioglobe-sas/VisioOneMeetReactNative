import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { VisioMapBridge } from '../components/VisioMapView';

// Stand-in for a real occupancy sensor feed: cycles a POI's surface through these
// colors on a timer. See docs/features/occupancy-simulated.md.
const OCCUPANCY_COLORS = ['#2ECC71', '#F1C40F', '#E74C3C']; // free, about to be occupied, occupied
const OCCUPANCY_INTERVAL_MS = 2500;

interface Props {
  updateOccupancy: VisioMapBridge['updateOccupancy'];
}

const OccupancySimulatedOverlay = ({ updateOccupancy }: Props) => {
  const [placeId, setPlaceId] = React.useState('');
  const [simulateOccupancy, setSimulateOccupancy] = React.useState(false);

  React.useEffect(() => {
    const targetPlaceId = placeId.trim();
    if (!simulateOccupancy || !targetPlaceId) {
      return;
    }

    let colorIndex = 0;
    updateOccupancy([{ planId: targetPlaceId, color: OCCUPANCY_COLORS[colorIndex] }]);
    const timer = setInterval(() => {
      colorIndex = (colorIndex + 1) % OCCUPANCY_COLORS.length;
      updateOccupancy([{ planId: targetPlaceId, color: OCCUPANCY_COLORS[colorIndex] }]);
    }, OCCUPANCY_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      // Reset the surface rather than leaving it stuck on the last simulated color.
      updateOccupancy([{ planId: targetPlaceId, color: undefined }]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulateOccupancy, placeId]);

  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        placeholder="Place ID"
        value={placeId}
        onChangeText={setPlaceId}
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={simulateOccupancy ? styles.button : styles.buttonSecondary}
        disabled={!simulateOccupancy && !placeId.trim()}
        onPress={() => setSimulateOccupancy((prev) => !prev)}>
        <Text style={styles.buttonText}>
          {simulateOccupancy ? 'Stop occupancy simulation' : 'Simulate occupancy on Place ID'}
        </Text>
      </TouchableOpacity>
    </View>
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
    backgroundColor: '#057DBC',
    borderRadius: 6,
    paddingHorizontal: 14,
    justifyContent: 'center',
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

export default OccupancySimulatedOverlay;
