import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { VisioMapBridge } from '../components/VisioMapView';

interface Props {
  goToPlace: VisioMapBridge['goToPlace'];
  clearPlace: VisioMapBridge['clearPlace'];
}

const GoToPoiOverlay = ({ goToPlace, clearPlace }: Props) => {
  const [placeId, setPlaceId] = React.useState('');

  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        placeholder="Place ID"
        value={placeId}
        onChangeText={setPlaceId}
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={() => goToPlace(placeId)}>
        <Text style={styles.buttonText}>Go</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonSecondary} onPress={clearPlace}>
        <Text style={styles.buttonText}>Clear</Text>
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

export default GoToPoiOverlay;
