import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomSheet from '../components/BottomSheet';
import VisioMapView, {
  AddLocaleResult,
  CategoryOption,
  CustomDataLookupResult,
  CustomDataRefreshOutcome,
  DEFAULT_BASE_URL,
  DynamicPoiCreateResult,
  GeofenceZone,
  LocaleInfo,
  PositionSimulationResolution,
  VenueLayoutInfo,
  VisioMapBridge,
} from '../components/VisioMapView';
import { featureRegistry } from '../features/registry';
import AddLocaleOverlay from '../features/AddLocaleOverlay';
import CategoryHighlightOverlay from '../features/CategoryHighlightOverlay';
import ClickableSurfaceOverlay from '../features/ClickableSurfaceOverlay';
import ComputeNavigationOverlay from '../features/ComputeNavigationOverlay';
import CustomBaseUrlOverlay from '../features/CustomBaseUrlOverlay';
import CustomDataOverlay from '../features/CustomDataOverlay';
import DynamicPoiCrudOverlay from '../features/DynamicPoiCrudOverlay';
import ExploreModeOverlay from '../features/ExploreModeOverlay';
import FloorSelectorOverlay from '../features/FloorSelectorOverlay';
import GeofencingOverlay from '../features/GeofencingOverlay';
import GoToPoiOverlay from '../features/GoToPoiOverlay';
import NativeUiReplacementOverlay from '../features/NativeUiReplacementOverlay';
import OccupancySimulatedOverlay from '../features/OccupancySimulatedOverlay';
import PoiClickOverlay from '../features/PoiClickOverlay';
import ResetViewOverlay from '../features/ResetViewOverlay';
import RuntimeLocaleOverlay from '../features/RuntimeLocaleOverlay';
import SimulatedPositionOverlay from '../features/SimulatedPositionOverlay';
import UIPartVisibilityOverlay from '../features/UIPartVisibilityOverlay';
import { useLocale } from '../i18n/useLocale';
import { RootStackParamList } from '../navigation/RootNavigator';
import { ClickedPoi, ExploreMode } from './useVisioMap';

type Props = NativeStackScreenProps<RootStackParamList, 'Feature'>;

// custom-data feature: the shared DEMO_MAP_HASH (VisioMapView.tsx) has no CustomData
// published, so it would only ever demonstrate the empty state. This is a different,
// already-published map confirmed (via the mapserver API) to carry real CustomData
// -- see docs/features/custom-data.md for the known POI ids with real data. Passed
// as VisioMapView's mapHash prop only for this one slug; every other screen keeps
// getting the shared demo map by not passing the prop.
const CUSTOM_DATA_MAP_HASH = 'kd9426d8cb3f1c532f22b5bcbd325c280bd351feb';

// native-ui-replacement feature: hides the SDK's own floor-selector widget
// (view.setUIPartVisible('floorSelector', false), same bridge call as
// ui-part-visibility) as soon as the map is ready, so the screen opens with only the
// app's native floor selector visible/functional -- not just once the FAB panel
// (NativeUiReplacementOverlay) has been opened. A plain child of the always-mounted
// renderOverlay tree rather than logic inlined in FeatureScreen itself, because
// BottomSheet's content (a React Native Modal) isn't mounted -- and its effects don't
// run -- until the panel has been opened at least once, see BottomSheet.tsx.
const SdkFloorSelectorDefaultOff = ({
  status,
  setUIPartVisible,
}: {
  status: 'loading' | 'ready' | 'error';
  setUIPartVisible: VisioMapBridge['setUIPartVisible'];
}) => {
  React.useEffect(() => {
    if (status === 'ready') {
      setUIPartVisible('floorSelector', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  return null;
};

const FeatureScreen = ({ route, navigation }: Props) => {
  const { slug } = route.params;
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const feature = featureRegistry.find((item) => item.slug === slug);
  const [controlsVisible, setControlsVisible] = React.useState(false);
  // custom-base-url feature: baseURL is a loadVenue option, not a live property, so
  // "Reload" can't just call a setter on the already-loaded venue -- bumping this key
  // forces VisioMapView (and its WebView) to fully unmount/remount against the current
  // customBaseUrl value instead. See docs/features/custom-base-url.md.
  const [customBaseUrl, setCustomBaseUrl] = React.useState(DEFAULT_BASE_URL);
  const [customBaseUrlReloadKey, setCustomBaseUrlReloadKey] = React.useState(0);

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
    categories: CategoryOption[],
    dynamicPoiCreateResult: DynamicPoiCreateResult | null,
    locale: { info: LocaleInfo; error: string | null },
    addLocaleResult: AddLocaleResult | null,
    exploreMode: ExploreMode,
    geofencing: { zone: GeofenceZone | null; error: string | null },
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
      case 'native-ui-replacement':
        return (
          <NativeUiReplacementOverlay
            venueLayout={venueLayout}
            goToFloor={bridge.goToFloor}
            goToBuilding={bridge.goToBuilding}
            setUIPartVisible={bridge.setUIPartVisible}
          />
        );
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
      case 'category-highlight':
        return (
          <CategoryHighlightOverlay
            categories={categories}
            highlightCategory={bridge.highlightCategory}
            clearCategoryHighlight={bridge.clearCategoryHighlight}
          />
        );
      case 'dynamic-poi-crud':
        return (
          <DynamicPoiCrudOverlay
            createDynamicPoi={bridge.createDynamicPoi}
            updateDynamicPoiLabel={bridge.updateDynamicPoiLabel}
            removeDynamicPoi={bridge.removeDynamicPoi}
            createResult={dynamicPoiCreateResult}
          />
        );
      case 'runtime-locale':
        return (
          <RuntimeLocaleOverlay
            localeInfo={locale.info}
            error={locale.error}
            setLocale={bridge.setLocale}
          />
        );
      case 'explore-mode':
        return <ExploreModeOverlay exploreMode={exploreMode} setExploreMode={bridge.setExploreMode} />;
      case 'add-locale':
        return (
          <AddLocaleOverlay
            addLocaleResult={addLocaleResult}
            addLocale={bridge.addLocale}
            localeInfo={locale.info}
            localeError={locale.error}
            setLocale={bridge.setLocale}
          />
        );
      case 'geofencing':
        return (
          <GeofencingOverlay
            resolvePois={bridge.resolvePositionSimulationPois}
            injectTrackedPosition={bridge.injectTrackedPosition}
            stopSimulation={bridge.stopPositionSimulation}
            resolution={positionSimulation.resolution}
            error={positionSimulation.error}
            resolveZone={bridge.resolveGeofenceZone}
            setGeofenceAlert={bridge.setGeofenceAlert}
            zone={geofencing.zone}
            zoneError={geofencing.error}
          />
        );
      case 'custom-base-url':
        return (
          <CustomBaseUrlOverlay
            baseURL={customBaseUrl}
            onChangeBaseURL={setCustomBaseUrl}
            onReload={() => setCustomBaseUrlReloadKey((key) => key + 1)}
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
      key={slug === 'custom-base-url' ? `custom-base-url-${customBaseUrlReloadKey}` : slug}
      mapHash={slug === 'custom-data' ? CUSTOM_DATA_MAP_HASH : undefined}
      baseURL={slug === 'custom-base-url' ? customBaseUrl : undefined}
      onPoiClick={handlePoiClick}
      renderOverlay={(
        bridge,
        status,
        clickedPois,
        venueLayout,
        positionSimulation,
        customData,
        categories,
        dynamicPoiCreateResult,
        locale,
        addLocaleResult,
        exploreMode,
        geofencing,
      ) => (
        <>
          {slug === 'native-ui-replacement' ? (
            <SdkFloorSelectorDefaultOff status={status} setUIPartVisible={bridge.setUIPartVisible} />
          ) : null}
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
            {renderFeatureContent(
              bridge,
              clickedPois,
              venueLayout,
              positionSimulation,
              customData,
              categories,
              dynamicPoiCreateResult,
              locale,
              addLocaleResult,
              exploreMode,
              geofencing,
            )}
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
