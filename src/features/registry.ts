import { StringKey } from '../i18n/strings';

export type FeatureSlug =
  | 'reset-view'
  | 'occupancy-simulated'
  | 'goto-poi'
  | 'compute-navigation'
  | 'poi-click'
  | 'floor-selector'
  | 'ui-part-visibility'
  | 'native-ui-replacement'
  | 'simulated-position'
  | 'camera-lock-on-position'
  | 'clickable-surface'
  | 'custom-data'
  | 'category-highlight'
  | 'dynamic-poi-crud'
  | 'runtime-locale'
  | 'explore-mode'
  | 'add-locale';

export interface FeatureDefinition {
  slug: FeatureSlug;
  titleKey: StringKey;
  descriptionKey: StringKey;
}

export const featureRegistry: FeatureDefinition[] = [
  {
    slug: 'reset-view',
    titleKey: 'resetView.title',
    descriptionKey: 'resetView.description',
  },
  {
    slug: 'occupancy-simulated',
    titleKey: 'occupancySimulated.title',
    descriptionKey: 'occupancySimulated.description',
  },
  {
    slug: 'goto-poi',
    titleKey: 'gotoPoi.title',
    descriptionKey: 'gotoPoi.description',
  },
  {
    slug: 'compute-navigation',
    titleKey: 'computeNavigation.title',
    descriptionKey: 'computeNavigation.description',
  },
  {
    slug: 'poi-click',
    titleKey: 'poiClick.title',
    descriptionKey: 'poiClick.description',
  },
  {
    slug: 'floor-selector',
    titleKey: 'floorSelector.title',
    descriptionKey: 'floorSelector.description',
  },
  {
    slug: 'ui-part-visibility',
    titleKey: 'uiPartVisibility.title',
    descriptionKey: 'uiPartVisibility.description',
  },
  {
    slug: 'native-ui-replacement',
    titleKey: 'nativeUiReplacement.title',
    descriptionKey: 'nativeUiReplacement.description',
  },
  {
    slug: 'simulated-position',
    titleKey: 'simulatedPosition.title',
    descriptionKey: 'simulatedPosition.description',
  },
  {
    slug: 'camera-lock-on-position',
    titleKey: 'cameraLockOnPosition.title',
    descriptionKey: 'cameraLockOnPosition.description',
  },
  {
    slug: 'clickable-surface',
    titleKey: 'clickableSurface.title',
    descriptionKey: 'clickableSurface.description',
  },
  {
    slug: 'custom-data',
    titleKey: 'customData.title',
    descriptionKey: 'customData.description',
  },
  {
    slug: 'category-highlight',
    titleKey: 'categoryHighlight.title',
    descriptionKey: 'categoryHighlight.description',
  },
  {
    slug: 'dynamic-poi-crud',
    titleKey: 'dynamicPoiCrud.title',
    descriptionKey: 'dynamicPoiCrud.description',
  },
  {
    slug: 'runtime-locale',
    titleKey: 'runtimeLocale.title',
    descriptionKey: 'runtimeLocale.description',
  },
  {
    slug: 'explore-mode',
    titleKey: 'exploreMode.title',
    descriptionKey: 'exploreMode.description',
  },
  {
    slug: 'add-locale',
    titleKey: 'addLocale.title',
    descriptionKey: 'addLocale.description',
  },
];
