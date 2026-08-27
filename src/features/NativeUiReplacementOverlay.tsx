import * as React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { VenueLayoutInfo, VisioMapBridge } from '../components/VisioMapView';
import { useLocale } from '../i18n/useLocale';
import FloorSelectorOverlay from './FloorSelectorOverlay';

interface Props {
  venueLayout: VenueLayoutInfo;
  goToFloor: VisioMapBridge['goToFloor'];
  goToBuilding: VisioMapBridge['goToBuilding'];
  setUIPartVisible: VisioMapBridge['setUIPartVisible'];
}

// Reuses floor-selector's own overlay verbatim -- the whole point of this feature is
// that the app's existing native picker needs no changes to stand in for the SDK's
// widget, see docs/features/native-ui-replacement.md.
const NativeUiReplacementOverlay = ({ venueLayout, goToFloor, goToBuilding, setUIPartVisible }: Props) => {
  const { t } = useLocale();
  // Mirrors the screen-level default applied once the map is ready (see
  // FeatureScreen.tsx's SdkFloorSelectorDefaultOff) -- the SDK's own floor-selector
  // widget starts hidden, so this switch starts off too, without a bridge round trip.
  const [sdkFloorSelectorVisible, setSdkFloorSelectorVisible] = React.useState(false);

  const toggle = (isVisible: boolean) => {
    setSdkFloorSelectorVisible(isVisible);
    setUIPartVisible('floorSelector', isVisible);
  };

  return (
    <View style={styles.column}>
      <View style={styles.row}>
        <Text style={styles.label}>{t('nativeUiReplacement.toggleLabel')}</Text>
        <Switch value={sdkFloorSelectorVisible} onValueChange={toggle} />
      </View>
      <Text style={styles.hint}>{t('nativeUiReplacement.hint')}</Text>
      <FloorSelectorOverlay venueLayout={venueLayout} goToFloor={goToFloor} goToBuilding={goToBuilding} />
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: {
    color: '#fff',
    fontSize: 15,
    flexShrink: 1,
    paddingRight: 12,
  },
  hint: {
    color: '#aaa',
    fontSize: 12,
  },
});

export default NativeUiReplacementOverlay;
