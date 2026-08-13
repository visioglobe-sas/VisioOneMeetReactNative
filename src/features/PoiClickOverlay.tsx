import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ClickedPoi } from '../screens/useVisioMap';

interface Props {
  pois: ClickedPoi[];
}

const PoiClickOverlay = ({ pois }: Props) => (
  <View>
    <Text style={styles.title}>Tapped place</Text>
    {pois.map((poi, index) => (
      // A single tap can hit several overlapping POIs, and the SDK doesn't guarantee
      // unique ids across them here, so index keeps entries stable within one event.
      <View key={`${poi.id}-${index}`} style={styles.entry}>
        <Text style={styles.name}>{poi.name}</Text>
        <Text style={styles.meta}>ID: {poi.id}</Text>
        {poi.floorId ? <Text style={styles.meta}>Floor: {poi.floorId}</Text> : null}
        {poi.categories.length > 0 ? (
          <Text style={styles.meta}>Categories: {poi.categories.join(', ')}</Text>
        ) : null}
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  entry: {
    backgroundColor: '#222',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  name: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  meta: {
    color: '#aaa',
    fontSize: 13,
  },
});

export default PoiClickOverlay;
