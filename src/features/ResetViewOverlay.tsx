import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { VisioMapBridge } from '../components/VisioMapView';

interface Props {
  resetMap: VisioMapBridge['resetMap'];
}

const ResetViewOverlay = ({ resetMap }: Props) => (
  <TouchableOpacity style={styles.buttonSecondary} onPress={resetMap}>
    <Text style={styles.buttonText}>Reset view</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
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

export default ResetViewOverlay;
