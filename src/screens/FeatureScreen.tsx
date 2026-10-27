import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomSheet, { SheetProps } from '../components/BottomSheet';
import VisioMapView, { DEFAULT_BASE_URL } from '../components/VisioMapView';
import { CUSTOM_DATA_MAP_HASH } from '../demoMap';
import AccessibleModeFeature from '../features/AccessibleModeOverlay';
import AuthTokenInfo from '../features/AuthTokenInfo';
import AddLocaleOverlay from '../features/AddLocaleOverlay';
import CameraProjectionOverlay from '../features/CameraProjectionOverlay';
import CameraShowcaseOverlay from '../features/CameraShowcaseOverlay';
import CategoryHighlightFeature from '../features/CategoryHighlightOverlay';
import ClickableSurfaceFeature from '../features/ClickableSurfaceOverlay';
import ComputeNavigationFeature from '../features/ComputeNavigationOverlay';
import CustomBaseUrlOverlay from '../features/CustomBaseUrlOverlay';
import CustomDataFeature from '../features/CustomDataOverlay';
import CustomThemeOverlay, {
  CustomThemeSelection,
  DEFAULT_CUSTOM_THEME_SELECTION,
} from '../features/CustomThemeOverlay';
import DynamicPoiCrudFeature from '../features/DynamicPoiCrudOverlay';
import ExploreModeOverlay from '../features/ExploreModeOverlay';
import FloorSelectorFeature from '../features/FloorSelectorOverlay';
import GoToPoiFeature from '../features/GoToPoiOverlay';
import HtmlMarkerFeature from '../features/HtmlMarkerOverlay';
import IconMarkerFeature from '../features/IconMarkerOverlay';
import NativeUiReplacementFeature from '../features/NativeUiReplacementOverlay';
import NavigationExcludeModalitiesFeature from '../features/NavigationExcludeModalitiesOverlay';
import OccupancySimulatedFeature from '../features/OccupancySimulatedOverlay';
import PoiClickFeature from '../features/PoiClickOverlay';
import ResetViewFeature from '../features/ResetViewOverlay';
import RuntimeLocaleOverlay from '../features/RuntimeLocaleOverlay';
import TextLabelFeature from '../features/TextLabelOverlay';
import TrackingFeatureHost, { isTrackingFeatureSlug } from '../features/TrackingFeatureHost';
import { FeatureContext } from '../features/types';
import UIPartVisibilityFeature from '../features/UIPartVisibilityOverlay';
import { useLocale } from '../i18n/useLocale';
import { RootStackParamList } from '../navigation/RootNavigator';
import { CameraProjection } from './useVisioMap';

type Props = NativeStackScreenProps<RootStackParamList, 'Feature'>;

// custom-data feature: the shared DEMO_MAP_HASH has no CustomData published, so it
// would only ever demonstrate the empty state. CUSTOM_DATA_MAP_HASH (demoMap.ts) is a
// different, already-published map confirmed to carry real CustomData -- see
// docs/features/custom-data.md. Passed as VisioMapView's mapHash prop only for this
// one slug; every other screen keeps getting the shared demo map by not passing it.

const FeatureScreen = ({ route }: Props) => {
  const { slug } = route.params;
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const [controlsVisible, setControlsVisible] = React.useState(false);
  // custom-base-url feature: baseURL is a loadVenue option, not a live property, so
  // "Reload" can't just call a setter on the already-loaded venue -- bumping this key
  // forces VisioMapView (and its WebView) to fully unmount/remount against the current
  // customBaseUrl value instead. See docs/features/custom-base-url.md.
  const [customBaseUrl, setCustomBaseUrl] = React.useState(DEFAULT_BASE_URL);
  const [customBaseUrlReloadKey, setCustomBaseUrlReloadKey] = React.useState(0);
  // custom-theme feature: kept at screen level (not in the panel) so it survives the
  // panel being closed to tap a place and see the recolored card.
  const [customThemeSelection, setCustomThemeSelection] = React.useState<CustomThemeSelection>(
    DEFAULT_CUSTOM_THEME_SELECTION,
  );
  // camera-projection-toggle feature: cameraProjection is a createView option only
  // (view.cameraProjection is read-only, no runtime switch), so selecting the other
  // projection changes VisioMapView's `key` below -- a full WebView remount, i.e. a
  // fresh loadVenue + createView({ cameraProjection }) -- same idiom as custom-base-url.
  // See docs/features/camera-projection-toggle.md.
  const [cameraProjection, setCameraProjection] = React.useState<CameraProjection>('perspective');

  // auth-token feature: code sample only -- this demo has no protected map, so the
  // screen is a text page pointing to src/features/AuthTokenSample.tsx and never
  // attempts a load. See docs/features/auth-token.md.
  if (slug === 'auth-token') {
    return <AuthTokenInfo />;
  }

  // The active feature's component. It is rendered in the map's always-mounted overlay
  // tree (not inside the bottom sheet) and renders the sheet itself, so whatever state
  // it owns survives the sheet closing; leaving the screen unmounts it.
  const renderFeature = (ctx: FeatureContext, sheet: SheetProps) => {
    const { bridge, status } = ctx;
    if (isTrackingFeatureSlug(slug)) {
      return <TrackingFeatureHost slug={slug} ctx={ctx} sheet={sheet} />;
    }
    switch (slug) {
      case 'reset-view':
        return <ResetViewFeature ctx={ctx} sheet={sheet} />;
      case 'occupancy-simulated':
        return <OccupancySimulatedFeature ctx={ctx} sheet={sheet} />;
      case 'goto-poi':
        return <GoToPoiFeature ctx={ctx} sheet={sheet} />;
      case 'compute-navigation':
        return <ComputeNavigationFeature ctx={ctx} sheet={sheet} />;
      case 'custom-navigation-trace':
        // Same itinerary form as compute-navigation, plus the color-preset swatch row
        // -- see docs/features/custom-navigation-trace.md.
        return <ComputeNavigationFeature ctx={ctx} sheet={sheet} withTraceStyle />;
      case 'navigation-exclude-modalities':
        return <NavigationExcludeModalitiesFeature ctx={ctx} sheet={sheet} />;
      case 'accessible-mode':
        return <AccessibleModeFeature ctx={ctx} sheet={sheet} />;
      case 'poi-click':
        return <PoiClickFeature ctx={ctx} sheet={sheet} />;
      case 'floor-selector':
        return <FloorSelectorFeature ctx={ctx} sheet={sheet} />;
      case 'ui-part-visibility':
        return <UIPartVisibilityFeature ctx={ctx} sheet={sheet} />;
      case 'native-ui-replacement':
        return <NativeUiReplacementFeature ctx={ctx} sheet={sheet} />;
      case 'clickable-surface':
        return <ClickableSurfaceFeature ctx={ctx} sheet={sheet} />;
      case 'custom-data':
        return <CustomDataFeature ctx={ctx} sheet={sheet} />;
      case 'category-highlight':
        return <CategoryHighlightFeature ctx={ctx} sheet={sheet} />;
      case 'dynamic-poi-crud':
        return <DynamicPoiCrudFeature ctx={ctx} sheet={sheet} />;
      case '3d-icon-marker':
        return <IconMarkerFeature ctx={ctx} sheet={sheet} />;
      case 'custom-text-label':
        return <TextLabelFeature ctx={ctx} sheet={sheet} />;
      case 'html-overlay-marker':
        return <HtmlMarkerFeature ctx={ctx} sheet={sheet} />;
    }
    // The remaining panels keep no state of their own: what they show comes from the
    // map (ctx) or from this screen's state above.
    let content: React.ReactNode = null;
    switch (slug) {
      case 'runtime-locale':
        content = (
          <RuntimeLocaleOverlay
            localeInfo={ctx.locale.info}
            error={ctx.locale.error}
            setLocale={bridge.setLocale}
          />
        );
        break;
      case 'explore-mode':
        content = <ExploreModeOverlay exploreMode={ctx.exploreMode} setExploreMode={bridge.setExploreMode} />;
        break;
      case 'add-locale':
        content = (
          <AddLocaleOverlay
            addLocaleResult={ctx.addLocaleResult}
            addLocale={bridge.addLocale}
            localeInfo={ctx.locale.info}
            localeError={ctx.locale.error}
            setLocale={bridge.setLocale}
          />
        );
        break;
      case 'custom-base-url':
        content = (
          <CustomBaseUrlOverlay
            baseURL={customBaseUrl}
            onChangeBaseURL={setCustomBaseUrl}
            onReload={() => setCustomBaseUrlReloadKey((key) => key + 1)}
          />
        );
        break;
      case 'custom-theme':
        content = (
          <CustomThemeOverlay
            themes={ctx.themes}
            selection={customThemeSelection}
            onSelectionChange={setCustomThemeSelection}
            setTheme={bridge.setTheme}
            setAccentColors={bridge.setAccentColors}
          />
        );
        break;
      case 'camera-projection-toggle':
        content = (
          <CameraProjectionOverlay
            reportedProjection={ctx.reportedCameraProjection}
            requestedProjection={cameraProjection}
            loading={status === 'loading'}
            onSelect={setCameraProjection}
          />
        );
        break;
      case 'camera-showcase-carousel':
        // The tour loop runs in the WebView page (survives this panel closing); the
        // panel only sends start/stop and displays the status the page reports.
        content = (
          <CameraShowcaseOverlay
            status={ctx.cameraCarousel}
            ready={status === 'ready'}
            onStart={bridge.startCameraCarousel}
            onStop={bridge.stopCameraCarousel}
          />
        );
        break;
    }
    return <BottomSheet {...sheet}>{content}</BottomSheet>;
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

  const sheet: SheetProps = { visible: controlsVisible, onClose: () => setControlsVisible(false) };

  return (
    <VisioMapView
      key={
        slug === 'custom-base-url'
          ? `custom-base-url-${customBaseUrlReloadKey}`
          : slug === 'camera-projection-toggle'
            ? `camera-projection-toggle-${cameraProjection}`
            : slug
      }
      mapHash={slug === 'custom-data' ? CUSTOM_DATA_MAP_HASH : undefined}
      baseURL={slug === 'custom-base-url' ? customBaseUrl : undefined}
      // custom-theme: themes only change the scene lights, which are only rendered with
      // shadows enabled -- on for this screen only, see docs/features/custom-theme.md.
      enableShadows={slug === 'custom-theme' ? true : undefined}
      cameraProjection={slug === 'camera-projection-toggle' ? cameraProjection : undefined}
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
        iconMarkerCreateResult,
        textLabelCreateResult,
        htmlMarker,
        themes,
        cameraLockOnPosition,
        reportedCameraProjection,
        cameraCarousel,
        commandError,
      ) => (
        <>
          {slug === 'poi-click' ? (
            !controlsVisible && clickedPois.length === 0 ? (
              <View style={[styles.hint, { bottom: 24 + insets.bottom }]}>
                <Text style={styles.hintText}>{t('poiClick.hint')}</Text>
              </View>
            ) : null
          ) : (
            <TouchableOpacity
              testID="feature-fab"
              style={[styles.fab, { bottom: 24 + insets.bottom }]}
              onPress={() => setControlsVisible(true)}>
              <Text style={styles.fabIcon}>⚙</Text>
            </TouchableOpacity>
          )}
          {renderFeature(
            {
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
              iconMarkerCreateResult,
              textLabelCreateResult,
              htmlMarker,
              themes,
              cameraLockOnPosition,
              reportedCameraProjection,
              cameraCarousel,
              commandError,
            },
            sheet,
          )}
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
