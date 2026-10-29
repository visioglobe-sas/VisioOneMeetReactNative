import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomSheet from '../../components/BottomSheet';
import { useLocale } from '../../i18n/useLocale';
import { PanelProps } from '../types';
import { ClickedPoi, usePoiClick } from './bridge';

// No FAB on this screen (see the registry): the map tap itself is the trigger and opens
// the panel. The 'poi_click' handler runs on a WebView message (an event, not a render
// pass), so opening the sheet there is a plain setState.
const PoiClickPanel = ({ sheet, openSheet }: PanelProps) => {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const [clickedPois, setClickedPois] = React.useState<ClickedPoi[]>([]);

  usePoiClick((pois) => {
    setClickedPois(pois);
    openSheet();
  });

  return (
    <>
    {!sheet.visible && clickedPois.length === 0 ? (
      <View style={[styles.hint, { bottom: 24 + insets.bottom }]}>
        <Text style={styles.hintText}>{t('poiClick.hint')}</Text>
      </View>
    ) : null}
    <BottomSheet {...sheet}>
      <Text style={styles.title}>{t('poiClick.panelTitle')}</Text>
      {clickedPois.map((poi, index) => (
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
    </>
  );
};

const styles = StyleSheet.create({
  hint: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  hintText: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
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

export default PoiClickPanel;
