import * as React from 'react';
import { StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { VisioMapBridge } from '../components/VisioMapView';

// navigation-exclude-modalities feature: the segment-particularity attribute string
// that excludes the elevator on this demo venue. The SDK's own JSDoc comment on
// excludedAttributes suggests 'elevator', but live testing against this venue's data
// (see docs/features/navigation-exclude-modalities.md) confirms the real attribute is
// 'lift' -- the instruction attached to the elevator hop of an unrestricted route
// reads attributes: ['lift', 'B1-lift-1'].
const ELEVATOR_ATTRIBUTE = 'lift';

interface Props {
  startItinerary: VisioMapBridge['startItinerary'];
}

const NavigationExcludeModalitiesOverlay = ({ startItinerary }: Props) => {
  const [origin, setOrigin] = React.useState('');
  const [destination, setDestination] = React.useState('');
  // Read only when Itinerary is pressed -- toggling it alone doesn't recompute
  // whatever route is already on screen.
  const [avoidElevator, setAvoidElevator] = React.useState(false);

  const handleCompute = () => {
    startItinerary(origin, destination, false, avoidElevator ? [ELEVATOR_ATTRIBUTE] : undefined);
  };

  return (
    <View style={styles.column}>
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

      <View style={styles.toggleRow}>
        <Text style={styles.label}>Avoid elevator</Text>
        <Switch value={avoidElevator} onValueChange={setAvoidElevator} />
      </View>
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: '#fff',
    fontSize: 15,
  },
});

export default NavigationExcludeModalitiesOverlay;
