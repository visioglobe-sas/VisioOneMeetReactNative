import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import BottomSheet from '../components/BottomSheet';
import { useLocale } from '../i18n/useLocale';
import { FeatureProps } from './types';

// The panel is opened by the map tap itself (see FeatureScreen.tsx), not by a FAB.
const PoiClickFeature = ({ ctx, sheet }: FeatureProps) => {
  const { t } = useLocale();
  return (
    <BottomSheet {...sheet}>
      <Text style={styles.title}>{t('poiClick.panelTitle')}</Text>
      {ctx.clickedPois.map((poi, index) => (
        // A single tap can hit several overlapping POIs, and the SDK doesn't guarantee
        // unique ids across them here, so index keeps entries stable within one event.
        <View key={`${poi.id}-${index}`} style={styles.entry}>
          <Text style={styles.name}>{poi.name}</Text>
          <Text style={styles.meta}>{t('poiClick.id', { id: poi.id })}</Text>
          {poi.floorId ? <Text style={styles.meta}>{t('poiClick.floor', { floor: poi.floorId })}</Text> : null}
          {poi.categories.length > 0 ? (
            <Text style={styles.meta}>
              {t('poiClick.categories', { categories: poi.categories.join(', ') })}
            </Text>
          ) : null}
        </View>
      ))}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  entry: {
    backgroundColor: '#222',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
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

export default PoiClickFeature;
