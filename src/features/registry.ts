import * as React from 'react';

import { MapOptions } from '../bridge/VisioMapView';
import { CUSTOM_DATA_MAP_HASH } from '../demoMap';
import { StringKey } from '../i18n/strings';
import IconMarkerPanel from './3d-icon-marker/IconMarkerPanel';
import AccessibleModePanel from './accessible-mode/AccessibleModePanel';
import AccuracyCircleStylePanel from './accuracy-circle-style/AccuracyCircleStylePanel';
import AddLocalePanel from './add-locale/AddLocalePanel';
import AuthTokenInfo from './auth-token/AuthTokenInfo';
import CameraLockOnPositionPanel from './camera-lock-on-position/CameraLockOnPositionPanel';
import CameraProjectionScreen from './camera-projection-toggle/CameraProjectionScreen';
import CameraShowcasePanel from './camera-showcase-carousel/CameraShowcasePanel';
import CategoryHighlightPanel from './category-highlight/CategoryHighlightPanel';
import ClickableSurfacePanel from './clickable-surface/ClickableSurfacePanel';
import ComputeNavigationPanel from './compute-navigation/ComputeNavigationPanel';
import CustomBaseUrlScreen from './custom-base-url/CustomBaseUrlScreen';
import CustomDataPanel from './custom-data/CustomDataPanel';
import CustomNavigationTracePanel from './custom-navigation-trace/CustomNavigationTracePanel';
import TextLabelPanel from './custom-text-label/TextLabelPanel';
import CustomThemePanel from './custom-theme/CustomThemePanel';
import DynamicPoiCrudPanel from './dynamic-poi-crud/DynamicPoiCrudPanel';
import ExploreModePanel from './explore-mode/ExploreModePanel';
import FloorSelectorPanel from './floor-selector/FloorSelectorPanel';
import GeofencingPanel from './geofencing/GeofencingPanel';
import GoToPoiPanel from './goto-poi/GoToPoiPanel';
import HtmlMarkerPanel from './html-overlay-marker/HtmlMarkerPanel';
import NativeUiReplacementPanel from './native-ui-replacement/NativeUiReplacementPanel';
import NavigationExcludeModalitiesPanel from './navigation-exclude-modalities/NavigationExcludeModalitiesPanel';
import OccupancySimulatedPanel from './occupancy-simulated/OccupancySimulatedPanel';
import PoiClickPanel from './poi-click/PoiClickPanel';
import ResetViewPanel from './reset-view/ResetViewPanel';
import RuntimeLocalePanel from './runtime-locale/RuntimeLocalePanel';
import SimulatedPositionPanel from './simulated-position/SimulatedPositionPanel';
import { PanelProps } from './types';
import UIPartVisibilityPanel from './ui-part-visibility/UIPartVisibilityPanel';

// One entry per feature: menu title/description, plus what its screen shows. A feature
// either has a Panel, shown over the shared map shell (shell/FeatureMap.tsx: map + FAB
// + bottom sheet), optionally with its own `map` options; or a Screen of its own, when
// it needs state above the map (its map options change at runtime) or no map at all.
// Adding a feature = adding its folder and its entry here.
export interface FeatureEntry {
  slug: string;
  titleKey: StringKey;
  descriptionKey: StringKey;
  Panel?: React.ComponentType<PanelProps>;
  // fab: false hides the FAB (the panel opens itself).
  map?: MapOptions & { fab?: boolean };
  Screen?: React.ComponentType;
}

export const featureRegistry = [
  { slug: 'reset-view', titleKey: 'resetView.title', descriptionKey: 'resetView.description', Panel: ResetViewPanel },
  {
    slug: 'occupancy-simulated',
    titleKey: 'occupancySimulated.title',
    descriptionKey: 'occupancySimulated.description',
    Panel: OccupancySimulatedPanel,
  },
  { slug: 'goto-poi', titleKey: 'gotoPoi.title', descriptionKey: 'gotoPoi.description', Panel: GoToPoiPanel },
  {
    slug: 'compute-navigation',
    titleKey: 'computeNavigation.title',
    descriptionKey: 'computeNavigation.description',
    Panel: ComputeNavigationPanel,
  },
  {
    slug: 'custom-navigation-trace',
    titleKey: 'customNavigationTrace.title',
    descriptionKey: 'customNavigationTrace.description',
    Panel: CustomNavigationTracePanel,
  },
  {
    slug: 'navigation-exclude-modalities',
    titleKey: 'navigationExcludeModalities.title',
    descriptionKey: 'navigationExcludeModalities.description',
    Panel: NavigationExcludeModalitiesPanel,
  },
  {
    slug: 'accessible-mode',
    titleKey: 'accessibleMode.title',
    descriptionKey: 'accessibleMode.description',
    Panel: AccessibleModePanel,
  },
  {
    slug: 'poi-click',
    titleKey: 'poiClick.title',
    descriptionKey: 'poiClick.description',
    Panel: PoiClickPanel,
    // The map tap itself opens the panel.
    map: { fab: false },
  },
  {
    slug: 'floor-selector',
    titleKey: 'floorSelector.title',
    descriptionKey: 'floorSelector.description',
    Panel: FloorSelectorPanel,
  },
  {
    slug: 'ui-part-visibility',
    titleKey: 'uiPartVisibility.title',
    descriptionKey: 'uiPartVisibility.description',
    Panel: UIPartVisibilityPanel,
  },
  {
    slug: 'native-ui-replacement',
    titleKey: 'nativeUiReplacement.title',
    descriptionKey: 'nativeUiReplacement.description',
    Panel: NativeUiReplacementPanel,
  },
  {
    slug: 'simulated-position',
    titleKey: 'simulatedPosition.title',
    descriptionKey: 'simulatedPosition.description',
    Panel: SimulatedPositionPanel,
  },
  {
    slug: 'camera-lock-on-position',
    titleKey: 'cameraLockOnPosition.title',
    descriptionKey: 'cameraLockOnPosition.description',
    Panel: CameraLockOnPositionPanel,
  },
  {
    slug: 'accuracy-circle-style',
    titleKey: 'accuracyCircleStyle.title',
    descriptionKey: 'accuracyCircleStyle.description',
    Panel: AccuracyCircleStylePanel,
  },
  {
    slug: 'clickable-surface',
    titleKey: 'clickableSurface.title',
    descriptionKey: 'clickableSurface.description',
    Panel: ClickableSurfacePanel,
  },
  {
    slug: 'custom-data',
    titleKey: 'customData.title',
    descriptionKey: 'customData.description',
    Panel: CustomDataPanel,
    // The shared demo map has no CustomData published, so it would only ever
    // demonstrate the empty state: this screen loads a different, already-published
    // map confirmed to carry real CustomData. See docs/features/custom-data.md.
    map: { mapHash: CUSTOM_DATA_MAP_HASH },
  },
  {
    slug: 'category-highlight',
    titleKey: 'categoryHighlight.title',
    descriptionKey: 'categoryHighlight.description',
    Panel: CategoryHighlightPanel,
  },
  {
    slug: 'dynamic-poi-crud',
    titleKey: 'dynamicPoiCrud.title',
    descriptionKey: 'dynamicPoiCrud.description',
    Panel: DynamicPoiCrudPanel,
  },
  { slug: '3d-icon-marker', titleKey: 'iconMarker.title', descriptionKey: 'iconMarker.description', Panel: IconMarkerPanel },
  {
    slug: 'custom-text-label',
    titleKey: 'customTextLabel.title',
    descriptionKey: 'customTextLabel.description',
    Panel: TextLabelPanel,
  },
  {
    slug: 'html-overlay-marker',
    titleKey: 'htmlOverlayMarker.title',
    descriptionKey: 'htmlOverlayMarker.description',
    Panel: HtmlMarkerPanel,
  },
  {
    slug: 'runtime-locale',
    titleKey: 'runtimeLocale.title',
    descriptionKey: 'runtimeLocale.description',
    Panel: RuntimeLocalePanel,
  },
  { slug: 'explore-mode', titleKey: 'exploreMode.title', descriptionKey: 'exploreMode.description', Panel: ExploreModePanel },
  { slug: 'add-locale', titleKey: 'addLocale.title', descriptionKey: 'addLocale.description', Panel: AddLocalePanel },
  { slug: 'geofencing', titleKey: 'geofencing.title', descriptionKey: 'geofencing.description', Panel: GeofencingPanel },
  {
    slug: 'custom-base-url',
    titleKey: 'customBaseUrl.title',
    descriptionKey: 'customBaseUrl.description',
    Screen: CustomBaseUrlScreen,
  },
  {
    slug: 'custom-theme',
    titleKey: 'customTheme.title',
    descriptionKey: 'customTheme.description',
    Panel: CustomThemePanel,
    // Themes only change the scene lights, which are only rendered with shadows
    // enabled -- on for this screen only, see docs/features/custom-theme.md.
    map: { enableShadows: true },
  },
  {
    slug: 'camera-projection-toggle',
    titleKey: 'cameraProjection.title',
    descriptionKey: 'cameraProjection.description',
    Screen: CameraProjectionScreen,
  },
  {
    slug: 'camera-showcase-carousel',
    titleKey: 'cameraShowcase.title',
    descriptionKey: 'cameraShowcase.description',
    Panel: CameraShowcasePanel,
  },
  {
    slug: 'auth-token',
    titleKey: 'authToken.title',
    descriptionKey: 'authToken.description',
    // Code sample only: this demo has no protected map, so the screen is a text page
    // pointing to auth-token/AuthTokenSample.tsx and never attempts a load. See
    // docs/features/auth-token.md.
    Screen: AuthTokenInfo,
  },
] as const satisfies readonly FeatureEntry[];

export type FeatureSlug = (typeof featureRegistry)[number]['slug'];

export const findFeature = (slug: FeatureSlug): FeatureEntry | undefined =>
  (featureRegistry as readonly FeatureEntry[]).find((feature) => feature.slug === slug);
