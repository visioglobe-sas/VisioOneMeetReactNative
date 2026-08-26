import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomSheet from '../components/BottomSheet';
import VisioMapView, {
  CustomDataLookupResult,
  CustomDataRefreshOutcome,
  PositionSimulationResolution,
  VenueLayoutInfo,
  VisioMapBridge,
} from '../components/VisioMapView';
import { featureRegistry } from '../features/registry';
import ClickableSurfaceOverlay from '../features/ClickableSurfaceOverlay';
import ComputeNavigationOverlay from '../features/ComputeNavigationOverlay';
import CustomDataOverlay from '../features/CustomDataOverlay';
import FloorSelectorOverlay from '../features/FloorSelectorOverlay';
import GoToPoiOverlay from '../features/GoToPoiOverlay';
import OccupancySimulatedOverlay from '../features/OccupancySimulatedOverlay';
import PoiClickOverlay from '../features/PoiClickOverlay';
import ResetViewOverlay from '../features/ResetViewOverlay';
import SimulatedPositionOverlay from '../features/SimulatedPositionOverlay';
import UIPartVisibilityOverlay from '../features/UIPartVisibilityOverlay';
import { useLocale } from '../i18n/useLocale';
import { RootStackParamList } from '../navigation/RootNavigator';
import { ClickedPoi } from './useVisioMap';

type Props = NativeStackScreenProps<RootStackParamList, 'Feature'>;

// custom-data feature: the shared DEMO_MAP_HASH (VisioMapView.tsx) has no CustomData
// published, so it would only ever demonstrate the empty state. This is a different,
// already-published map confirmed (via the mapserver API) to carry real CustomData
// -- see docs/features/custom-data.md for the known POI ids with real data. Passed
// as VisioMapView's mapHash prop only for this one slug; every other screen keeps
// getting the shared demo map by not passing the prop.
const CUSTOM_DATA_MAP_HASH = 'kd9426d8cb3f1c532f22b5bcbd325c280bd351feb';

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

  const renderFeatureContent = (
    bridge: VisioMapBridge,
    clickedPois: ClickedPoi[],
    venueLayout: VenueLayoutInfo,
    positionSimulation: { resolution: PositionSimulationResolution | null; error: string | null },
    customData: { refresh: CustomDataRefreshOutcome | null; lookup: CustomDataLookupResult | null },
  ) => {
    switch (slug) {
      case 'reset-view':
        return <ResetViewOverlay resetMap={bridge.resetMap} />;
      case 'occupancy-simulated':
        return <OccupancySimulatedOverlay updateOccupancy={bridge.updateOccupancy} />;
      case 'goto-poi':
        return <GoToPoiOverlay goToPlace={bridge.goToPlace} clearPlace={bridge.clearPlace} />;
      case 'compute-navigation':
        return <ComputeNavigationOverlay startItinerary={bridge.startItinerary} />;
      case 'poi-click':
        return <PoiClickOverlay pois={clickedPois} />;
      case 'floor-selector':
        return (
          <FloorSelectorOverlay
            venueLayout={venueLayout}
            goToFloor={bridge.goToFloor}
            goToBuilding={bridge.goToBuilding}
          />
        );
      case 'ui-part-visibility':
        return <UIPartVisibilityOverlay setUIPartVisible={bridge.setUIPartVisible} />;
      case 'simulated-position':
        return (
          <SimulatedPositionOverlay
            resolvePois={bridge.resolvePositionSimulationPois}
            injectTrackedPosition={bridge.injectTrackedPosition}
            stopSimulation={bridge.stopPositionSimulation}
            resolution={positionSimulation.resolution}
            error={positionSimulation.error}
          />
        );
      case 'camera-lock-on-position':
        // Same tracking UI as simulated-position (a moving tracked position is needed
        // to see the camera lock's effect at all) plus the extra toggle, enabled by
        // passing setCameraLockOnPosition -- see SimulatedPositionOverlay.tsx.
        return (
          <SimulatedPositionOverlay
            resolvePois={bridge.resolvePositionSimulationPois}
            injectTrackedPosition={bridge.injectTrackedPosition}
            stopSimulation={bridge.stopPositionSimulation}
            resolution={positionSimulation.resolution}
            error={positionSimulation.error}
            setCameraLockOnPosition={bridge.setCameraLockOnPosition}
          />
        );
      case 'clickable-surface':
        return <ClickableSurfaceOverlay setSurfaceInteractive={bridge.setSurfaceInteractive} />;
      case 'custom-data':
        return (
          <CustomDataOverlay
            refreshCustomData={bridge.refreshCustomData}
            getPoiCustomData={bridge.getPoiCustomData}
            refresh={customData.refresh}
            lookup={customData.lookup}
          />
        );
      default:
        return null;
    }
  };

  // Unlike the other features, poi-click has no FAB-driven controls to open: the map
  // tap itself is the trigger. onPoiClick fires from the WebView's onMessage handler
  // (a plain event, not a render pass), so opening the panel here is a normal setState
  // call, not a cross-component render-phase update.
  const handlePoiClick = () => {
    if (slug === 'poi-click') {
      setControlsVisible(true);
    }
  };

  return (
    <VisioMapView
      mapHash={slug === 'custom-data' ? CUSTOM_DATA_MAP_HASH : undefined}
      onPoiClick={handlePoiClick}
      renderOverlay={(bridge, _status, clickedPois, venueLayout, positionSimulation, customData) => (
        <>
          {slug === 'poi-click' ? (
            !controlsVisible && clickedPois.length === 0 ? (
              <View style={[styles.hint, { bottom: 24 + insets.bottom }]}>
                <Text style={styles.hintText}>Tap a place on the map to see its info.</Text>
              </View>
            ) : null
          ) : (
            <TouchableOpacity
              style={[styles.fab, { bottom: 24 + insets.bottom }]}
              onPress={() => setControlsVisible(true)}>
              <Text style={styles.fabIcon}>⚙</Text>
            </TouchableOpacity>
          )}
          <BottomSheet visible={controlsVisible} onClose={() => setControlsVisible(false)}>
            {renderFeatureContent(bridge, clickedPois, venueLayout, positionSimulation, customData)}
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
});

export default FeatureScreen;
