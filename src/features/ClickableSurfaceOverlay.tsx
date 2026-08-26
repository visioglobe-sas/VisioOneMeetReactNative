import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { VisioMapBridge } from '../components/VisioMapView';

interface Props {
  setSurfaceInteractive: VisioMapBridge['setSurfaceInteractive'];
}

const ClickableSurfaceOverlay = ({ setSurfaceInteractive }: Props) => {
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
      <TouchableOpacity
        style={styles.button}
        onPress={() => setSurfaceInteractive(placeId, true)}>
        <Text style={styles.buttonText}>Enable</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={() => setSurfaceInteractive(placeId, false)}>
        <Text style={styles.buttonText}>Disable</Text>
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

export default ClickableSurfaceOverlay;
