import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { VisioMapBridge } from '../components/VisioMapView';

interface Props {
  startItinerary: VisioMapBridge['startItinerary'];
}

const ComputeNavigationOverlay = ({ startItinerary }: Props) => {
  const [origin, setOrigin] = React.useState('');
  const [destination, setDestination] = React.useState('');

  return (
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
      <TouchableOpacity
        style={styles.button}
        onPress={() => startItinerary(origin, destination, false)}>
        <Text style={styles.buttonText}>Itinerary</Text>
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
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ComputeNavigationOverlay;
