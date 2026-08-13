import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomSheet from '../components/BottomSheet';
import VisioMapView, { VisioMapBridge } from '../components/VisioMapView';
import { featureRegistry } from '../features/registry';
import ComputeNavigationOverlay from '../features/ComputeNavigationOverlay';
import GoToPoiOverlay from '../features/GoToPoiOverlay';
import OccupancySimulatedOverlay from '../features/OccupancySimulatedOverlay';
import ResetViewOverlay from '../features/ResetViewOverlay';
import { useLocale } from '../i18n/useLocale';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Feature'>;

const FeatureScreen = ({ route, navigation }: Props) => {
  const { slug } = route.params;
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const feature = featureRegistry.find((item) => item.slug === slug);
  const [controlsVisible, setControlsVisible] = React.useState(false);

  React.useEffect(() => {
    if (feature) {
      navigation.setOptions({ title: t(feature.titleKey) });
    }
  }, [feature, navigation, t]);

  const renderFeatureContent = (bridge: VisioMapBridge) => {
    switch (slug) {
      case 'reset-view':
        return <ResetViewOverlay resetMap={bridge.resetMap} />;
      case 'occupancy-simulated':
        return <OccupancySimulatedOverlay updateOccupancy={bridge.updateOccupancy} />;
      case 'goto-poi':
        return <GoToPoiOverlay goToPlace={bridge.goToPlace} clearPlace={bridge.clearPlace} />;
      case 'compute-navigation':
        return <ComputeNavigationOverlay startItinerary={bridge.startItinerary} />;
      default:
        return null;
    }
  };

  return (
    <VisioMapView
      renderOverlay={(bridge) => (
        <>
          <TouchableOpacity
            style={[styles.fab, { bottom: 24 + insets.bottom }]}
            onPress={() => setControlsVisible(true)}>
            <Text style={styles.fabIcon}>⚙</Text>
          </TouchableOpacity>
          <BottomSheet visible={controlsVisible} onClose={() => setControlsVisible(false)}>
            {renderFeatureContent(bridge)}
          </BottomSheet>
        </>
      )}
    />
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

export default FeatureScreen;
