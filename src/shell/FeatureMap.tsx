import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SheetProps } from '../components/BottomSheet';
import VisioMapView, { MapOptions } from '../bridge/VisioMapView';

export interface FeatureMapProps extends MapOptions {
  // VisioMapView's React key: changing it remounts the WebView, i.e. a fresh
  // loadVenue + createView (custom-base-url, camera-projection-toggle).
  mapKey?: string;
  // false: no FAB, the feature opens its panel itself (poi-click opens it on a map tap).
  fab?: boolean;
  // The feature's panel. It is rendered for the whole life of the map (outside the
  // bottom sheet) and renders the sheet itself, so the state it owns survives the
  // sheet being closed and reopened; leaving the screen unmounts it.
  children: (sheet: SheetProps, openSheet: () => void) => React.ReactNode;
}

// The map of a feature screen: VisioMapView, the FAB opening the feature's panel, and
// the panel itself.
const FeatureMap = ({ mapKey, fab = true, children, ...mapOptions }: FeatureMapProps) => {
  const insets = useSafeAreaInsets();
  const [sheetVisible, setSheetVisible] = React.useState(false);
  const openSheet = React.useCallback(() => setSheetVisible(true), []);
  const sheet: SheetProps = { visible: sheetVisible, onClose: () => setSheetVisible(false) };

  return (
    <VisioMapView key={mapKey} {...mapOptions}>
      {fab ? (
        <TouchableOpacity
          testID="feature-fab"
          style={[styles.fab, { bottom: 24 + insets.bottom }]}
          onPress={openSheet}>
          <Text style={styles.fabIcon}>⚙</Text>
        </TouchableOpacity>
      ) : null}
      {children(sheet, openSheet)}
    </VisioMapView>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#057DBC',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 24,
  },
});

export default FeatureMap;
